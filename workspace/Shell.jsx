/* Shell: nav rail + main column with topbar + focus strip + view slot. */

window.resetDemoState = function () {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith("phw."))
      .forEach(k => localStorage.removeItem(k));
  } catch (e) {}
  window.location.href = window.location.pathname;
};

const NAV_ITEMS = [
  { id: "today",    label: "Today",    icon: "today",   count: null,                                                                          section: "Daily" },
  { id: "inbox",    label: "Inbox",    icon: "inbox",   count: (d) => d.inbox.filter(i => ["action","rapid","chase"].includes(i.priority)).length, section: "Daily" },
  { id: "ask",      label: "Ask",      icon: "message", count: null,                                                                          section: "Daily" },
  { id: "bank",     label: "Bank",     icon: "fund",    count: null,                                                                          section: "Money" },
  { id: "bills",    label: "Bills",    icon: "fund",    count: (d) => (d.bills || []).filter(b => b.status === "due-soon").length,            section: "Money" },
  { id: "billmap",  label: "Bill Map", icon: "clock",   count: null,                                                                          section: "Money" },
  { id: "debt",     label: "Debt",     icon: "flag",    count: null,                                                                          section: "Money" },
  { id: "wips",     label: "Projects", icon: "wips",    count: (d) => (d.wips || []).filter(w => w.urgency === "hot").length,                 section: "Household" },
  { id: "family",   label: "Family",   icon: "clock",   count: null,                                                                          section: "Household" },
];

