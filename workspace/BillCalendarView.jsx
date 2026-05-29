/* BILL CALENDAR — monthly bill map with pay-cycle checkpoints */
function BillCalendarView({ data }) {
  const { useState } = React;
  const bills = (data.bills || []).filter(b => b.dueDay);
  const unscheduled = (data.bills || []).filter(b => !b.dueDay);
  const paySchedule = data.paySchedule || { dates: [], amount: 0, name: "Paycheck" };

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun

  // Pay dates falling in this month — parse as local to avoid UTC-offset day shift
  function parseLocalDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const monthPayDays = paySchedule.dates
    .map(parseLocalDate)
    .filter(d => d.getFullYear() === year && d.getMonth() === month)
    .map(d => d.getDate());

  // Group bills by dueDay
  const byDay = {};
  bills.forEach(b => {
    const d = b.dueDay;
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(b);
  });

  // Max spend on any single day (for heatmap scaling)
  const dayTotals = {};
  for (let d = 1; d <= daysInMonth; d++) {
    dayTotals[d] = (byDay[d] || []).reduce((s, b) => s + b.amount, 0);
  }
  const maxDay = Math.max(...Object.values(dayTotals), 1);

  // Pay-cycle windows
  const sortedPayDays = [...monthPayDays].sort((a, b) => a - b);
  function windowFor(day) {
    // Which pay window does this day belong to?
    // Window starts on payday, ends day before next payday
    for (let i = sortedPayDays.length - 1; i >= 0; i--) {
      if (day >= sortedPayDays[i]) return i;
    }
    return -1; // before first payday
  }

  // Checkpoint summaries
  function checkpointSummary(payDayIndex) {
    const start = sortedPayDays[payDayIndex];
    const end = payDayIndex + 1 < sortedPayDays.length ? sortedPayDays[payDayIndex + 1] - 1 : daysInMonth;
    const windowBills = bills.filter(b => b.dueDay >= start && b.dueDay <= end);
    const total = windowBills.reduce((s, b) => s + b.amount, 0);
    return { start, end, bills: windowBills, total };
  }

  function fmt(n) { return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
  function fmtAmt(n) { return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  // Build calendar grid cells
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const today = new Date();
  const isThisMonth = today.getFullYear() === year && today.getMonth() === month;

  function heatColor(total) {
    if (total === 0) return "transparent";
    const ratio = Math.min(total / maxDay, 1);
    // warm amber → red as amount increases
    if (ratio < 0.25) return "rgba(251,191,36,0.15)";
    if (ratio < 0.5)  return "rgba(251,191,36,0.30)";
    if (ratio < 0.75) return "rgba(239,68,68,0.25)";
    return "rgba(239,68,68,0.45)";
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const totalScheduled = bills.reduce((s, b) => s + b.amount, 0);
  const totalUnscheduled = unscheduled.reduce((s, b) => s + b.amount, 0);

  return (
    <div>
      <div className="view__header">
        <div>
          <h1 className="view__title">Bill Map.</h1>
          <p className="view__subtitle">
            {fmt(totalScheduled)} scheduled · {fmt(totalUnscheduled)} unscheduled · {fmt(totalScheduled + totalUnscheduled)} total monthly
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn btn--ghost" onClick={prevMonth}>←</button>
          <span style={{ fontWeight: 700, fontSize: 15, minWidth: 140, textAlign: "center" }}>{monthNames[month]} {year}</span>
          <button className="btn btn--ghost" onClick={nextMonth}>→</button>
        </div>
      </div>

      {/* Pay-cycle checkpoints */}
      {sortedPayDays.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${sortedPayDays.length}, 1fr)`, gap: 12, marginBottom: "var(--section-pad)" }}>
          {sortedPayDays.map((pd, i) => {
            const { start, end, bills: wb, total } = checkpointSummary(i);
            const remaining = paySchedule.amount - total;
            return (
              <div key={pd} className="card" style={{ borderTop: "3px solid var(--rehumanize-green)" }}>
                <div className="card__eyebrow"><span className="card__eyebrow-dot" />Paycheck {i + 1} — Day {pd}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", margin: "4px 0 2px" }}>{fmtAmt(paySchedule.amount)}</div>
                <div style={{ fontSize: 12, color: "var(--fg-2)", marginBottom: 8 }}>Days {start}–{end} bills: <strong style={{ color: total > paySchedule.amount ? "#ef4444" : "var(--ink)" }}>{fmtAmt(total)}</strong></div>
                <div style={{ borderTop: "1px solid var(--paper-edge)", paddingTop: 8 }}>
                  <div style={{ fontSize: 12, color: remaining < 0 ? "#ef4444" : "var(--fg-2)" }}>
                    {remaining < 0 ? "⚠ Shortfall" : "Remaining after bills"}: <strong>{fmtAmt(Math.abs(remaining))}</strong>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 6 }}>
                    {wb.map(b => b.name).join(" · ")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Calendar grid */}
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "var(--section-pad)" }}>
        {/* Day-of-week header */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--paper-edge)" }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--fg-3)", padding: "8px 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{d}</div>
          ))}
        </div>
        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: wi < weeks.length - 1 ? "1px solid var(--paper-edge)" : "none" }}>
            {week.map((day, di) => {
              if (!day) return <div key={di} style={{ minHeight: 90, background: "var(--paper-2)" }} />;
              const dayBills = byDay[day] || [];
              const dayTotal = dayTotals[day] || 0;
              const isToday = isThisMonth && day === today.getDate();
              const isPayDay = monthPayDays.includes(day);
              const winIdx = windowFor(day);

              return (
                <div key={di} style={{
                  minHeight: 90,
                  padding: "6px 8px",
                  background: heatColor(dayTotal),
                  borderLeft: di > 0 ? "1px solid var(--paper-edge)" : "none",
                  borderTop: isPayDay ? "2px solid var(--rehumanize-green)" : "none",
                  position: "relative",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <span style={{
                      fontSize: 12, fontWeight: isToday ? 800 : 600,
                      color: isToday ? "var(--rehumanize-green)" : "var(--fg-2)",
                      background: isToday ? "var(--rehumanize-green-light, #e8eef7)" : "transparent",
                      borderRadius: 10, padding: isToday ? "1px 5px" : 0,
                    }}>{day}</span>
                    {isPayDay && <span style={{ fontSize: 9, fontWeight: 700, color: "var(--rehumanize-green)", textTransform: "uppercase", letterSpacing: "0.05em" }}>PAY</span>}
                  </div>
                  {dayTotal > 0 && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: dayTotal > 1000 ? "#dc2626" : "var(--fg-2)", marginBottom: 3 }}>
                      {fmt(dayTotal)}
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {dayBills.map(b => (
                      <div key={b.id} style={{
                        fontSize: 9, lineHeight: 1.2,
                        background: b.autopay ? "rgba(43,76,126,0.12)" : "rgba(239,68,68,0.12)",
                        color: b.autopay ? "var(--rehumanize-green-deep)" : "#dc2626",
                        borderRadius: 3, padding: "1px 4px",
                        fontWeight: 600,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {b.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: "var(--section-pad)", fontSize: 11, color: "var(--fg-2)", flexWrap: "wrap" }}>
        <span><span style={{ display: "inline-block", width: 10, height: 10, background: "rgba(43,76,126,0.2)", borderRadius: 2, marginRight: 4 }} />Autopay</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, background: "rgba(239,68,68,0.2)", borderRadius: 2, marginRight: 4 }} />Manual</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, background: "rgba(251,191,36,0.3)", borderRadius: 2, marginRight: 4 }} />Low spend day</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, background: "rgba(239,68,68,0.4)", borderRadius: 2, marginRight: 4 }} />Heavy spend day</span>
        <span style={{ borderTop: "2px solid var(--rehumanize-green)", paddingTop: 2 }}>Top border = payday</span>
      </div>

      {/* Unscheduled */}
      {unscheduled.length > 0 && (
        <>
          <div className="section-header">
            <h2 className="section-header__title">No due date yet</h2>
            <div className="section-header__meta">{fmtAmt(totalUnscheduled)}/mo</div>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr><th>Bill</th><th>Amount</th><th>Method</th><th>Servicer</th></tr>
              </thead>
              <tbody>
                {unscheduled.map(b => (
                  <tr key={b.id}>
                    <td><div className="table__name">{b.name}</div></td>
                    <td><div className="table__name">{fmtAmt(b.amount)}</div></td>
                    <td><div className="table__meta">{b.method}</div></td>
                    <td><div className="table__meta">{b.servicer}</div></td>
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

Object.assign(window, { BillCalendarView });
