// Teller bank integration — mTLS proxy for Wells Fargo data
const https = require("https");

const TELLER_BASE = "https://api.teller.io";

function tellerAgent() {
  return new https.Agent({
    cert: Buffer.from(process.env.TELLER_CERT, "base64"),
    key:  Buffer.from(process.env.TELLER_KEY,  "base64"),
  });
}

function tellerGet(path, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, TELLER_BASE);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: "GET",
        agent: tellerAgent(),
        headers: {
          Authorization: "Basic " + Buffer.from(token + ":").toString("base64"),
          Accept: "application/json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, body: data }); }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const token = process.env.TELLER_TOKEN;
  if (!token || !process.env.TELLER_CERT || !process.env.TELLER_KEY) {
    return res.status(503).json({ error: "Teller credentials not configured" });
  }

  try {
    const { status: aStatus, body: accounts } = await tellerGet("/accounts", token);
    if (aStatus !== 200) return res.status(aStatus).json({ error: "Teller accounts error", detail: accounts });

    const enriched = await Promise.all(
      accounts.map(async (acct) => {
        const [balRes, txRes] = await Promise.all([
          tellerGet(`/accounts/${acct.id}/balances`, token),
          tellerGet(`/accounts/${acct.id}/transactions?count=90`, token),
        ]);
        return {
          id: acct.id,
          name: acct.name,
          type: acct.type,
          subtype: acct.subtype,
          institution: (acct.institution && acct.institution.name) || "Wells Fargo",
          status: acct.status,
          balance: balRes.status === 200 ? balRes.body : null,
          transactions: txRes.status === 200 ? txRes.body : [],
        };
      })
    );

    return res.status(200).json({ accounts: enriched, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
