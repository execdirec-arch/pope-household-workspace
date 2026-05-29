// State sync — reads/writes per-user state blob for cross-device persistence
const { put, list } = require("@vercel/blob");

const ALLOWED = ["pope7446@gmail.com", "olivercpope@gmail.com"];
const SYNC_KEYS = ["phw.milestones", "phw.projectLogs", "phw.disc", "phw.paidCards", "phw.doneIds", "phw.overrides"];

function emailToPath(email) {
  return "state/" + email.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".json";
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", c => (body += c));
    req.on("end", () => { try { resolve(JSON.parse(body)); } catch { reject(new Error("Invalid JSON")); } });
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const email = req.method === "GET" ? req.query?.email : (await readBody(req).then(b => { req._body = b; return b.email; }).catch(() => null));
  const body  = req._body;

  if (!email || !ALLOWED.includes(email.toLowerCase())) {
    return res.status(403).json({ error: "Not authorized" });
  }

  const pathname = emailToPath(email);

  if (req.method === "GET") {
    try {
      const { blobs } = await list({ prefix: pathname });
      if (!blobs.length) return res.status(200).json({});
      const data = await fetch(blobs[0].url).then(r => r.json());
      // Return only the known sync keys
      const filtered = {};
      SYNC_KEYS.forEach(k => { if (data[k] !== undefined) filtered[k] = data[k]; });
      return res.status(200).json(filtered);
    } catch (e) {
      return res.status(200).json({});
    }
  }

  if (req.method === "POST") {
    if (!body) return res.status(400).json({ error: "No body" });
    const state = body.state || {};
    // Only persist known keys
    const filtered = {};
    SYNC_KEYS.forEach(k => { if (state[k] !== undefined) filtered[k] = state[k]; });
    await put(pathname, JSON.stringify(filtered), { access: "public", addRandomSuffix: false, allowOverwrite: true });
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
};
