// Cross-device state sync via Vercel Blob backend
const SYNC_KEYS = ["phw.milestones", "phw.projectLogs", "phw.disc", "phw.paidCards", "phw.doneIds"];

window.StateSync = {
  async load(email) {
    try {
      const res = await fetch("/api/state?email=" + encodeURIComponent(email));
      if (!res.ok) return;
      const remote = await res.json();
      for (const key of SYNC_KEYS) {
        if (remote[key] !== undefined) {
          localStorage.setItem(key, JSON.stringify(remote[key]));
        }
      }
    } catch (e) {
      console.warn("StateSync.load failed:", e);
    }
  },

  async save(email) {
    try {
      const state = {};
      for (const key of SYNC_KEYS) {
        const raw = localStorage.getItem(key);
        if (raw !== null) {
          try { state[key] = JSON.parse(raw); } catch { state[key] = raw; }
        }
      }
      await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, state }),
      });
    } catch (e) {
      console.warn("StateSync.save failed:", e);
    }
  },
};
