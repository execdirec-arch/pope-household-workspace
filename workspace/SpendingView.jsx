/* SPENDING view — cycle budget tracker: grocery, gas, health, household, discretionary */
function SpendingView({ data, bankData }) {
  const { useState, useEffect } = React;

  const spending = data.spending || { categories: [] };
  const BC = window.BudgetCore;

  // Newest bank transaction (drives the default week when the feed lags)
  const newestTxnDate = BC.newestTransactionDate(bankData?.accounts);

  // Week window: Mon–Sun, navigable. offset 0 = current week, -1 = last week…
  // All date math on local-parsed dates; comparisons on ISO strings.
  const today = new Date(); today.setHours(0,0,0,0);
  const currentWeekStartISO = BC.weekStartISO(today);

  function localDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  // Default: current week, unless the feed's newest data predates it — then
  // open on the last week that actually has transactions.
  const newestWeekISO = newestTxnDate ? BC.weekStartISO(newestTxnDate) : null;
  const autoOffset = (bankData && newestWeekISO && newestWeekISO < currentWeekStartISO)
    ? Math.round((localDate(newestWeekISO) - localDate(currentWeekStartISO)) / (7 * 86400000))
    : 0;
  const [weekOffsetState, setWeekOffset] = useState(null);
  const weekOffset = weekOffsetState === null ? autoOffset : weekOffsetState;

  const isoWeekStart = BC.addDaysISO(currentWeekStartISO, weekOffset * 7);
  const weekStart = localDate(isoWeekStart);
  const weekEnd   = localDate(BC.addDaysISO(isoWeekStart, 7));
  const daysLeft  = weekOffset === 0 ? Math.ceil((weekEnd - today) / 86400000) : null;

  // Categorize the viewed week: bills/debt/transfers excluded, every
  // remaining debit lands in exactly one category or "Everything else".
  const weekSummary = BC.summarizeWeek(bankData?.accounts || [], isoWeekStart, {
    categories: spending.categories || [],
    bills: data.bills,
    debtKeywords: data.debt?.txnKeywords || [],
  });

  // Feed is stale if the newest bank transaction predates the current week
  const feedStale = bankData && newestWeekISO && newestWeekISO < currentWeekStartISO;

  // Manual discretionary entries
  const [discEntries, setDiscEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem("phw.disc") || "[]"); } catch { return []; }
  });

  const [addLabel, setAddLabel] = useState("");
  const [addAmt, setAddAmt] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    localStorage.setItem("phw.disc", JSON.stringify(discEntries));
  }, [discEntries]);

  // Only keep disc entries from this week (ISO string compare, no UTC shift)
  const isoWeekEnd = BC.addDaysISO(isoWeekStart, 7);
  const cycleDisc = discEntries.filter(e => e.date >= isoWeekStart && e.date < isoWeekEnd);
  const discTotal = cycleDisc.reduce((s,e) => s + e.amount, 0);

  function addDisc() {
    const amt = parseFloat(addAmt);
    if (!addLabel.trim() || isNaN(amt) || amt <= 0) return;
    setDiscEntries(prev => [...prev, {
      id: Date.now(),
      label: addLabel.trim(),
      amount: amt,
      date: BC.isoDay(new Date()),
    }]);
    setAddLabel(""); setAddAmt(""); setShowAdd(false);
  }

  function removeDisc(id) {
    setDiscEntries(prev => prev.filter(e => e.id !== id));
  }

  function fmt(n) {
    return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  function fmtDec(n) {
    return "$" + Number(n).toFixed(2);
  }

  function getCategorySpend(cat) {
    if (cat.manualOnly) return { total: discTotal, txns: cycleDisc.map(e => ({ description: e.label, amount: e.amount, date: e.date, _manual: true, _id: e.id })) };
    return weekSummary.byCategory[cat.id] || { total: 0, txns: [] };
  }

  const cats = spending.categories || [];
  const nonDisc = cats.filter(c => !c.manualOnly);
  const discCat = cats.find(c => c.manualOnly);

  const totalBudget = cats.reduce((s,c) => s + c.budgetPerWeek, 0);
  const totalSpent  = cats.reduce((s,c) => s + getCategorySpend(c).total, 0);
  const totalLeft   = totalBudget - totalSpent;

  return (
    <div>
      <div className="view__header">
        <div>
          <h1 className="view__title">Spending.</h1>
          <p className="view__subtitle" style={{display:"flex", alignItems:"center", gap:8, flexWrap:"wrap"}}>
            <button className="btn btn--ghost btn--sm" onClick={() => setWeekOffset(weekOffset - 1)}>←</button>
            <span>
              {`Week of ${weekStart.toLocaleDateString("en-US", {month:"short",day:"numeric"})} → ${new Date(weekEnd.getTime()-86400000).toLocaleDateString("en-US", {month:"short",day:"numeric"})}`}
              {daysLeft != null && ` · ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
            </span>
            <button className="btn btn--ghost btn--sm" onClick={() => setWeekOffset(Math.min(0, weekOffset + 1))} disabled={weekOffset >= 0}>→</button>
            {weekOffset < 0 && <span className="pill pill--warn" style={{fontSize:11}}>past week</span>}
            {!bankData && <span style={{color:"var(--fg-3)", fontSize:12}}>· connect bank for auto-tracking</span>}
            {feedStale && <span style={{color:"#f59e0b", fontSize:12}}>· bank data ends {newestTxnDate}</span>}
          </p>
        </div>
        <div className="kpi" style={{minWidth:160}}>
          <div className="kpi__label">Remaining this cycle</div>
          <div className="kpi__value" style={{color: totalLeft < 0 ? "#ef4444" : "var(--ink)"}}>{fmt(totalLeft)}</div>
          <div className="kpi__delta kpi__delta--flat">of {fmt(totalBudget)} budget</div>
        </div>
      </div>

      {/* Category chips row */}
      <div style={{display:"flex", flexWrap:"wrap", gap:10, marginBottom:"var(--section-pad)"}}>
        {cats.map(cat => {
          const {total} = getCategorySpend(cat);
          const pct = Math.min(100, (total / cat.budgetPerWeek) * 100);
          const over = total > cat.budgetPerWeek;
          const color = over ? "#ef4444" : pct > 80 ? "#f59e0b" : "#22c55e";
          return (
            <div key={cat.id} className="card" style={{minWidth:140, flex:"1 1 140px", padding:"12px 14px"}}>
              <div style={{fontSize:18, marginBottom:4}}>{cat.emoji}</div>
              <div style={{fontSize:12, fontWeight:700, marginBottom:2}}>{cat.label}</div>
              <div style={{fontSize:20, fontWeight:800, color, lineHeight:1}}>{fmt(total)}</div>
              <div style={{fontSize:10, color:"var(--fg-3)", marginBottom:6}}>of {fmt(cat.budgetPerWeek)}</div>
              <div style={{height:4, background:"var(--paper-deep)", borderRadius:2, overflow:"hidden"}}>
                <div style={{height:"100%", width:pct+"%", background:color, borderRadius:2}} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto-tracked categories */}
      {nonDisc.map(cat => {
        const {total, txns} = getCategorySpend(cat);
        const remaining = cat.budgetPerWeek - total;
        const over = remaining < 0;
        return (
          <div key={cat.id} style={{marginBottom:"var(--section-pad)"}}>
            <div className="section-header">
              <h2 className="section-header__title">{cat.emoji} {cat.label}</h2>
              <div className="section-header__meta" style={{color: over ? "#ef4444" : undefined}}>
                {over ? `Over by ${fmt(Math.abs(remaining))}` : `${fmt(remaining)} left`} · {fmt(total)} spent
              </div>
            </div>
            {txns.length > 0 ? (
              <div className="card" style={{padding:0}}>
                <table className="table">
                  <thead><tr><th>Date</th><th>Description</th><th style={{textAlign:"right"}}>Amount</th></tr></thead>
                  <tbody>
                    {txns.map((tx,i) => (
                      <tr key={i}>
                        <td className="mono" style={{whiteSpace:"nowrap"}}>{tx.date}</td>
                        <td><div className="table__name" style={{maxWidth:300}}>{tx.description}</div></td>
                        <td style={{textAlign:"right"}} className="mono">{fmtDec(Math.abs(Number(tx.amount)))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card card--tinted" style={{color:"var(--fg-3)", fontSize:13}}>
                {feedStale ? `Bank data ends ${newestTxnDate}; this week's transactions haven't synced yet.` : bankData ? "No transactions matched this cycle." : "Connect bank to auto-track transactions."}
              </div>
            )}
          </div>
        );
      })}

      {/* Everything else — real debits no category claimed. Visible so nothing is invisible. */}
      {weekSummary.uncategorized.txns.length > 0 && (
        <div style={{marginBottom:"var(--section-pad)"}}>
          <div className="section-header">
            <h2 className="section-header__title">🧾 Everything else</h2>
            <div className="section-header__meta">
              {fmt(weekSummary.uncategorized.total)} spent · not in any budget category
            </div>
          </div>
          <div className="card" style={{padding:0}}>
            <table className="table">
              <thead><tr><th>Date</th><th>Description</th><th style={{textAlign:"right"}}>Amount</th></tr></thead>
              <tbody>
                {weekSummary.uncategorized.txns.map((tx,i) => (
                  <tr key={i}>
                    <td className="mono" style={{whiteSpace:"nowrap"}}>{tx.date}</td>
                    <td><div className="table__name" style={{maxWidth:300}}>{tx.description}</div></td>
                    <td style={{textAlign:"right"}} className="mono">{fmtDec(Math.abs(Number(tx.amount)))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{fontSize:11, color:"var(--fg-3)", marginTop:6}}>
            Bills, debt payments, and transfers are already excluded. If something here recurs, it may deserve a category or a bill entry.
          </div>
        </div>
      )}

      {/* Discretionary — manual */}
      {discCat && (() => {
        const remaining = discCat.budgetPerWeek - discTotal;
        const over = remaining < 0;
        return (
          <div style={{marginBottom:"var(--section-pad)"}}>
            <div className="section-header">
              <h2 className="section-header__title">{discCat.emoji} {discCat.label}</h2>
              <div className="section-header__meta" style={{color: over ? "#ef4444" : undefined}}>
                {over ? `Over by ${fmt(Math.abs(remaining))}` : `${fmt(remaining)} left`} · {fmt(discTotal)} spent
              </div>
            </div>

            {/* Big remaining card */}
            <div className="card" style={{
              marginBottom: 10,
              borderLeft: `4px solid ${over ? "#ef4444" : remaining < discCat.budgetPerWeek * 0.25 ? "#f59e0b" : "#22c55e"}`,
              padding: "20px 24px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20,
            }}>
              <div>
                <div style={{fontSize:13, color:"var(--fg-2)", marginBottom:4}}>Available this cycle</div>
                <div style={{fontSize:42, fontWeight:900, color: over ? "#ef4444" : "var(--ink)", lineHeight:1, fontFamily:"var(--font-headline)"}}>
                  {fmt(remaining)}
                </div>
                <div style={{fontSize:12, color:"var(--fg-3)", marginTop:6}}>
                  Dates · clothing · kids' extras · anything goes
                </div>
              </div>
              <button
                onClick={() => setShowAdd(s => !s)}
                style={{
                  padding: "14px 22px",
                  background: "var(--rehumanize-green)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                + Log spend
              </button>
            </div>

            {/* Add form */}
            {showAdd && (
              <div className="card" style={{marginBottom:10, display:"flex", gap:10, alignItems:"flex-end", flexWrap:"wrap"}}>
                <div style={{flex:"2 1 160px"}}>
                  <div style={{fontSize:11, color:"var(--fg-3)", marginBottom:4}}>What was it?</div>
                  <input
                    type="text"
                    placeholder="Date night, shoes, etc."
                    value={addLabel}
                    onChange={e => setAddLabel(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addDisc()}
                    style={{width:"100%", padding:"8px 10px", border:"1px solid var(--border)", borderRadius:6, fontSize:13, background:"var(--paper)", color:"var(--ink)"}}
                  />
                </div>
                <div style={{flex:"1 1 100px"}}>
                  <div style={{fontSize:11, color:"var(--fg-3)", marginBottom:4}}>Amount</div>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={addAmt}
                    onChange={e => setAddAmt(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addDisc()}
                    style={{width:"100%", padding:"8px 10px", border:"1px solid var(--border)", borderRadius:6, fontSize:13, background:"var(--paper)", color:"var(--ink)"}}
                  />
                </div>
                <button onClick={addDisc} style={{padding:"8px 18px", background:"var(--rehumanize-green)", color:"#fff", border:"none", borderRadius:6, fontWeight:700, fontSize:13, cursor:"pointer"}}>
                  Add
                </button>
                <button onClick={() => setShowAdd(false)} style={{padding:"8px 12px", background:"transparent", border:"1px solid var(--border)", borderRadius:6, fontSize:13, cursor:"pointer", color:"var(--fg-2)"}}>
                  Cancel
                </button>
              </div>
            )}

            {/* Entry list */}
            {cycleDisc.length > 0 && (
              <div className="card" style={{padding:0}}>
                <table className="table">
                  <thead><tr><th>Date</th><th>What</th><th style={{textAlign:"right"}}>Amount</th><th></th></tr></thead>
                  <tbody>
                    {cycleDisc.map(e => (
                      <tr key={e.id}>
                        <td className="mono" style={{whiteSpace:"nowrap"}}>{e.date}</td>
                        <td><div className="table__name">{e.label}</div></td>
                        <td style={{textAlign:"right"}} className="mono">{fmtDec(e.amount)}</td>
                        <td>
                          <button
                            onClick={() => removeDisc(e.id)}
                            style={{background:"transparent", border:"none", cursor:"pointer", color:"var(--fg-3)", fontSize:16, padding:"0 4px"}}
                          >×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {cycleDisc.length === 0 && (
              <div className="card card--tinted" style={{color:"var(--fg-3)", fontSize:13}}>
                Nothing logged yet this cycle. Tap "+ Log spend" when you spend something fun.
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

Object.assign(window, { SpendingView });
