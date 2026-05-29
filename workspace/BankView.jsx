/* BANK view — live Wells Fargo balances + recent transactions via Teller */
function BankView({ data }) {
  const { useState, useEffect } = React;
  const [bankData, setBankData] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
  const [error, setError] = useState(null);

  const bills = data.bills || [];
  const totalMonthlyBills = bills.reduce((s, b) => s + b.amount, 0);

  useEffect(() => {
    fetchBank();
  }, []);

  async function fetchBank() {
    setStatus("loading");
    try {
      const res = await fetch("/api/bank");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setBankData(json);
      setStatus("ok");
    } catch (e) {
      setError(e.message);
      setStatus("error");
    }
  }

  function fmt(n) {
    if (n == null) return "—";
    return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtDate(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${m}/${d}`;
  }

  const checking = bankData?.accounts?.find(a => a.subtype === "checking" || a.type === "depository");
  const checkingBalance = checking?.balance?.available != null
    ? Number(checking.balance.available)
    : checking?.balance?.ledger != null ? Number(checking.balance.ledger) : null;

  const billCoverage = checkingBalance != null ? checkingBalance / totalMonthlyBills : null;

  return (
    <div>
      <div className="view__header">
        <div>
          <h1 className="view__title">Bank.</h1>
          <p className="view__subtitle">
            Live Wells Fargo balances via Teller
            {bankData?.fetchedAt && (
              <span style={{ marginLeft: 8, color: "var(--fg-3)", fontSize: 11 }}>
                · updated {new Date(bankData.fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <button className="btn btn--ghost" onClick={fetchBank} disabled={status === "loading"}>
          {status === "loading" ? "Loading…" : "↺ Refresh"}
        </button>
      </div>

      {/* Status states */}
      {status === "loading" && (
        <div className="card card--tinted" style={{ marginBottom: "var(--section-pad)", color: "var(--fg-2)" }}>
          Connecting to Wells Fargo via Teller…
        </div>
      )}
      {status === "error" && (
        <div className="card" style={{ marginBottom: "var(--section-pad)", borderLeft: "3px solid #ef4444" }}>
          <div style={{ fontWeight: 700, color: "#dc2626", marginBottom: 4 }}>Connection error</div>
          <div style={{ fontSize: 13, color: "var(--fg-2)" }}>{error}</div>
          {error?.includes("not configured") && (
            <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 8 }}>
              Set TELLER_CERT, TELLER_KEY, and TELLER_TOKEN in your Vercel environment variables.
            </div>
          )}
        </div>
      )}

      {status === "ok" && bankData && (
        <>
          {/* Balance cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: "var(--section-pad)" }}>
            {bankData.accounts.map(acct => {
              const avail = acct.balance?.available;
              const ledger = acct.balance?.ledger;
              const display = avail ?? ledger;
              return (
                <div key={acct.id} className="card" style={{ borderTop: "3px solid var(--rehumanize-green)" }}>
                  <div className="card__eyebrow"><span className="card__eyebrow-dot" />{acct.institution}</div>
                  <div style={{ fontSize: 13, color: "var(--fg-2)", marginBottom: 4 }}>{acct.name} · {acct.subtype}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: display < 0 ? "#dc2626" : "var(--ink)", lineHeight: 1 }}>
                    {fmt(display)}
                  </div>
                  {avail != null && ledger != null && String(avail) !== String(ledger) && (
                    <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 4 }}>Ledger: {fmt(ledger)}</div>
                  )}
                </div>
              );
            })}

            {/* Bills coverage card */}
            {checkingBalance != null && (
              <div className="card" style={{ borderTop: `3px solid ${billCoverage >= 1 ? "#22c55e" : billCoverage >= 0.5 ? "#f59e0b" : "#ef4444"}` }}>
                <div className="card__eyebrow"><span className="card__eyebrow-dot" />Bill coverage</div>
                <div style={{ fontSize: 13, color: "var(--fg-2)", marginBottom: 4 }}>Checking vs. monthly bills</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>
                  {billCoverage != null ? (billCoverage * 100).toFixed(0) + "%" : "—"}
                </div>
                <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 4 }}>
                  {fmt(checkingBalance)} available · {fmt(totalMonthlyBills)}/mo bills
                </div>
              </div>
            )}
          </div>

          {/* Transactions per account */}
          {bankData.accounts.map(acct => {
            const txns = (acct.transactions || []).slice(0, 40);
            if (!txns.length) return null;
            return (
              <div key={acct.id} style={{ marginBottom: "var(--section-pad)" }}>
                <div className="section-header">
                  <h2 className="section-header__title">{acct.name} — recent transactions</h2>
                  <div className="section-header__meta">{txns.length} shown</div>
                </div>
                <div className="card" style={{ padding: 0 }}>
                  <table className="table">
                    <thead>
                      <tr><th>Date</th><th>Description</th><th>Category</th><th style={{ textAlign: "right" }}>Amount</th></tr>
                    </thead>
                    <tbody>
                      {txns.map(tx => {
                        const amt = Number(tx.amount);
                        const isCredit = amt < 0;
                        return (
                          <tr key={tx.id}>
                            <td><div className="table__meta">{fmtDate(tx.date)}</div></td>
                            <td><div className="table__name" style={{ maxWidth: 280 }}>{tx.description}</div></td>
                            <td><div className="table__meta">{tx.details?.category || tx.type || ""}</div></td>
                            <td style={{ textAlign: "right" }}>
                              <div style={{ fontWeight: 700, color: isCredit ? "#22c55e" : "var(--ink)", fontSize: 13 }}>
                                {isCredit ? "+" : ""}{fmt(Math.abs(amt))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

Object.assign(window, { BankView });
