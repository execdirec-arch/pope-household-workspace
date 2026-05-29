/* DEBT view — avalanche payoff tracker with inline editing */
function DebtView({ data }) {
  const { useState, useEffect, useRef } = React;
  const debt = data.debt || { total: 0, strategy: "Avalanche", cards: [] };
  const cards = debt.cards || [];

  const [paidNames, setPaidNames] = useState(() => {
    try { return JSON.parse(localStorage.getItem("phw.paidCards") || "[]"); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem("phw.paidCards", JSON.stringify(paidNames)); }, [paidNames]);

  const [overrides, setOverridesState] = useState(() => {
    try { return JSON.parse(localStorage.getItem("phw.overrides") || "{}"); } catch { return {}; }
  });
  function setOverride(key, val) {
    setOverridesState(prev => {
      const next = { ...prev };
      if (val === null) delete next[key]; else next[key] = val;
      localStorage.setItem("phw.overrides", JSON.stringify(next));
      return next;
    });
  }

  function getBalance(c) { return overrides[`debt:${c.name}:balance`] ?? c.balance; }
  function getApr(c)     { return overrides[`debt:${c.name}:apr`]     ?? c.apr; }

  function togglePaid(name) {
    setPaidNames(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  }

  // Inline editable value component
  function Editable({ value, onSave, display, inputWidth = 80 }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState("");
    const ref = useRef();
    if (editing) return (
      <input
        ref={ref}
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { onSave(draft); setEditing(false); }}
        onKeyDown={e => {
          if (e.key === "Enter") { onSave(draft); setEditing(false); }
          if (e.key === "Escape") setEditing(false);
        }}
        style={{ width: inputWidth, fontSize: "inherit", fontFamily: "var(--font-mono, monospace)", padding: "1px 4px", border: "1px solid var(--accent-blue, #3b82f6)", borderRadius: 3, background: "var(--paper)" }}
      />
    );
    return (
      <span
        onClick={() => { setDraft(String(value ?? "")); setEditing(true); }}
        title="Click to edit"
        style={{ cursor: "pointer", borderBottom: "1px dashed var(--fg-3)", paddingBottom: 1 }}
      >
        {display}
      </span>
    );
  }

  const paidSet = new Set(paidNames);
  const activeCards = cards.filter(c => !paidSet.has(c.name) && !c.pif);
  const paidCards   = cards.filter(c =>  paidSet.has(c.name));
  const pifCards    = cards.filter(c =>  c.pif);

  const sortedActive = [...activeCards].sort((a, b) => {
    if (a.avalancheRank != null && b.avalancheRank != null) return a.avalancheRank - b.avalancheRank;
    if (a.avalancheRank != null) return -1;
    if (b.avalancheRank != null) return 1;
    return (getApr(b) || 0) - (getApr(a) || 0);
  });

  const currentTarget = sortedActive[0];

  const startingTotal = debt.startingTotal || debt.total;
  const liveActiveTotal = activeCards.reduce((s, c) => s + (getBalance(c) || 0), 0);
  const paidTotal = paidCards.reduce((s, c) => s + (getBalance(c) || 0), 0);
  const progressPct = Math.min(100, ((startingTotal - liveActiveTotal) / startingTotal) * 100);

  const monthly = debt.monthlyToDebt || 0;
  function monthsToPayoff(c) {
    const b = getBalance(c), r_apr = getApr(c);
    if (!b || !monthly || !r_apr) return null;
    const r = r_apr / 100 / 12;
    const val = 1 - (r * b) / monthly;
    if (val <= 0) return null;
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
            {fmt(liveActiveTotal)} remaining across {activeCards.length} active cards.{paidCards.length > 0 && ` ${paidCards.length} paid off.`}
          </p>
        </div>
        <div className="kpi" style={{ minWidth: 180 }}>
          <div className="kpi__label">Eliminated</div>
          <div className="kpi__value">{fmt(startingTotal - liveActiveTotal)}</div>
          <div className="kpi__delta kpi__delta--up">of {fmt(startingTotal)} starting debt</div>
        </div>
      </div>

      {/* Countdown bar */}
      <div className="card" style={{ marginBottom: "var(--section-pad)", padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Payoff journey</div>
          <div style={{ fontSize: 12, color: "var(--fg-3)" }}>
            {progressPct.toFixed(1)}% cleared · {fmt(liveActiveTotal)} to go
          </div>
        </div>
        <div style={{ height: 10, background: "var(--paper-deep)", borderRadius: 5, overflow: "hidden", marginBottom: 6 }}>
          <div style={{
            height: "100%", width: Math.max(0, progressPct) + "%",
            background: "var(--rehumanize-green)", borderRadius: 5,
            transition: "width 0.4s ease", minWidth: progressPct > 0 ? 4 : 0,
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
                  <Editable
                    value={getApr(currentTarget)}
                    display={getApr(currentTarget) != null ? getApr(currentTarget).toFixed(2) + "% APR" : "APR TBD"}
                    onSave={v => { const n = parseFloat(v); setOverride(`debt:${currentTarget.name}:apr`, isNaN(n) ? null : n); }}
                    inputWidth={60}
                  />
                  {" · "}
                  <Editable
                    value={getBalance(currentTarget)}
                    display={getBalance(currentTarget) != null ? fmt(getBalance(currentTarget)) + " balance" : "balance TBD"}
                    onSave={v => { const n = parseFloat(v.replace(/[$,]/g, "")); setOverride(`debt:${currentTarget.name}:balance`, isNaN(n) ? null : n); }}
                    inputWidth={80}
                  />
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
        <div className="section-header__meta">click any balance or APR to update · {fmt(monthly)}/mo to debt</div>
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
              const bal = getBalance(c);
              const apr = getApr(c);
              return (
                <tr key={c.name} style={isTarget ? { background: "rgba(239,68,68,0.04)" } : {}}>
                  <td><span style={{ fontWeight: 700, color: isTarget ? "var(--accent-tomato)" : "var(--fg-3)", fontSize: 13 }}>{c.avalancheRank ?? "—"}</span></td>
                  <td>
                    <div className="table__name">{c.name}{isTarget && <span style={{ marginLeft: 6, fontSize: 10, color: "var(--accent-tomato)", fontWeight: 700 }}>TARGET</span>}</div>
                    {c.note && <div className="table__meta" style={{ maxWidth: 280 }}>{c.note}</div>}
                  </td>
                  <td className="mono">
                    <Editable
                      value={bal}
                      display={bal != null ? fmt(bal) : "—"}
                      onSave={v => { const n = parseFloat(v.replace(/[$,]/g, "")); setOverride(`debt:${c.name}:balance`, isNaN(n) ? null : n); }}
                    />
                  </td>
                  <td>
                    <Editable
                      value={apr}
                      display={apr != null
                        ? <span className="mono">{apr.toFixed(2)}%</span>
                        : <span className="pill pill--warn">TBD</span>}
                      onSave={v => { const n = parseFloat(v); setOverride(`debt:${c.name}:apr`, isNaN(n) ? null : n); }}
                      inputWidth={60}
                    />
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
                    <td><div className="table__name" style={{ color: "#22c55e" }}>✓ {c.name}</div></td>
                    <td className="mono" style={{ color: "var(--fg-3)", textDecoration: "line-through" }}>{fmt(getBalance(c))}</td>
                    <td><span className="mono" style={{ color: "var(--fg-3)" }}>{getApr(c) != null ? getApr(c).toFixed(2) + "%" : "—"}</span></td>
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
