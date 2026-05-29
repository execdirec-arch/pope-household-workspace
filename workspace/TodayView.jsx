/* TODAY view — household daily briefing rendered as a workspace dashboard. */
function TodayView({ data, toggleTodo, doneIds, onSetFocus }) {
  const d = data;
  const tasks = [...d.todos.development, ...(d.todos.programs || []), ...(d.todos.grants || [])];
  const doneCount = tasks.filter(t => doneIds.has(t.id)).length;
  const hotNudge = (d.nudges || []).find(n => n.tone === "urgent");
  const pulse = d.today.pulse || {};

  const billsDue = (d.bills || []).filter(b => b.status === "due-soon").length;
  const debtTotal = d.debt ? d.debt.total : 0;

  return (
    <div>
      <div className="view__header">
        <div>
          <h1 className="view__title">Today.</h1>
          <p className="view__subtitle">
            {hotNudge ? hotNudge.title + "." : "Your morning briefing is the single source of truth."}
            {" "}Pick one thing.
          </p>
        </div>
      </div>

      {/* Strategic Nudges */}
      <div className="section-header">
        <h2 className="section-header__title">Nudges</h2>
        <div className="section-header__meta">{d.nudges.length} for today</div>
      </div>
      <div className="grid grid-2" style={{ marginBottom: 'var(--section-pad)' }}>
        {d.nudges.map((n, i) => (
          <div key={i} className={`nudge nudge--${n.tone}`}>
            <div className="nudge__mark">{["!", "★", "#", "~"][i % 4]}</div>
            <div className="nudge__content">
              <h3 className="nudge__title">{n.title}</h3>
              <p className="nudge__body">{n.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Todos + Schedule */}
      <div className="grid grid-2" style={{ marginBottom: 'var(--section-pad)' }}>
        <div>
          <div className="section-header">
            <h2 className="section-header__title">To-do today</h2>
            <div className="section-header__meta">{doneCount}/{tasks.length} complete</div>
          </div>
          <TodoGroup title="Urgent" items={d.todos.development} doneIds={doneIds} toggleTodo={toggleTodo} onSetFocus={onSetFocus} />
          <TodoGroup title="This week" items={d.todos.programs || []} doneIds={doneIds} toggleTodo={toggleTodo} onSetFocus={onSetFocus} />
          <TodoGroup title="Fill-in" items={d.todos.grants || []} doneIds={doneIds} toggleTodo={toggleTodo} onSetFocus={onSetFocus} />
        </div>

        <div>
          <div className="section-header">
            <h2 className="section-header__title">Coming up</h2>
            <div className="section-header__meta">{d.today.monthDay} →</div>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <table className="table">
              <thead><tr><th>When</th><th>What</th><th></th></tr></thead>
              <tbody>
                {d.schedule.map((s, i) => (
                  <tr key={i}>
                    <td className="mono" style={{whiteSpace:"nowrap"}}>{s.when}</td>
                    <td>
                      <div className="table__name">{s.label}</div>
                      <div className="table__meta">{s.who} · {s.note}</div>
                    </td>
                    <td style={{textAlign:"right"}}>
                      <span className={`pill pill--${s.status}`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Household pulse */}
      <div className="section-header">
        <h2 className="section-header__title">Household pulse</h2>
        <div className="section-header__meta">live from the vault</div>
      </div>
      <div className="grid grid-4" style={{ marginBottom: 'var(--section-pad)' }}>
        <KpiTile
          label="Bills due this week"
          value={String(billsDue)}
          delta={billsDue > 0 ? "action needed" : "all clear"}
          deltaKind={billsDue > 0 ? "down" : "up"}
          progress={billsDue > 0 ? 1 : 0}
          progressLabel="check Bills view"
        />
        <KpiTile
          label="Total debt"
          value={`$${debtTotal.toLocaleString()}`}
          delta="avalanche in progress"
          deltaKind="flat"
          progress={1 - (debtTotal / 70000)}
          progressLabel="of $65K to eliminate"
        />
        <KpiTile
          label="Active projects"
          value={String((d.wips || []).filter(w => w.urgency === "hot").length)}
          delta="need attention"
          deltaKind="flat"
          progress={(d.wips || []).filter(w => w.urgency === "hot").length / (d.wips || []).length}
          progressLabel={`of ${(d.wips || []).length} total`}
        />
        <KpiTile
          label="Open loops"
          value={String(d.inbox.filter(i => ["action","chase"].includes(i.priority)).length)}
          delta="need closure"
          deltaKind={d.inbox.filter(i => i.priority === "action").length > 0 ? "down" : "up"}
          progress={d.inbox.filter(i => ["action","chase"].includes(i.priority)).length / Math.max(1, d.inbox.length)}
          progressLabel="in inbox"
        />
      </div>
    </div>
  );
}

function TodoGroup({ title, items, doneIds, toggleTodo, onSetFocus }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="card" style={{ marginBottom: 'var(--card-gap)' }}>
      <div className="card__eyebrow">
        <span className="card__eyebrow-dot" />{title}
      </div>
      {items.map(t => (
        t._header ? (
          <div key={t.id} className="card__eyebrow" style={{ marginTop: 8, opacity: 0.7 }}>
            <span className="card__eyebrow-dot" />{t.label.replace(/^—\s*|\s*—$/g, "")}
          </div>
        ) : (
          <div key={t.id} className={`todo ${doneIds.has(t.id) ? 'todo--done' : ''}`}>
            <div
              className={`todo__check ${doneIds.has(t.id) ? 'todo__check--done' : ''}`}
              onClick={() => toggleTodo(t.id)}
            />
            <div className="todo__body">
              <div className="todo__label">{t.label}</div>
              {t.note && <div className="todo__note">{t.note}</div>}
            </div>
            <div className="todo__meta">
              {t.urgent && <span className="pill pill--urgent">now</span>}
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => onSetFocus({ label: t.label, view: "today", id: t.id, meta: t.note })}
                title="Hold this at the center"
              >
                <Icon name="pin" size={11} />
              </button>
            </div>
          </div>
        )
      ))}
    </div>
  );
}

function KpiTile({ label, value, delta, deltaKind, progress, progressLabel }) {
  return (
    <div className="kpi">
      <div className="kpi__label">{label}</div>
      <div className="kpi__value">{value}</div>
      <div className={`kpi__delta kpi__delta--${deltaKind}`}>{delta}</div>
      <div className="kpi__progress">
        <div className="kpi__progress-fill" style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
      </div>
      <div className="muted" style={{ fontSize: 10, marginTop: 4 }}>{progressLabel}</div>
    </div>
  );
}

Object.assign(window, { TodayView, KpiTile, TodoGroup });
