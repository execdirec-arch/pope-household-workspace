/* PROJECTS view — expandable project cards with contacts, milestones, activity log */
function ProjectsView({ data, onSetFocus }) {
  const { useState, useEffect } = React;
  const wips = data.wips || [];

  // Milestone done state: { [projectId]: { [milestoneId]: bool } }
  const [milestones, setMilestones] = useState(() => {
    try { return JSON.parse(localStorage.getItem("phw.milestones") || "{}"); } catch { return {}; }
  });
  useEffect(() => { localStorage.setItem("phw.milestones", JSON.stringify(milestones)); }, [milestones]);

  // Activity logs: { [projectId]: [{id, text, date}] }
  const [logs, setLogs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("phw.projectLogs") || "{}"); } catch { return {}; }
  });
  useEffect(() => { localStorage.setItem("phw.projectLogs", JSON.stringify(logs)); }, [logs]);

  // Expanded state
  const [expanded, setExpanded] = useState({});

  function toggleExpand(id) {
    setExpanded(s => ({ ...s, [id]: !s[id] }));
  }

  function toggleMilestone(projectId, milestoneId, defaultDone) {
    setMilestones(s => {
      const proj = s[projectId] || {};
      const current = proj[milestoneId] != null ? proj[milestoneId] : defaultDone;
      return { ...s, [projectId]: { ...proj, [milestoneId]: !current } };
    });
  }

  function addLog(projectId, text) {
    if (!text.trim()) return;
    const entry = { id: Date.now(), text: text.trim(), date: new Date().toISOString().slice(0, 10) };
    setLogs(s => ({ ...s, [projectId]: [entry, ...(s[projectId] || [])] }));
  }

  function removeLog(projectId, entryId) {
    setLogs(s => ({ ...s, [projectId]: (s[projectId] || []).filter(e => e.id !== entryId) }));
  }

  function getMilestone(projectId, m) {
    const stored = milestones[projectId]?.[m.id];
    return stored != null ? stored : m.done;
  }

  const hot  = wips.filter(w => w.urgency === "hot");
  const warm = wips.filter(w => w.urgency === "warm");
  const cool = wips.filter(w => w.urgency === "cool");

  function renderGroup(items, label) {
    if (!items.length) return null;
    return (
      <div style={{ marginBottom: "var(--section-pad)" }}>
        <div className="section-header">
          <h2 className="section-header__title">{label}</h2>
          <div className="section-header__meta">{items.length} project{items.length !== 1 ? "s" : ""}</div>
        </div>
        <div className="stack">
          {items.map(w => (
            <ProjectCard
              key={w.id}
              wip={w}
              isOpen={!!expanded[w.id]}
              onToggle={() => toggleExpand(w.id)}
              getMilestone={id => getMilestone(w.id, id)}
              onToggleMilestone={(mId, defaultDone) => toggleMilestone(w.id, mId, defaultDone)}
              logEntries={logs[w.id] || []}
              onAddLog={text => addLog(w.id, text)}
              onRemoveLog={id => removeLog(w.id, id)}
              onSetFocus={onSetFocus}
            />
          ))}
        </div>
      </div>
    );
  }

  const totalDone = wips.reduce((s, w) => {
    const done = (w.milestones || []).filter(m => getMilestone(w.id, m)).length;
    return s + done;
  }, 0);
  const totalMilestones = wips.reduce((s, w) => s + (w.milestones || []).length, 0);

  return (
    <div>
      <div className="view__header">
        <div>
          <h1 className="view__title">Projects.</h1>
          <p className="view__subtitle">{hot.length} active · {warm.length} in progress · {cool.length} planning.</p>
        </div>
        <div className="kpi" style={{ minWidth: 140 }}>
          <div className="kpi__label">Milestones</div>
          <div className="kpi__value">{totalDone}/{totalMilestones}</div>
          <div className="kpi__delta kpi__delta--flat">completed</div>
        </div>
      </div>

      {renderGroup(hot, "Active now")}
      {renderGroup(warm, "In progress")}
      {renderGroup(cool, "Planning")}
    </div>
  );
}

