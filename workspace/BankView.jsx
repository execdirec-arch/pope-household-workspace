/* BANK view — live Wells Fargo balances + recent transactions via Teller */
function BankView({ data, bankData: bankDataProp, onBankData }) {
  const { useState, useEffect } = React;
  const [bankData, setBankData] = useState(bankDataProp || null);
  const [status, setStatus] = useState(bankDataProp ? "ok" : "idle");
  const [error, setError] = useState(null);
  const [importMsg, setImportMsg] = useState(null);
  const fileInputRef = React.useRef(null);

  const bills = data.bills || [];

  function getWindowCoverage(checkingBalance) {
    const payDates = (data.paySchedule?.dates || [])
      .map(s => { const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d); })
      .sort((a,b) => a-b);

    const today = new Date();
    today.setHours(0,0,0,0);

    // Next paycheck strictly after today
    const nextPay = payDates.find(d => d > today);
    if (!nextPay) return null;

    // Window: today → nextPay (exclusive)
    const startDay = today.getDate();
    const startMonth = today.getMonth();
    const endDay = nextPay.getDate();
    const endMonth = nextPay.getMonth();
    const crossesMonth = endMonth !== startMonth;

    const dueBills = bills.filter(b => {
      if (b.amount == null) return false;
      if (b.status === "skipped") return false;
      const day = b.payDay ?? b.dueDay;
      if (day == null) return false;
      if (crossesMonth) {
        return day >= startDay || day <= endDay;
      } else {
        return day >= startDay && day <= endDay;
      }
    });

    const total = dueBills.reduce((s, b) => s + b.amount, 0);
    const covered = checkingBalance >= total;
    const cushion = checkingBalance - total;

    return { dueBills, total, nextPay, covered, cushion };
  }

  useEffect(() => {
    if (!bankDataProp) fetchBank();
  }, []);

  // Import a Wells Fargo activity CSV: parse locally, store via the API,
  // then refetch with a cache-buster (the bank API is edge-cached 2 min).
  async function importCsv(file) {
    setImportMsg(null);
    try {
      const text = await file.text();
      const transactions = window.WfCsv.parse(text);
      const res = await fetch("/api/manual-txns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions }),
      });
      const j = await res.json();
      if (!res.ok || j.error) throw new Error(j.error || "HTTP " + res.status);
      setImportMsg(`Imported ${j.added} transaction${j.added === 1 ? "" : "s"}` +
        (j.skippedDuplicates ? ` (${j.skippedDuplicates} duplicate${j.skippedDuplicates === 1 ? "" : "s"} skipped)` : ""));
      fetchBank(0, true);
    } catch (e) {
      setImportMsg("Import failed: " + e.message);
    }
  }

  async function fetchBank(attempt = 0, bustCache = false) {
    setStatus("loading");
    try {
      const res = await fetch("/api/bank" + (bustCache ? "?v=" + Date.now() : ""));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setBankData(json);
      if (onBankData) onBankData(json);
      setStatus("ok");
    } catch (e) {
      // Teller rate-limits bursts and the call chain is slow; one quiet
      // retry absorbs most transient 404/429/timeout blips.
      if (attempt < 1) {
        setTimeout(() => fetchBank(attempt + 1), 3500);
        return;
      }
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

  const checking = bankData?.accounts?.find(a => !a.manual && (a.subtype === "checking" || a.type === "depository"));
  const checkingBalance = checking?.balance?.available != null
    ? Number(checking.balance.available)
    : checking?.balance?.ledger != null ? Number(checking.balance.ledger) : null;

  const windowCov = checkingBalance != null ? getWindowCoverage(checkingBalance) : null;

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
        <div style={{ display: "flex", gap: 8 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            onChange={e => { const f = e.target.files[0]; e.target.value = ""; if (f) importCsv(f); }}
          />
          <button className="btn btn--ghost" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
            ⬆ Import WF CSV
          </button>
          <button className="btn btn--ghost" onClick={() => fetchBank()} disabled={status === "loading"}>
            {status === "loading" ? "Loading…" : "↺ Refresh"}
          </button>
        </div>
      </div>

      {importMsg && (
        <div className="card card--tinted" style={{ marginBottom: "var(--section-pad)", fontSize: 13, color: importMsg.startsWith("Import failed") ? "#dc2626" : "var(--fg-2)" }}>
          {importMsg}{!importMsg.startsWith("Import failed") && " — Spending and Bills now include the imported data."}
        </div>
      )}

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
            {bankData.accounts.filter(a => !a.manual).map(acct => {
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

            {/* Window coverage card */}
            {windowCov && (
              <div className="card" style={{ borderTop: `3px solid ${windowCov.covered ? "#22c55e" : "#ef4444"}`, gridColumn: "span 2" }}>
                <div className="card__eyebrow"><span className="card__eyebrow-dot" />Next window</div>
                <div style={{ fontSize: 13, color: "var(--fg-2)", marginBottom: 6 }}>
                  Bills due before {windowCov.nextPay.toLocaleDateString("en-US", { month: "short", day: "numeric" })} paycheck
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: windowCov.covered ? "#22c55e" : "#ef4444", lineHeight: 1 }}>
                    {fmt(windowCov.total)}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--fg-2)" }}>
                    {windowCov.covered
                      ? `✓ covered · ${fmt(windowCov.cushion)} cushion`
                      : `⚠ short by ${fmt(Math.abs(windowCov.cushion))}`}
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px" }}>
                  {windowCov.dueBills.map(b => (
                    <span key={b.id} style={{ fontSize: 11, color: "var(--fg-3)" }}>
                      {b.name} {fmt(b.amount)} · {b.payDay ?? b.dueDay}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Transactions per account */}
          {bankData.accounts.map(acct => {
            const txns = (acct.transactions || []).slice(0, 40);
            if (!txns.length) return null;
            return (
              <div key={acct.id || acct.name} style={{ marginBottom: "var(--section-pad)" }}>
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
                      {txns.map((tx, i) => {
                        const amt = Number(tx.amount);
                        const isCredit = amt > 0;
                        return (
                          <tr key={tx.id || tx.date + "-" + i}>
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
