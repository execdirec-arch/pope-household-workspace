/* INBOX view — household inbox triage. */
function InboxView({ data }) {
  const inbox = data.inbox || [];
  const action = inbox.filter(i => ["action", "rapid"].includes(i.priority));
  const chase = inbox.filter(i => i.priority === "chase");
  const waiting = inbox.filter(i => i.priority === "waiting");
  const admin = inbox.filter(i => ["admin", "filtered"].includes(i.priority));

  function Group({ title, items, pillKind }) {
    if (!items.length) return null;
    return (
      <>
        <div className="section-header">
          <h2 className="section-header__title">{title}</h2>
          <div className="section-header__meta">{items.length}</div>
        </div>
        <div className="stack" style={{ marginBottom: 'var(--section-pad)' }}>
          {items.map(item => (
            <div key={item.id} className="card" style={{
              display: "grid",
              gridTemplateColumns: "180px 1fr 220px auto",
              gap: 16,
              padding: "var(--row-pad-y) var(--card-pad)",
              alignItems: "center",
            }}>
              <div>
                <div className="table__name truncate">{item.from}</div>
                {item.received && <div className="table__meta">{item.received}</div>}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--fg-1)", marginBottom: 2 }}>{item.subject}</div>
                {item.preview && <div className="table__meta">{item.preview}</div>}
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-2)" }}>{item.action}</div>
              <span className={`pill pill--${pillKind}`}>{item.priority}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <div>
      <div className="view__header">
        <div>
          <h1 className="view__title">Inbox.</h1>
          <p className="view__subtitle">
            {action.length} need action · {chase.length} to chase · {waiting.length} waiting.
          </p>
        </div>
      </div>
      <Group title="Action" items={action} pillKind="urgent" />
      <Group title="Chase" items={chase} pillKind="warn" />
      <Group title="Waiting" items={waiting} pillKind="muted" />
      <Group title="Admin / filtered" items={admin} pillKind="muted" />
    </div>
  );
}

Object.assign(window, { InboxView });