function ProjectCard({ wip, isOpen, onToggle, getMilestone, onToggleMilestone, logEntries, onAddLog, onRemoveLog, onSetFocus }) {
  const { useState, useRef, useEffect } = React;
  const [logInput, setLogInput] = useState("");
  const inputRef = useRef(null);

  const urgencyColor = { hot: "var(--accent-tomato)", warm: "#f59e0b", cool: "var(--fg-3)" }[wip.urgency] || "var(--fg-3)";
  const milestones = wip.milestones || [];
  const doneCount = milestones.filter(m => getMilestone(m)).length;
  const pct = milestones.length ? Math.round((doneCount / milestones.length) * 100) : 0;

  function submitLog() {
    if (!logInput.trim()) return;
    onAddLog(logInput);
    setLogInput("");
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Header row — always visible, click to expand */}
      <div
        onClick={onToggle}
        style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, userSelect: "none" }}
      >
        {/* Urgency dot */}
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: urgencyColor, flexShrink: 0, marginTop: 1 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 800, fontSize: 15 }}>{wip.title}</span>
            <span style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{wip.phase}</span>
            {logEntries.length > 0 && (
              <span style={{ fontSize: 11, color: "var(--fg-3)" }}>{logEntries.length} update{logEntries.length !== 1 ? "s" : ""}</span>
            )}
          </div>
          {/* Progress bar */}
          {milestones.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
              <div style={{ flex: 1, height: 4, background: "var(--paper-deep)", borderRadius: 2, overflow: "hidden", maxWidth: 200 }}>
                <div style={{ height: "100%", width: pct + "%", background: pct === 100 ? "#22c55e" : urgencyColor, borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 11, color: "var(--fg-3)", whiteSpace: "nowrap" }}>{doneCount}/{milestones.length}</span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span className="pill pill--muted" style={{ fontSize: 11 }}>{wip.dueLabel}</span>
          <span style={{ fontSize: 18, color: "var(--fg-3)", lineHeight: 1, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>›</span>
        </div>
      </div>

      {/* Expanded detail */}
      {isOpen && (
        <div style={{ borderTop: "1px solid var(--paper-edge)", padding: "16px 18px" }}>

          {/* Summary + owner */}
          <p style={{ fontSize: 13, color: "var(--fg-1)", margin: "0 0 14px", lineHeight: 1.6 }}>{wip.summary}</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

            {/* Contacts */}
            {wip.contacts && wip.contacts.length > 0 && (
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)", fontWeight: 700, marginBottom: 8 }}>Contacts</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {wip.contacts.map((c, i) => (
                    <div key={i} style={{ background: "var(--paper-deep)", borderRadius: 6, padding: "8px 10px" }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "var(--fg-2)", marginBottom: 2 }}>{c.role}</div>
                      {c.phone && (
                        <a href={`tel:${c.phone}`} style={{ fontSize: 12, color: "var(--rehumanize-green)", textDecoration: "none", fontWeight: 600 }}>
                          {c.phone}
                        </a>
                      )}
                      {c.note && <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 3 }}>{c.note}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones */}
            {milestones.length > 0 && (
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)", fontWeight: 700, marginBottom: 8 }}>Milestones</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {milestones.map(m => {
                    const done = getMilestone(m);
                    return (
                      <div
                        key={m.id}
                        onClick={e => { e.stopPropagation(); onToggleMilestone(m.id, m.done); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "4px 0" }}
                      >
                        <div style={{
                          width: 16, height: 16, borderRadius: 4, border: `2px solid ${done ? "#22c55e" : "var(--border)"}`,
                          background: done ? "#22c55e" : "transparent", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {done && <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 13, color: done ? "var(--fg-3)" : "var(--fg-1)", textDecoration: done ? "line-through" : "none" }}>
                          {m.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Next action */}
          <div style={{ background: "var(--paper-deep)", borderRadius: 6, padding: "10px 12px", marginBottom: 16 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)", fontWeight: 700, marginBottom: 4 }}>Next action</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)" }}>{wip.next}</div>
          </div>

          {/* Activity log */}
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)", fontWeight: 700, marginBottom: 8 }}>Activity log</div>

            {/* Log input */}
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Called Progressive, estimate approved, repair scheduled…"
                value={logInput}
                onChange={e => setLogInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitLog()}
                onClick={e => e.stopPropagation()}
                style={{ flex: 1, padding: "7px 10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13, background: "var(--paper)", color: "var(--ink)" }}
              />
              <button
                onClick={e => { e.stopPropagation(); submitLog(); }}
                style={{ padding: "7px 14px", background: "var(--rehumanize-green)", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Log
              </button>
            </div>

            {/* Log entries */}
            {logEntries.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {logEntries.map(e => (
                  <div key={e.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 8px", background: "var(--paper-deep)", borderRadius: 5 }}>
                    <span style={{ fontSize: 11, color: "var(--fg-3)", whiteSpace: "nowrap", marginTop: 1 }}>{e.date}</span>
                    <span style={{ fontSize: 13, flex: 1, color: "var(--fg-1)" }}>{e.text}</span>
                    <button
                      onClick={e2 => { e2.stopPropagation(); onRemoveLog(e.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-3)", fontSize: 14, padding: "0 2px", lineHeight: 1 }}
                    >×</button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--fg-3)", fontStyle: "italic" }}>No updates logged yet.</div>
            )}
          </div>

          {/* Footer actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--paper-edge)" }}>
            <span style={{ fontSize: 11, color: "var(--fg-3)", marginRight: "auto", alignSelf: "center" }}>→ {wip.owner}</span>
            <button
              className="btn btn--ghost btn--sm"
              onClick={e => { e.stopPropagation(); onSetFocus && onSetFocus({ label: wip.title, view: "wips", id: wip.id, meta: wip.next }); }}
            >
              <Icon name="pin" size={11} /> Focus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ProjectsView });
