// Manual transaction store — holds Wells Fargo CSV imports in Vercel Blob so
// the workspace has bank data even when the Teller feed is down.
// GET returns the stored set; POST merges new transactions in (deduped);
// DELETE clears the store.
const { readJson, writeJson, deleteByPathname } = require("./_blob.js");

const BLOB_PATH = "bank/manual-transactions.json";

async function readStore() {
  const data = await readJson(BLOB_PATH);
  return Array.isArray(data && data.transactions) ? data.transactions : [];
}

function validTxn(t) {
  return t && typeof t === "object" &&
    /^\d{4}-\d{2}-\d{2}$/.test(t.date || "") &&
    /^-?\d+(\.\d+)?$/.test(String(t.amount || "")) &&
    typeof t.description === "string" && t.description.length > 0 && t.description.length < 500;
}

function dedupeKey(t) {
  return t.date + "|" + Number(t.amount).toFixed(2) + "|" + t.description.toLowerCase().replace(/\s+/g, " ").trim();
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 2e6) reject(new Error("Body too large")); });
    req.on("end", () => { try { resolve(JSON.parse(body)); } catch { reject(new Error("Invalid JSON")); } });
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const transactions = await readStore();
      return res.status(200).json({ transactions, count: transactions.length });
    }

    if (req.method === "POST") {
      const body = await readBody(req).catch(() => null);
      const incoming = body && Array.isArray(body.transactions) ? body.transactions.filter(validTxn) : [];
      if (incoming.length === 0) return res.status(400).json({ error: "No valid transactions in payload" });
      if (incoming.length > 5000) return res.status(400).json({ error: "Too many transactions in one upload" });

      const existing = await readStore();
      const seen = new Set(existing.map(dedupeKey));
      const added = [];
      for (const t of incoming) {
        const key = dedupeKey(t);
        if (seen.has(key)) continue;
        seen.add(key);
        added.push({ date: t.date, description: t.description, amount: String(t.amount), source: "csv" });
      }
      const all = existing.concat(added).sort((a, b) => (a.date < b.date ? 1 : -1));
      await writeJson(BLOB_PATH, { transactions: all, updatedAt: new Date().toISOString() });
      return res.status(200).json({ ok: true, added: added.length, skippedDuplicates: incoming.length - added.length, total: all.length });
    }

    if (req.method === "DELETE") {
      await deleteByPathname(BLOB_PATH);
      return res.status(200).json({ ok: true, cleared: true });
    }

    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
