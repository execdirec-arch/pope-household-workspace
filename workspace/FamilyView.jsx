/* FAMILY view — household members, homeschool status, people in orbit. */
function FamilyView({ data }) {
  const people = data.people || [];
  const kids = people.filter(p => p.tags && p.tags.includes("kids"));
  const professionals = people.filter(p => p.tags && p.tags.includes("professional"));

  return (
    <div>
      <div className="view__header">
        <div>
          <h1 className="view__title">Family.</h1>
          <p className="view__subtitle">
            Household members, homeschool, and the people in our orbit.
          </p>
        </div>
      </div>

      {/* Kids */}
      <div className="section-header">
        <h2 className="section-header__title">Kids</h2>
        <div className="section-header__meta">{kids.length} kids tracked</div>
      </div>
      <div className="grid grid-3" style={{ marginBottom: 'var(--section-pad)' }}>
        {kids.map(p => <PersonCard key={p.id} person={p} />)}
      </div>

      {/* Homeschool note */}
      <div className="card card--tinted" style={{ marginBottom: 'var(--section-pad)' }}>
        <div className="card__eyebrow"><span className="card__eyebrow-dot" />Homeschool platform — planning</div>
        <p className="card__body" style={{ margin: "8px 0 0" }}>
          Per-kid vault pages and workspace views are planned for Anna (17), Charlie (15), Jessie (13), Rose (10), and Finn (7).
          Curriculum details needed before building. Lauren to gather and log in each kid's page, then a dedicated build session will surface them here.
        </p>
      </div>

      {/* Professionals */}
      <div className="section-header">
        <h2 className="section-header__title">Professionals + contacts</h2>
        <div className="section-header__meta">{professionals.length} tracked</div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Role</th><th>Current thread</th></tr>
          </thead>
          <tbody>
            {professionals.map(p => (
              <tr key={p.id}>
                <td><div className="table__name">{p.name}</div></td>
                <td><div className="table__meta">{p.role}</div></td>
                <td><div className="table__meta">{p.thread}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Medical quick ref */}
      <div className="section-header" style={{ marginTop: 'var(--section-pad)' }}>
        <h2 className="section-header__title">Medical quick ref</h2>
      </div>
      <div className="card card--tinted">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--card-gap)" }}>
          {[
            { label: "OLOL Pediatrics", note: "Lynette David · all kids" },
            { label: "OLOL Children's Neurology", note: "Anna + Rose" },
            { label: "Ochsner Neurology", note: "Lauren" },
            { label: "Dr. Sean Shannon (Rheumatology)", note: "Oliver" },
            { label: "Renaissance Dermatology", note: "Lauren + Oliver" },
            { label: "Bonin Clinic (Primary)", note: "Lauren + Oliver" },
            { label: "Louisiana Dental Center", note: "Family" },
          ].map((m, i) => (
            <div key={i}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>{m.label}</div>
              <div className="table__meta">{m.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PersonCard({ person }) {
  const isHomeschool = person.tags && person.tags.includes("homeschool");
  return (
    <div className="card">
      <div className="card__eyebrow">
        <span className="card__eyebrow-dot" />
        {isHomeschool ? "Homeschool" : "Household"}
      </div>
      <h3 className="card__title" style={{ fontSize: 16, marginBottom: 4 }}>{person.name}</h3>
      <div className="table__meta" style={{ marginBottom: 8 }}>{person.role}</div>
      {person.thread && person.thread !== "[TBD]" && (
        <div style={{ fontSize: 12, color: "var(--fg-2)", borderTop: "1px solid var(--paper-edge)", paddingTop: 8 }}>
          {person.thread}
        </div>
      )}
      {isHomeschool && (
        <span className="pill pill--muted" style={{ marginTop: 8, display: "inline-flex" }}>pages TBD</span>
      )}
    </div>
  );
}

Object.assign(window, { FamilyView });
