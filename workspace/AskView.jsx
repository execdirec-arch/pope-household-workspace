/* ASK THE VAULT — chat-style synthesis over the workspace data.
   Sends each question + the WORKSPACE_DATA blob to /api/ask, which calls
   Claude Haiku server-side. The vault is the context; the LLM is the lens.

   Conversation state is local to this component (not persisted) — questions
   reset when the user navigates away. That's the right default for now;
   persistence + thread history is a v2 add. */

const SUGGESTED_QUESTIONS = [
  "Who needs a call from me today and why?",
  "What's the single most important thing I should do this morning?",
  "Which donors haven't been contacted in 90+ days?",
  "What grants are due in the next 30 days?",
  "Who's the warmest path to re-engage Dr. Okafor?",
  "How is our recurring-donor program trending?",
  "Where are we leaving money on the table this quarter?",
];

function AskView({ data }) {
  const [history, setHistory] = React.useState([]); // [{ role: "user"|"assistant", text, meta? }]
  const [draft, setDraft] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState(null);
  const scrollRef = React.useRef(null);
  const inputRef = React.useRef(null);

  // Keep the scroll at the bottom as messages arrive.
  React.useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, pending]);

  async function ask(question) {
    const q = question.trim();
    if (!q || pending) return;
    setError(null);
    setDraft("");
    setHistory(h => [...h, { role: "user", text: q }]);
    setPending(true);
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, context: buildVaultContext(data) }),
      });
      const payload = await r.json();
      if (!r.ok) {
        const notConfigured = payload && payload.error === "API not configured";
        const msg = notConfigured
          ? `The Anthropic API key isn't set on this deployment yet. See DEPLOY.md → "Wiring up Ask the vault" for the one-time setup. (~3 min: get a key from console.anthropic.com, add $25 of credit, set ANTHROPIC_API_KEY in Vercel.)`
          : (payload && payload.error) || `Request failed (${r.status})`;
        setHistory(h => [...h, { role: "assistant", text: null, error: msg, kind: notConfigured ? "setup" : "error" }]);
        setError(msg);
        return;
      }
      setHistory(h => [...h, { role: "assistant", text: payload.answer || "(empty answer)", meta: { model: payload.model, usage: payload.usage } }]);
    } catch (e) {
      const msg = e.message || "Network error";
      setHistory(h => [...h, { role: "assistant", text: null, error: msg }]);
      setError(msg);
    } finally {
      setPending(false);
      // Refocus the input for rapid follow-ups.
      setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 0);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(draft);
    }
  }

  function clearHistory() {
    setHistory([]);
    setError(null);
    setDraft("");
  }

  return (
    <div className="ask">
      <div className="view__header">
        <div>
          <h1 className="view__title">Ask the vault.</h1>
          <p className="view__subtitle">
            Plain English. The answer is grounded in your actual donors, grants, calls, and KPIs — not generic advice.
          </p>
        </div>
        <div className="flex-end" style={{ gap: 6 }}>
          {history.length > 0 && (
            <button className="btn btn--ghost btn--sm" onClick={clearHistory}>Clear</button>
          )}
        </div>
      </div>

      <div className="ask__wrap">
        {/* History */}
        <div className="ask__history" ref={scrollRef}>
          {history.length === 0 && (
            <div className="ask__empty">
              <div className="card__eyebrow" style={{ marginBottom: 10 }}>Try one of these</div>
              <div className="ask__suggestions">
                {SUGGESTED_QUESTIONS.map(q => (
                  <button key={q} className="ask__suggestion" onClick={() => ask(q)} disabled={pending}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {history.map((m, i) => (
            <div key={i} className={`ask__msg ask__msg--${m.role}`}>
              {m.role === "user" ? (
                <div className="ask__bubble ask__bubble--user">{m.text}</div>
              ) : m.error ? (
                <div className="ask__bubble ask__bubble--error">
                  <div className="card__eyebrow" style={{ color: "var(--accent-tomato)", fontSize: 9 }}>Couldn't answer</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>{m.error}</div>
                </div>
              ) : (
                <div className="ask__bubble ask__bubble--assistant">
                  <div className="ask__bubble-text">{m.text}</div>
                  {m.meta && m.meta.usage && (
                    <div className="ask__meta">
                      {m.meta.model || "claude"} · {m.meta.usage.input_tokens || 0} in / {m.meta.usage.output_tokens || 0} out
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {pending && (
            <div className="ask__msg ask__msg--assistant">
              <div className="ask__bubble ask__bubble--assistant ask__bubble--pending">
                <span className="ask__dot" />
                <span className="ask__dot" />
                <span className="ask__dot" />
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="ask__composer">
          <textarea
            ref={inputRef}
            className="ask__input"
            placeholder="Ask anything about your donors, grants, or this morning's priorities…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            disabled={pending}
          />
          <button
            className="btn btn--primary ask__send"
            onClick={() => ask(draft)}
            disabled={pending || !draft.trim()}
            title="Send (Enter)"
          >
            {pending ? "Thinking…" : "Ask"}
          </button>
        </div>

        <div className="muted" style={{ fontSize: 10, marginTop: 6, lineHeight: 1.4 }}>
          The vault is your context. Answers are grounded in this org's specific data, not generic templates.
          Powered by Claude.
        </div>
      </div>
    </div>
  );
}

/* Compose the context payload sent to the API. We send a TRIMMED snapshot
   of WORKSPACE_DATA — full enough to answer real questions, lean enough to
   keep token costs predictable. Strips heavy fields the model rarely needs
   (member roster details, full timeline events for every donor, etc.). */
function buildVaultContext(data) {
  if (!data) return null;
  return {
    org: data.org,
    today: {
      date: data.today.date,
      weekday: data.today.weekday,
      countdowns: data.today.countdowns,
      pulse: data.today.pulse,
    },
    schedule: data.schedule,
    todos: data.todos,
    nudges: data.nudges,
    inbox: (data.inbox || []).map(({ id, from, subject, priority, action, tags }) => ({ id, from, subject, priority, action, tags })),
    majorDonors: (data.majorDonors || []).map(d => ({
      id: d.id,
      name: d.name,
      org: d.org,
      status: d.status,
      temperature: d.temperature,
      askImmediate: d.askImmediate,
      askImmediateLabel: d.askImmediateLabel,
      askStrategic: d.askStrategic,
      askStrategicLabel: d.askStrategicLabel,
      nextMeeting: d.nextMeeting,
      relationship: d.relationship,
      lastTouch: d.lastTouch,
      drivers: d.drivers,
      notes: d.notes,
      tensions: d.tensions,
      timeline: d.timeline,
      connectedCapital: d.connectedCapital,
    })),
    members: data.members && {
      totals: data.members.totals,
      growth: data.members.growth,
      levels: data.members.levels,
      campaigns: data.members.campaigns,
      atRisk: (data.members.roster || []).filter(m => m.giving !== "current"),
    },
    grants: data.grants,
    calls: data.calls,
    wips: data.wips,
  };
}

Object.assign(window, { AskView });
