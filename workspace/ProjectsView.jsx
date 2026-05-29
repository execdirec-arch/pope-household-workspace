/* PROJECTS view — active household projects. */
function ProjectsView({ data, onSetFocus }) {
  const wips = data.wips || [];
  const hot = wips.filter(w => w.urgency === "hot");
  const warm = wips.filter(w => w.urgency === "warm");
  const cool = wips.filter(w => w.urgency === "cool");

  return (
    <div>
      <div className="view__header">
        <div>
          <h1 className="view__title">Projects.</h1>
          <p className="view__subtitle">
            {hot.length} active · {warm.length} in progress · {cool.length} planning.
          </p>
        </div>
      </div>

      {hot.length > 0 && (
        <>
          <div className="section-header">
            <h2 className="section-header__title">Active now</h2>
            <div className="section-header__meta">{hot.length} hot</div>
          </div>
          <div className="stack" style={{ marginBottom: 'var(--section-pad)' }}>
            {hot.map(w => <ProjectCard key={w.id} wip={w} onSetFocus={onSetFocus} />)}
          </div>
        </>
      )}

      {warm.length > 0 && (
        <>
          <div className="section-header">
            <h2 className="section-header__title">In progress</h2>
            <div className="section-header__meta">{warm.length} projects</div>
          </div>
          <div className="stack" style={{ marginBottom: 'var(--section-pad)' }}>
            {warm.map(w => <ProjectCard key={w.id} wip={w} onSetFocus={onSetFocus} />)}
          </div>
        </>
      )}

      {cool.length > 0 && (
        <>
          <div className="section-header">
            <h2 className="section-header__title">Planning</h2>
            <div className="section-header__meta">{cool.length} projects</div>
          </div>
          <div className="stack" style={{ marginBottom: 'var(--section-pad)' }}>
            {cool.map(w => <ProjectCard key={w.id} wip={w} onSetFocus={onSetFocus} />)}
          </div>
        </>
      )}
    </div>
  );
}

function ProjectCard({ wip, onSetFocus }) {
  const urgencyPill = { hot: "urgent", warm: "major", cool: "muted" }[wip.urgency] || "muted";
  const accentClass = { hot: "card--accent-tomato", warm: "card--accent-green", cool: "" }[wip.urgency] || "";
  return (
    <div className={`card ${accentClass}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        <div>
          <div className="card__eyebrow">
            <span className="card__eyebrow-dot" />{wip.phase}
          </div>
          <h3 className="card__title">{wip.title}</h3>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <span className={`pill pill--${urgencyPill}`}>{wip.urgency}</span>
          <span className="pill pill--muted">{wip.dueLabel}</span>
        </div>
      </div>
      <p className="card__body" style={{ marginBottom: 12 }}>{wip.summary}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, paddingTop: 10, borderTop: "1px solid var(--paper-edge)" }}>
        <div>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)", fontWeight: 700, marginBottom: 2 }}>Next</div>
          <div style={{ fontSize: 13, color: "var(--fg-1)", fontWeight: 600 }}>{wip.next}</div>
          {wip.stats && <div className="table__meta" style={{ marginTop: 3 }}>{wip.stats}</div>}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <span className="muted" style={{ fontSize: 11 }}>→ {wip.owner}</span>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => onSetFocus && onSetFocus({ label: wip.title, view: "wips", id: wip.id, meta: wip.next })}
          >
            <Icon name="pin" size={11} /> Focus
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProjectsView });
