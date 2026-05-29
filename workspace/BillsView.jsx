/* BILLS view — bills due soon + full recurring bill list. */
function BillsView({ data }) {
  const bills = data.bills || [];
  const dueSoon = bills.filter(b => b.status === "due-soon");
  const upcoming = bills.filter(b => b.status === "upcoming");
  const active = bills.filter(b => b.status === "active");

  const monthlyFixed = bills.reduce((s, b) => s + (b.amount || 0), 0);

  return (
    <div>
      <div className="view__header">
        <div>
          <h1 className="view__title">Bills.</h1>
          <p className="view__subtitle">
            {dueSoon.length > 0
              ? `${dueSoon.length} bill${dueSoon.length > 1 ? "s" : ""} due this week. Don't let them slip.`
              : "No bills due in the next 7 days."}
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
          <div className="stack" style={{ marginBottom: 'var(--section-pad)' }}>
            {dueSoon.map(b => <BillRow key={b.id} bill={b} urgent />)}
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
          <div className="stack" style={{ marginBottom: 'var(--section-pad)' }}>
            {upcoming.map(b => <BillRow key={b.id} bill={b} />)}
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
              <th>Autopay</th>
              <th>Servicer</th>
              <th>Method</th>
            </tr>
          </thead>
          <tbody>
            {bills.map(b => (
              <tr key={b.id}>
                <td><div className="table__name">{b.name}</div></td>
                <td className="mono">${b.amount.toFixed(2)}</td>
                <td className="mono">{b.dueDate}</td>
                <td>
                  <span className={`pill pill--${b.autopay ? 'current' : 'warn'}`}>
                    {b.autopay ? "autopay" : "manual"}
                  </span>
                </td>
                <td><div className="table__meta">{b.servicer}</div></td>
                <td><div className="table__meta">{b.method}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card card--tinted" style={{ marginTop: 'var(--card-gap)' }}>
        <div className="card__eyebrow"><span className="card__eyebrow-dot" />Note</div>
        <p className="card__body" style={{ margin: 0 }}>
          Bills marked <strong>manual</strong> are the ones that slip. Mortgage and HELOC both hit June 1 and are manual. Confirm payment or set up autopay.
          Bills with <strong>[TBD]</strong> due dates need confirmation — update the vault page once you know.
        </p>
      </div>
    </div>
  );
}

function BillRow({ bill, urgent }) {
  return (
    <div className={`card ${urgent ? 'card--accent-tomato' : ''}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
      <div>
        <div className="table__name">{bill.name}</div>
        <div className="table__meta">{bill.servicer} · {bill.method}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "var(--font-headline)", fontSize: 22, color: "var(--ink)", fontWeight: 900 }}>
          ${bill.amount.toFixed(2)}
        </div>
        <div className="table__meta">Due {bill.dueDate}</div>
      </div>
      <span className={`pill pill--${bill.autopay ? 'current' : 'urgent'}`}>
        {bill.autopay ? "autopay" : "MANUAL"}
      </span>
    </div>
  );
}

Object.assign(window, { BillsView });
