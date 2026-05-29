/* DEBT view — avalanche payoff tracker with countdown and mark-paid */
function DebtView({ data }) {
  const { useState, useEffect } = React;
  const debt = data.debt || { total: 0, strategy: "Avalanche", cards: [] };
  const cards = debt.cards || [];

  const [paidNames, setPaidNames] = useState(() => {
    try { return JSON.parse(localStorage.getItem("phw.paidCards") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("phw.paidCards", JSON.stringify(paidNames));
  }, [paidNames]);

  function togglePaid(name) {
    setPaidNames(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  }

  const paidSet = new Set(paidNames);
  const activeCards = cards.filter(c => !paidSet.has(c.name) && !c.pif);
  const paidCards   = cards.filter(c =>  paidSet.has(c.name));
  const pifCards    = cards.filter(c =>  c.pif);

  // Sort active by avalanche rank, then unranked at bottom
  const sortedActive = [...activeCards].sort((a, b) => {
    if (a.avalancheRank != null && b.avalancheRank != null) return a.avalancheRank - b.avalancheRank;
    if (a.avalancheRank != null) return -1;
    if (b.avalancheRank != null) return 1;
    return (b.apr || 0) - (a.apr || 0);
  });

  const currentTarget = sortedActive[0];

  // Progress math
  const startingTotal = debt.startingTotal || debt.total;
  const paidTotal = paidCards.reduce((s, c) => s + (c.balance || 0), 0);
  const remainingTotal = debt.total - paidTotal;
  const progressPct = Math.min(100, (paidTotal / startingTotal) * 100);

  // Per-card payoff estimate
  const monthly = debt.monthlyToDebt || 0;
  function monthsToPayoff(card) {
    if (!card.balance || !monthly || !card.apr) return null;
    const r = card.apr / 100 / 12;
    // months = -log(1 - r*b/p) / log(1+r)  (standard amortization)
    const val = 1 - (r * card.balance) / monthly;
    if (val <= 0) return null; // payment too low to cover interest
    return Math.ceil(-Math.log(val) / Math.log(1 + r));
  }

  function fmt(n) {
    if (n == null) return "—";
    return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  return (
    <div>
      <div className="view__header">
        <div>
          <h1 className="view__title">Debt.</h1>
          <p className="view__subtitle">
            {fmt(remainingTotal)} remaining across {activeCards.length} active cards. {paidCards.length > 0 && `${paidCards.length} paid off.`}
          </p>
        </div>
        <div className="kpi" style={{ minWidth: 180 }}>
          <div className="kpi__label">Eliminated</div>
          <div className="kpi__value">{fmt(paidTotal)}</div>
          <div className="kpi__delta kpi__delta--up">of {fmt(startingTotal)} starting debt</div>
        </div>
      </div>

      {/* Countdown bar */}
      <div className="card" style={{ marginBottom: "var(--section-pad)", padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Payoff journey</div>
          <div style={{ fontSize: 12, color: "var(--fg-3)" }}>
            {progressPct.toFixed(1)}% cleared · {fmt(remainingTotal)} to go
          </div>
        </div>
        <div style={{ height: 10, background: "var(--paper-deep)", borderRadius: 5, overflow: "hidden", marginBottom: 6 }}>
          <div style={{
            height: "100%",
            width: progressPct + "%",
            background: "var(--rehumanize-green)",
            borderRadius: 5,
            transition: "width 0.4s ease",
            minWidth: progressPct > 0 ? 4 : 0,
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--fg-3)" }}>
          <span>Started: {fmt(startingTotal)}</span>
          <span>{paidCards.length} card{paidCards.length !== 1 ? "s" : ""} paid off</span>
          <span>Goal: $0</span>
        </div>
      </div>

      {/* Current target */}
      {currentTarget && (
        <>
          <div className="section-header">
            <h2 className="section-header__title">Current target</h2>
            <div className="section-header__meta">every extra dollar goes here first</div>
          </div>
          <div className="card" style={{ marginBottom: "var(--section-pad)", borderLeft: "4px solid var(--accent-tomato)", padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 2 }}>{currentTarget.name}</div>
                <div style={{ fontSize: 13, color: "var(--fg-2)" }}>
                  {currentTarget.apr != null ? currentTarget.apr.toFixed(2) + "% APR" : "APR TBD"} ·{" "}
                  {currentTarget.balance != null ? fmt(currentTarget.balance) + " balance" : "balance TBD"}
                </div>
                {currentTarget.note && (
                  <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 4 }}>{currentTarget.note}</div>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {(() => {
                  const m = monthsToPayoff(currentTarget);
                  return m ? (
                    <>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--rehumanize-green)", lineHeight: 1 }}>{m}</div>
                      <div style={{ fontSize: 11, color: "var(--fg-3)" }}>months @ {fmt(monthly)}/mo</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 11, color: "var(--fg-3)" }}>set monthly<br/>payment to estimate</div>
                  );
                })()}
              </div>
            </div>
            <button
              onClick={() => togglePaid(currentTarget.name)}
              style={{ marginTop: 12, padding: "6px 16px", background: "#22c55e", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              Mark Paid Off ✓
            </button>
          </div>
        </>
      )}

      {/* All active cards */}
      <div className="section-header">
        <h2 className="section-header__title">Avalanche queue</h2>
        <div className="section-header__meta">sorted by rank · {fmt(monthly)}/mo to debt</div>
      </div>
      <div className="card" style={{ padding: 0, marginBottom: "var(--section-pad)" }}>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Card</th>
              <th>Balance</th>
              <th>APR</th>
              <th>Payoff est.</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedActive.map((c, i) => {
              const m = monthsToPayoff(c);
              const isTarget = i === 0;
              return (
                <tr key={c.name} style={isTarget ? { background: "rgba(239,68,68,0.04)" } : {}}>
                  <td><span style={{ fontWeight: 700, color: isTarget ? "var(--accent-tomato)" : "var(--fg-3)", fontSize: 13 }}>{c.avalancheRank ?? "—"}</span></td>
                  <td>
                    <div className="table__name">{c.name}{isTarget && <span style={{ marginLeft: 6, fontSize: 10, color: "var(--accent-tomato)", fontWeight: 700 }}>TARGET</span>}</div>
                    {c.note && <div className="table__meta" style={{ maxWidth: 280 }}>{c.note}</div>}
                  </td>
                  <td className="mono">{c.balance != null ? fmt(c.balance) : "—"}</td>
                  <td>
                    {c.apr != null
                      ? <span className="mono">{c.apr.toFixed(2)}%</span>
                      : <span className="pill pill--warn">TBD</span>}
                  </td>
                  <td>
                    {m
                      ? <span className="mono" style={{ color: "var(--fg-2)" }}>{m} mo</span>
                      : <span style={{ color: "var(--fg-3)", fontSize: 11 }}>—</span>}
                  </td>
                  <td>
                    <button
                      onClick={() => togglePaid(c.name)}
                      style={{ padding: "3px 10px", fontSize: 11, background: "transparent", border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer", color: "var(--fg-2)", whiteSpace: "nowrap" }}
                    >
                      Mark paid
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PIF cards */}
      {pifCards.length > 0 && (
        <>
          <div className="section-header">
            <h2 className="section-header__title">Paid in full monthly</h2>
            <div className="section-header__meta">not carrying a balance</div>
          </div>
          <div className="card" style={{ padding: 0, marginBottom: "var(--section-pad)" }}>
            <table className="table">
              <thead><tr><th>Card</th><th>Limit</th><th>APR</th><th>Note</th></tr></thead>
              <tbody>
                {pifCards.map(c => (
                  <tr key={c.name}>
                    <td><div className="table__name">{c.name}</div></td>
                    <td className="mono">{c.limit != null ? fmt(c.limit) : "—"}</td>
                    <td><span className="pill pill--current" style={{ background: "#22c55e", color: "#fff" }}>PIF</span></td>
                    <td><div className="table__meta">{c.note}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Paid off cards */}
      {paidCards.length > 0 && (
        <>
          <div className="section-header">
            <h2 className="section-header__title">Paid off</h2>
            <div className="section-header__meta">{fmt(paidTotal)} eliminated</div>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <table className="table">
              <thead><tr><th>Card</th><th>Was</th><th>APR</th><th></th></tr></thead>
              <tbody>
                {paidCards.map(c => (
                  <tr key={c.name} style={{ background: "rgba(34,197,94,0.06)" }}>
                    <td>
                      <div className="table__name" style={{ color: "#22c55e" }}>✓ {c.name}</div>
                    </td>
                    <td className="mono" style={{ color: "var(--fg-3)", textDecoration: "line-through" }}>{fmt(c.balance)}</td>
                    <td><span className="mono" style={{ color: "var(--fg-3)" }}>{c.apr != null ? c.apr.toFixed(2) + "%" : "—"}</span></td>
                    <td>
                      <button
                        onClick={() => togglePaid(c.name)}
                        style={{ padding: "3px 10px", fontSize: 11, background: "transparent", border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer", color: "var(--fg-3)" }}
                      >
                        Undo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { DebtView });
