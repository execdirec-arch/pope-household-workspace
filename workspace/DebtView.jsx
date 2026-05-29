/* DEBT view — avalanche payoff tracker + card-by-card breakdown. */
function DebtView({ data }) {
  const debt = data.debt || { total: 0, strategy: "Avalanche", cards: [] };
  const cards = debt.cards || [];
  const overLimit = cards.filter(c => c.utilization > 100);
  const needsApr = cards.filter(c => c.apr == null).length;

  // Sort by avalanche rank first, then by APR desc, then utilization desc
  const sorted = [...cards].sort((a, b) => {
    if (a.avalancheRank != null && b.avalancheRank != null) return a.avalancheRank - b.avalancheRank;
    if (a.avalancheRank != null) return -1;
    if (b.avalancheRank != null) return 1;
    if (a.apr != null && b.apr != null) return b.apr - a.apr;
    if (a.apr != null) return -1;
    if (b.apr != null) return 1;
    return (b.utilization || 0) - (a.utilization || 0);
  });

  return (
    <div>
      <div className="view__header">
        <div>
          <h1 className="view__title">Debt.</h1>
          <p className="view__subtitle">
            ${debt.total.toLocaleString()} across {cards.length} lines. {debt.strategy}. Every dollar Lauren earns goes here.
          </p>
        </div>
        <div className="stack">
          <div className="kpi" style={{ minWidth: 160 }}>
            <div className="kpi__label">Total balance</div>
            <div className="kpi__value">${debt.total.toLocaleString()}</div>
            <div className="kpi__delta kpi__delta--down">to eliminate</div>
            <div className="kpi__progress">
              <div className="kpi__progress-fill" style={{ width: "0%" }} />
            </div>
            <div className="muted" style={{ fontSize: 10, marginTop: 4 }}>avalanche in progress</div>
          </div>
        </div>
      </div>

      {/* Action flags */}
      {(overLimit.length > 0 || needsApr > 0) && (
        <>
          <div className="section-header">
            <h2 className="section-header__title">Flags</h2>
            <div className="section-header__meta">needs attention</div>
          </div>
          <div className="grid grid-2" style={{ marginBottom: 'var(--section-pad)' }}>
            {overLimit.length > 0 && (
              <div className="nudge nudge--urgent">
                <div className="nudge__mark">!</div>
                <div className="nudge__content">
                  <h3 className="nudge__title">{overLimit.length} cards over their limit</h3>
                  <p className="nudge__body">
                    {overLimit.map(c => c.name).join(", ")} — all over 100% utilization. Over-limit fees may apply. These should be priorities regardless of APR.
                  </p>
                </div>
              </div>
            )}
            {needsApr > 0 && (
              <div className="nudge nudge--major">
                <div className="nudge__mark">★</div>
                <div className="nudge__content">
                  <h3 className="nudge__title">APRs missing for {needsApr} cards</h3>
                  <p className="nudge__body">
                    Avalanche method requires knowing each card's APR. Pull statements for all {cards.length} cards and fill in the APR column in the vault. One session; months of saved interest.
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Strategy */}
      <div className="section-header">
        <h2 className="section-header__title">Payoff strategy</h2>
      </div>
      <div className="card card--tinted" style={{ marginBottom: 'var(--section-pad)' }}>
        <div className="card__eyebrow"><span className="card__eyebrow-dot" />Avalanche method confirmed</div>
        <p className="card__body" style={{ margin: "8px 0 0" }}>
          <strong>Oliver's income:</strong> covers all household operations and minimum monthly payments on all cards.
          <br />
          <strong>Lauren's income:</strong> every dollar goes to the highest-APR card until it's paid off, then the next.
          <br />
          <strong>Payoff order:</strong> {needsApr > 0 ? "TBD — pull APRs first and rank cards highest to lowest." : "Ranked below by APR."}
        </p>
      </div>

      {/* Card breakdown */}
      <div className="section-header">
        <h2 className="section-header__title">All cards</h2>
        <div className="section-header__meta">sorted by avalanche rank · TBD cards at bottom</div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Card</th>
              <th>Balance</th>
              <th>Limit</th>
              <th>Utilization</th>
              <th>APR</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <tr key={i}>
                <td><div className="table__name">{c.name}</div></td>
                <td className="mono">{c.balance != null ? "$" + c.balance.toLocaleString() : "—"}</td>
                <td className="mono">{c.limit != null ? "$" + c.limit.toLocaleString() : "—"}</td>
                <td>
                  {c.utilization != null ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: "var(--paper-deep)", borderRadius: 3, overflow: "hidden", minWidth: 60 }}>
                        <div style={{
                          height: "100%",
                          width: `${Math.min(100, c.utilization)}%`,
                          background: c.utilization > 100 ? "var(--accent-tomato)" : c.utilization > 85 ? "var(--accent-gold)" : "var(--rehumanize-green)",
                        }} />
                      </div>
                      <span className={`pill pill--${c.utilization > 100 ? "urgent" : c.utilization > 85 ? "warn" : "current"}`}>
                        {c.utilization}%
                      </span>
                    </div>
                  ) : <span style={{ color: "var(--fg-3)", fontSize: 11 }}>—</span>}
                </td>
                <td>
                  {c.apr != null
                    ? <span className="mono">{c.apr.toFixed(2)}%</span>
                    : <span className="pill pill--warn">TBD</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

Object.assign(window, { DebtView });
