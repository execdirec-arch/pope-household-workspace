/* BILLS view — bills due soon + full recurring bill list with live paid status */
function BillsView({ data, bankData }) {
  const bills = data.bills || [];
  const dueSoon = bills.filter(b => b.status === "due-soon");
  const upcoming = bills.filter(b => b.status === "upcoming");
  const monthlyFixed = bills.reduce((s, b) => s + (b.amount || 0), 0);

  // Build a flat list of all transactions from the last ~35 days
  const allTxns = [];
  if (bankData?.accounts) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 35);
    for (const acct of bankData.accounts) {
      for (const tx of (acct.transactions || [])) {
        const d = new Date(tx.date);
        if (d >= cutoff) allTxns.push(tx);
      }
    }
  }

  function isPaid(bill) {
    if (!bill.txnMatch || !allTxns.length) return null; // null = unknown
    const key = bill.txnMatch.toLowerCase();
    return allTxns.some(tx => {
      const desc = (tx.description || "").toLowerCase();
      const amt = Math.abs(Number(tx.amount));
      const amtMatch = Math.abs(amt - bill.amount) < 2;
      return desc.includes(key) && amtMatch;
    });
  }

  return (
    <div>
      <div className="view__header">
        <div>
          <h1 className="view__title">Bills.</h1>
          <p className="view__subtitle">
            {dueSoon.length > 0
              ? `${dueSoon.length} bill${dueSoon.length > 1 ? "s" : ""} due this week. Don't let them slip.`
              : "No bills due in the next 7 days."}
            {!bankData && <span style={{ marginLeft: 8, color: "var(--fg-3)", fontSize: 12 }}>· connect bank for paid status</span>}
          </p>
        </div>
        <div>
          <div className="kpi" style={{ minWidth: 160 }}>
            <div className="kpi__label">Monthly fixed bills</div>
            <div className="kpi__value">${Math.round(monthlyFixed).toLocaleString()}</div>
            <div className="kpi__delta kpi__delta--flat">recurring every month</div>
          </div>
        </div>
      </div>

      {/* Due soon */}
      {dueSoon.length > 0 && (
        <>
          <div className="section-header">
            <h2 className="section-header__title">Due this week</h2>
            <div className="section-header__meta">{dueSoon.length} bills</div>
          </div>
          <div className="stack" style={{ marginBottom: "var(--section-pad)" }}>
            {dueSoon.map(b => <BillRow key={b.id} bill={b} urgent paid={isPaid(b)} />)}
          </div>
        </>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <>
          <div className="section-header">
            <h2 className="section-header__title">Upcoming (7–14 days)</h2>
            <div className="section-header__meta">{upcoming.length} bills</div>
          </div>
          <div className="stack" style={{ marginBottom: "var(--section-pad)" }}>
            {upcoming.map(b => <BillRow key={b.id} bill={b} paid={isPaid(b)} />)}
          </div>
        </>
      )}

      {/* All recurring */}
      <div className="section-header">
        <h2 className="section-header__title">All recurring bills</h2>
        <div className="section-header__meta">{bills.length} total · ${Math.round(monthlyFixed).toLocaleString()}/mo</div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Bill</th>
              <th>Amount</th>
              <th>Due</th>
              <th style={{ textAlign: "center" }}>Status</th>
              <th>Autopay</th>
              <th>Servicer</th>
            </tr>
          </thead>
          <tbody>
            {bills.map(b => {
              const paid = isPaid(b);
              return (
                <tr key={b.id} style={paid ? { background: "rgba(34,197,94,0.06)" } : {}}>
                  <td><div className="table__name">{b.name}</div></td>
                  <td className="mono">{b.amount != null ? "$" + b.amount.toFixed(2) : "—"}</td>
                  <td className="mono">{b.payDay ?? b.dueDay ?? "—"}</td>
                  <td style={{ textAlign: "center" }}>
                    {paid === true  && <span className="pill pill--current" style={{ background: "#22c55e", color: "#fff", fontWeight: 700 }}>Paid</span>}
                    {paid === false && <span className="pill pill--warn">Pending</span>}
                    {paid === null  && <span style={{ color: "var(--fg-3)", fontSize: 11 }}>—</span>}
                  </td>
                  <td>
                    {b.status === "skipped"
                      ? <span className="pill pill--flat" style={{color:"var(--fg-3)"}}>skipped</span>
                      : <span className={`pill pill--${b.autopay ? "current" : "warn"}`}>{b.autopay ? "autopay" : "manual"}</span>}
                  </td>
                  <td><div className="table__meta">{b.servicer}</div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card card--tinted" style={{ marginTop: "var(--card-gap)" }}>
        <div className="card__eyebrow"><span className="card__eyebrow-dot" />Note</div>
        <p className="card__body" style={{ margin: 0 }}>
          Bills marked <strong>manual</strong> are the ones that slip. Mortgage and HELOC both hit June 1 and are manual. Confirm payment or set up autopay.
          Paid status pulls from live bank transactions — green means a matching charge appeared in the last 35 days.
        </p>
      </div>
    </div>
  );
}

function BillRow({ bill, urgent, paid }) {
  return (
    <div
      className={`card ${urgent && paid !== true ? "card--accent-tomato" : ""}`}
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
        ...(paid ? { borderLeft: "3px solid #22c55e", background: "rgba(34,197,94,0.05)" } : {}),
      }}
    >
      <div>
        <div className="table__name">{bill.name}</div>
        <div className="table__meta">{bill.servicer} · {bill.method}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "var(--font-headline)", fontSize: 22, color: paid ? "#22c55e" : "var(--ink)", fontWeight: 900 }}>
          ${bill.amount != null ? bill.amount.toFixed(2) : "—"}
        </div>
        <div className="table__meta">Due {bill.payDay ?? bill.dueDay ?? "—"}</div>
      </div>
      {paid === true
        ? <span className="pill pill--current" style={{ background: "#22c55e", color: "#fff", fontWeight: 700, minWidth: 60, textAlign: "center" }}>Paid ✓</span>
        : <span className={`pill pill--${bill.autopay ? "current" : "urgent"}`}>{bill.autopay ? "autopay" : "MANUAL"}</span>
      }
    </div>
  );
}

Object.assign(window, { BillsView });
