/* ErrorBoundary — wraps each view so a single bug doesn't blank the whole app.
   Without this, an uncaught render error in any view component takes down the
   entire React tree (this is exactly what happened with the DetailRow bug). */

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    this.setState({ info });
    // Surface to console for debugging in dev tools.
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary:${this.props.view || "unknown"}]`, error, info);
  }
  reset = () => this.setState({ error: null, info: null });
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="card" style={{ padding: 24, borderColor: "var(--accent-tomato)", borderLeft: "3px solid var(--accent-tomato)" }}>
        <div className="card__eyebrow" style={{ color: "var(--accent-tomato)" }}>This view crashed</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, margin: "8px 0", color: "var(--ink)" }}>
          Something in the "{this.props.view || "view"}" tab broke.
        </h2>
        <p style={{ fontFamily: "var(--font-editorial)", fontSize: 14, color: "var(--fg-2)", lineHeight: 1.5 }}>
          The other tabs still work — pick one from the nav.
          If you're the developer, open the browser console for the stack trace.
        </p>
        <details style={{ marginTop: 12, fontSize: 12, color: "var(--fg-3)" }}>
          <summary style={{ cursor: "pointer" }}>Error details</summary>
          <pre style={{ marginTop: 8, padding: 12, background: "var(--paper-deep)", borderRadius: 4, overflow: "auto", fontSize: 11, lineHeight: 1.4 }}>
            {String(this.state.error && this.state.error.stack || this.state.error)}
          </pre>
        </details>
        <div style={{ marginTop: 14 }}>
          <button className="btn" onClick={this.reset}>Retry this view</button>
        </div>
      </div>
    );
  }
}

Object.assign(window, { ErrorBoundary });
