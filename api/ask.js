/* Vercel Edge function: POST /api/ask
   Takes { question, context } in the body. Calls Anthropic Claude Haiku
   with the question + the vault context, returns { answer, model, usage }.

   Requirements:
   - ANTHROPIC_API_KEY set as a Vercel project env var.
   - Request body must be valid JSON.

   Rate-limit-ish guards (light; this is the public demo, not production):
   - Reject questions >800 chars (prompts that big are probably abuse)
   - Reject context >120KB (don't blow up Anthropic costs)
   - Only POST */

export const config = { runtime: "edge" };

const ANTHROPIC_URL    = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL  = "claude-haiku-4-5";
const ANTHROPIC_VER    = "2023-06-01";
const MAX_QUESTION     = 800;
const MAX_CONTEXT_KB   = 120;
const MAX_OUTPUT_TOKENS = 1024;

const SYSTEM_PROMPT =
`You are the AI assistant inside a small nonprofit's development operations workspace.
You have access to the org's vault: donors, grants, projects, calls, recent activity,
and KPIs. Answer questions based ONLY on the provided vault data.

Rules:
- Lead with the answer in the first sentence. Then context.
- Be concise. 2-4 sentences for simple questions. Longer only when asked.
- Cite specific names, dates, and dollar amounts from the vault.
- If the vault doesn't contain the answer, say so plainly. Don't speculate.
- If a question is ambiguous, pick the most useful interpretation and answer it.
- Never invent donors, gifts, or facts. Stay grounded in the data.
- Voice: direct, action-oriented, no filler. No "I'd be happy to help."`;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export default async function handler(req) {
  if (req.method !== "POST") {
    return json(405, { error: "POST only" });
  }
  let body;
  try { body = await req.json(); } catch { return json(400, { error: "Invalid JSON body" }); }

  const question = (body && body.question || "").toString().trim();
  const context  = body && body.context;

  if (!question)                      return json(400, { error: "Missing 'question'" });
  if (question.length > MAX_QUESTION) return json(400, { error: `Question too long (max ${MAX_QUESTION} chars)` });

  const ctxStr = context == null ? "" : (typeof context === "string" ? context : JSON.stringify(context));
  if (ctxStr.length > MAX_CONTEXT_KB * 1024) {
    return json(413, { error: `Context too large (max ${MAX_CONTEXT_KB}KB)` });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(503, {
      error: "API not configured",
      detail: "Set ANTHROPIC_API_KEY in the Vercel project's environment variables, then redeploy.",
    });
  }

  const userMessage =
`# Question
${question}

# Vault data
${ctxStr || "(no vault context provided)"}`;

  try {
    const r = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VER,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!r.ok) {
      let detail;
      try { detail = await r.json(); } catch { detail = await r.text(); }
      return json(r.status, { error: "Anthropic API error", status: r.status, detail });
    }

    const data = await r.json();
    const answer = (data.content && data.content[0] && data.content[0].text) || "";
    return json(200, {
      answer,
      model: data.model,
      usage: data.usage,
    });
  } catch (e) {
    return json(500, { error: "Network error", detail: e.message });
  }
}
