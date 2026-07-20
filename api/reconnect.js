// Receives the new Teller access token from connect.html and parks it in Blob
// storage so the operator can pick it up and rotate TELLER_TOKEN. The blob is
// deleted right after pickup; this endpoint has no read path.
const { writeJson } = require("./_blob.js");

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => { try { resolve(JSON.parse(body)); } catch { reject(new Error("Invalid JSON")); } });
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  // CORS: the relink page runs from localhost because content filters kill
  // the hosted copy (it pattern-matches as a bank-login page).
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const body = await readBody(req).catch(() => null);
  const token = body && body.token;
  if (!token || typeof token !== "string" || !/^token_[a-z0-9]+$/i.test(token)) {
    return res.status(400).json({ error: "Missing or malformed token" });
  }

  await writeJson("reconnect/teller-token.json", { token, receivedAt: new Date().toISOString() });

  return res.status(200).json({ ok: true });
};
