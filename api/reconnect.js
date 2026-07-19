// Receives the new Teller access token from connect.html and parks it in Blob
// storage so the operator can pick it up and rotate TELLER_TOKEN. The blob is
// deleted right after pickup; this endpoint has no read path.
const { put } = require("@vercel/blob");

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => { try { resolve(JSON.parse(body)); } catch { reject(new Error("Invalid JSON")); } });
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const body = await readBody(req).catch(() => null);
  const token = body && body.token;
  if (!token || typeof token !== "string" || !/^token_[a-z0-9]+$/i.test(token)) {
    return res.status(400).json({ error: "Missing or malformed token" });
  }

  await put(
    "reconnect/teller-token.json",
    JSON.stringify({ token, receivedAt: new Date().toISOString() }),
    { access: "public", addRandomSuffix: false, allowOverwrite: true }
  );

  return res.status(200).json({ ok: true });
};