function Nav({ view, setView, data, focus, goToFocus }) {
  const sections = ["Daily", "Money", "Household"];
  const initials = ((data.user.firstName || "")[0] || "") + ((data.user.lastName || "")[0] || "");

  return (
    <nav className="nav">
      <div className="nav__brand">
        <div className="nav__brand-mark">{(data.org && data.org.mark) || "P"}</div>
        <div>
          <div className="nav__brand-name">{(data.org && data.org.short) || "Household"}</div>
          <span className="nav__brand-sub">Household Ops</span>
        </div>
      </div>

      {sections.map(sec => (
        <React.Fragment key={sec}>
          <div className="nav__section-label">{sec}</div>
          {NAV_ITEMS.filter(it => it.section === sec).map(item => (
            <NavItem key={item.id} item={item} active={view === item.id} onClick={() => setView(item.id)} data={data} />
          ))}
        </React.Fragment>
      ))}

      {focus && (
        <div className="nav__focus" onClick={goToFocus} title="Jump back to what you were working on">
          <span className="nav__focus-label">Where you left off</span>
          <div>{focus.label}</div>
        </div>
      )}

      <div className="nav__footer">
        <div className="nav__user">
          <div className="nav__user-avatar">{initials.toUpperCase()}</div>
          <div>
            <div className="nav__user-name">{data.user.firstName} {data.user.lastName}</div>
            <div className="muted" style={{ fontSize: 10 }}>{data.user.role}</div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavItem({ item, active, onClick, data }) {
  const count = item.count ? item.count(data) : null;
  return (
    <button className="nav__item" aria-current={active} onClick={onClick}>
      <Icon name={item.icon} size={16} />
      <span>{item.label}</span>
      {count != null && count > 0 && <span className="nav__item-count">{count}</span>}
    </button>
  );
}

function Topbar({ data, vaultState, onConnect, onReauthorize, onRefresh, onDisconnect }) {
  const t = data.today;
  const showCta = vaultState && (vaultState.status === "disconnected" || vaultState.status === "unsupported");
  return (
    <div className="topbar">
      <div>
        <div className="topbar__greeting">
          <span className="topbar__greet-primary">Good morning, {data.user.firstName}.</span>
          <span className="topbar__greet-dim">{t.weekday} · {t.monthDay}, {t.year}</span>
        </div>
        <VaultBadge state={vaultState} onConnect={onConnect} onReauthorize={onReauthorize} onRefresh={onRefresh} onDisconnect={onDisconnect} />
      </div>
      <div className="topbar__countdowns">
        {t.countdowns.map((c, i) => (
          <div key={i} className={`countdown countdown--${c.days <= 3 ? 'urgent' : c.days <= 7 ? 'major' : ''}`}>
            <div className="countdown__days">{c.days}d</div>
            <div className="countdown__label">
              <div className="countdown__label-name">{c.label}</div>
              <div className="countdown__label-date">{c.date}</div>
            </div>
          </div>
        ))}
        <ResetDemoButton />
      </div>
    </div>
  );
}

function VaultBadge({ state, onConnect, onReauthorize, onRefresh, onDisconnect }) {
  if (!state) return null;
  const s = state.status;
  if (s === "unsupported") {
    return (
      <div style={{ marginTop: 6, fontSize: 11, color: "var(--fg-3)" }}>
        <span className="pill pill--current">Live demo · Pope Household</span>
        <span style={{ marginLeft: 6 }}>Open in Chrome/Edge/Arc to connect your vault.</span>
      </div>
    );
  }
  if (s === "disconnected") {
    return (
      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
        <span className="pill pill--current">Live demo · Pope Household</span>
        <button className="btn btn--sm btn--ghost" onClick={onConnect}>
          <Icon name="vault" size={11} /> Connect your vault
        </button>
        <span className="muted" style={{ fontSize: 11 }}>local install only</span>
      </div>
    );
  }
  if (s === "needs-permission") {
    return (
      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
        <span className="pill pill--warn">Vault · needs permission</span>
        <span className="muted" style={{ fontSize: 11 }}>{state.rootName}</span>
        <button className="btn btn--sm btn--primary" onClick={onReauthorize}>Reauthorize</button>
      </div>
    );
  }
  if (s === "error") {
    return (
      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
        <span className="pill pill--urgent">Vault · error</span>
        <span className="muted" style={{ fontSize: 11 }}>{state.error}</span>
        <button className="btn btn--sm" onClick={onConnect}>Reconnect</button>
      </div>
    );
  }
  const src = state.dailyDate
    ? (state.daysAgo === 0 ? `today's briefing` : `briefing from ${state.dailyDate} (${state.daysAgo}d ago)`)
    : `no recent briefing found`;
  return (
    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
      <span className="pill pill--current">Vault · {state.rootName}</span>
      <span className="muted" style={{ fontSize: 11 }}>Live from {src}</span>
      <button className="btn btn--ghost btn--sm" onClick={onRefresh} title="Re-read vault">
        <Icon name="trendUp" size={11} /> Refresh
      </button>
      <button className="btn btn--ghost btn--sm" onClick={onDisconnect} title="Disconnect">Disconnect</button>
    </div>
  );
}

function FocusStrip({ focus, onResume, onClear, onSetFocus }) {
  if (!focus) {
    return (
      <div className="focus-strip">
        <div>
          <div className="focus-strip__eyebrow">Focus</div>
          <div className="focus-strip__label">Pick one thing to hold the center today</div>
        </div>
        <div className="focus-strip__actions">
          <button className="btn btn--primary" onClick={() => onSetFocus({ label: "Pick the one thing", view: "today", id: "focus" })}>
            <Icon name="pin" size={14} /> Set focus
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="focus-strip">
      <div>
        <div className="focus-strip__eyebrow">Holding the center</div>
        <div className="focus-strip__label">{focus.label}</div>
        {focus.meta && <div className="focus-strip__meta">{focus.meta}</div>}
      </div>
      <div className="focus-strip__actions">
        <button className="btn" onClick={onResume}>Resume</button>
        <button className="btn" onClick={onClear}>Clear</button>
      </div>
    </div>
  );
}

function ResetDemoButton() {
  const [armed, setArmed] = React.useState(false);
  React.useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(t);
  }, [armed]);
  if (armed) {
    return (
      <div className="nav__reset nav__reset--armed">
        <div className="nav__reset-label">Reset?</div>
        <div className="nav__reset-actions">
          <button className="nav__reset-confirm" onClick={() => window.resetDemoState()}>Yes</button>
          <button className="nav__reset-cancel" onClick={() => setArmed(false)}>No</button>
        </div>
      </div>
    );
  }
  return (
    <button className="nav__reset" onClick={() => setArmed(true)} title="Reset demo state">
      ↻ Reset demo
    </button>
  );
}

Object.assign(window, { Nav, Topbar, FocusStrip, ResetDemoButton });
