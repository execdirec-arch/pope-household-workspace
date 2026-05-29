/* SPENDING view — cycle budget tracker: grocery, gas, health, household, discretionary */
function SpendingView({ data, bankData }) {
  const { useState, useEffect } = React;

  const spending = data.spending || { categories: [] };
  const payDates = (data.paySchedule?.dates || [])
    .map(s => { const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d); })
    .sort((a,b) => a-b);

  // Current cycle: most recent payday up to next payday
  const today = new Date(); today.setHours(0,0,0,0);
  const cycleStart = [...payDates].reverse().find(d => d <= today) || payDates[0];
  const cycleEnd   = payDates.find(d => d > today);
  const daysLeft   = cycleEnd ? Math.ceil((cycleEnd - today) / 86400000) : null;

  // All transactions in this cycle
  const cycleTxns = [];
  if (bankData?.accounts) {
    for (const acct of bankData.accounts) {
      for (const tx of (acct.transactions || [])) {
        const d = new Date(tx.date); d.setHours(0,0,0,0);
        if (d >= cycleStart && (!cycleEnd || d < cycleEnd)) cycleTxns.push(tx);
      }
    }
  }

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

  // Only keep disc entries from this cycle
  const cycleDisc = discEntries.filter(e => {
    const d = new Date(e.date); d.setHours(0,0,0,0);
    return d >= cycleStart && (!cycleEnd || d < cycleEnd);
  });
  const discTotal = cycleDisc.reduce((s,e) => s + e.amount, 0);

  function addDisc() {
    const amt = parseFloat(addAmt);
    if (!addLabel.trim() || isNaN(amt) || amt <= 0) return;
    setDiscEntries(prev => [...prev, {
      id: Date.now(),
      label: addLabel.trim(),
      amount: amt,
      date: new Date().toISOString().slice(0,10),
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
    const keywords = cat.txnKeywords.map(k => k.toLowerCase());
    const matched = cycleTxns.filter(tx => {
      const desc = (tx.description || "").toLowerCase();
      return keywords.some(k => desc.includes(k)) && Number(tx.amount) > 0;
    });
    const total = matched.reduce((s, tx) => s + Number(tx.amount), 0);
    return { total, txns: matched };
  }

  const cats = spending.categories || [];
  const nonDisc = cats.filter(c => !c.manualOnly);
  const discCat = cats.find(c => c.manualOnly);

  const totalBudget = cats.reduce((s,c) => s + c.budgetPerCycle, 0);
  const totalSpent  = cats.reduce((s,c) => s + getCategorySpend(c).total, 0);
  const totalLeft   = totalBudget - totalSpent;

  return (
    <div>
      <div className="view__header">
        <div>
          <h1 className="view__title">Spending.</h1>
          <p className="view__subtitle">
            {cycleStart && `Cycle: ${cycleStart.toLocaleDateString("en-US", {month:"short",day:"numeric"})} → ${cycleEnd ? cycleEnd.toLocaleDateString("en-US", {month:"short",day:"numeric"}) : "?"}`}
            {daysLeft != null && ` · ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
            {!bankData && <span style={{marginLeft:8, color:"var(--fg-3)", fontSize:12}}>· connect bank for auto-tracking</span>}
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
          const pct = Math.min(100, (total / cat.budgetPerCycle) * 100);
          const over = total > cat.budgetPerCycle;
          const color = over ? "#ef4444" : pct > 80 ? "#f59e0b" : "#22c55e";
          return (
            <div key={cat.id} className="card" style={{minWidth:140, flex:"1 1 140px", padding:"12px 14px"}}>
              <div style={{fontSize:18, marginBottom:4}}>{cat.emoji}</div>
              <div style={{fontSize:12, fontWeight:700, marginBottom:2}}>{cat.label}</div>
              <div style={{fontSize:20, fontWeight:800, color, lineHeight:1}}>{fmt(total)}</div>
              <div style={{fontSize:10, color:"var(--fg-3)", marginBottom:6}}>of {fmt(cat.budgetPerCycle)}</div>
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
        const remaining = cat.budgetPerCycle - total;
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
                        <td style={{textAlign:"right"}} className="mono">{fmtDec(tx.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card card--tinted" style={{color:"var(--fg-3)", fontSize:13}}>
                {bankData ? "No transactions matched this cycle." : "Connect bank to auto-track transactions."}
              </div>
            )}
          </div>
        );
      })}

      {/* Discretionary — manual */}
      {discCat && (() => {
        const remaining = discCat.budgetPerCycle - discTotal;
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
              borderLeft: `4px solid ${over ? "#ef4444" : remaining < discCat.budgetPerCycle * 0.25 ? "#f59e0b" : "#22c55e"}`,
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
