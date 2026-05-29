/* LOGIN — Google OAuth gate. Only pope7446@gmail.com and olivercpope@gmail.com allowed. */
function LoginView({ onLogin }) {
  const { useEffect, useState } = React;
  const [error, setError] = useState(null);
  const [gisReady, setGisReady] = useState(false);

  useEffect(() => {
    function initGIS() {
      if (!window.google?.accounts?.id) return;
      if (!window.GOOGLE_CLIENT_ID || window.GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID_HERE") {
        setError("Google Client ID not configured. See workspace/config.js.");
        return;
      }
      window.google.accounts.id.initialize({
        client_id: window.GOOGLE_CLIENT_ID,
        callback: handleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("gsi-btn"),
        { theme: "outline", size: "large", text: "sign_in_with", shape: "rectangular", logo_alignment: "left", width: 260 }
      );
      setGisReady(true);
    }

    // GIS script may not be loaded yet — poll briefly
    if (window.google?.accounts?.id) {
      initGIS();
    } else {
      const t = setInterval(() => {
        if (window.google?.accounts?.id) { clearInterval(t); initGIS(); }
      }, 200);
      return () => clearInterval(t);
    }
  }, []);

  function handleCredential(response) {
    try {
      const payload = JSON.parse(atob(response.credential.split(".")[1]));
      const email = (payload.email || "").toLowerCase();
      const allowed = (window.ALLOWED_EMAILS || []).map(e => e.toLowerCase());
      if (!allowed.includes(email)) {
        setError("Access denied. This workspace is private.");
        return;
      }
      onLogin({ email: payload.email, name: payload.name, picture: payload.picture });
    } catch (e) {
      setError("Sign-in failed. Try again.");
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--paper-deep, #f5f4f1)", fontFamily: "var(--font-body, sans-serif)",
    }}>
      <div style={{
        background: "var(--paper, #fff)", borderRadius: 16, padding: "48px 40px",
        maxWidth: 400, width: "100%", textAlign: "center",
        boxShadow: "0 4px 32px rgba(0,0,0,0.10)",
      }}>
        <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 6, fontFamily: "var(--font-headline, serif)" }}>
          Pope Household
        </div>
        <div style={{ fontSize: 14, color: "var(--fg-3, #888)", marginBottom: 40 }}>
          Private workspace
        </div>

        <div id="gsi-btn" style={{ display: "flex", justifyContent: "center", minHeight: 44 }} />

        {!gisReady && !error && (
          <div style={{ fontSize: 13, color: "var(--fg-3, #888)", marginTop: 16 }}>Loading…</div>
        )}

        {error && (
          <div style={{
            marginTop: 20, padding: "10px 14px", background: "#fef2f2",
            border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, color: "#dc2626",
          }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 32, fontSize: 11, color: "var(--fg-3, #aaa)" }}>
          Only authorized household accounts can sign in.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginView });
