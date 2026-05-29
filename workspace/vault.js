/* ============================================================================
   vault.js — Obsidian vault connector + markdown parser
   Browser-only. Uses File System Access API (Chrome/Edge/Arc).
   Persists the directory handle in IndexedDB so Lauren picks the folder once.
   ============================================================================ */

/* ----- Pure markdown helpers (extracted for testability). Exposed on
   window so tests can call them directly without a real vault. ----- */
function insertUpdateEntry(text, dateISO, summary) {
  const newEntry = `**${dateISO}:** ${summary}`;
  const updatesRe = /(^|\n)##\s+Updates\s*\n+/;
  const m = text.match(updatesRe);
  if (m) {
    const insertAt = m.index + m[0].length;
    return text.slice(0, insertAt) + newEntry + "\n\n" + text.slice(insertAt);
  }
  const trailing = text.endsWith("\n") ? "" : "\n";
  return text + `${trailing}\n## Updates\n\n${newEntry}\n`;
}
if (typeof window !== "undefined") { window.insertUpdateEntry = insertUpdateEntry; }

(function () {
  const DB_NAME = "rhw-vault";
  const STORE = "handles";
  const KEY = "vault-root";

  // ---------- IndexedDB helpers ----------
  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function idbGet(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function idbSet(key, val) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(val, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  async function idbDel(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ---------- Public API ----------
  const Vault = {
    root: null,                  // FileSystemDirectoryHandle
    rootName: null,              // display name

    supported() {
      return typeof window.showDirectoryPicker === "function";
    },

    async restore() {
      try {
        const handle = await idbGet(KEY);
        if (!handle) return null;
        // Re-request permission silently if possible
        const perm = await handle.queryPermission({ mode: "readwrite" });
        if (perm === "granted") {
          this.root = handle;
          this.rootName = handle.name;
          return handle;
        }
        // Need user gesture to re-prompt; return handle so UI can prompt
        this.root = null;
        return { needsPermission: true, handle };
      } catch (e) {
        console.warn("[vault] restore failed:", e);
        return null;
      }
    },

    async reauthorize(handle) {
      const perm = await handle.requestPermission({ mode: "readwrite" });
      if (perm === "granted") {
        this.root = handle;
        this.rootName = handle.name;
        return true;
      }
      return false;
    },

    async connect() {
      if (!this.supported()) {
        throw new Error("Folder picker not supported. Use Chrome, Edge, or Arc.");
      }
      const handle = await window.showDirectoryPicker({
        id: "rhw-vault",
        mode: "readwrite",
        startIn: "documents",
      });
      this.root = handle;
      this.rootName = handle.name;
      await idbSet(KEY, handle);
      return handle;
    },

    async disconnect() {
      this.root = null;
      this.rootName = null;
      await idbDel(KEY);
    },

    /* --------- File read/write --------- */
    // Resolve a path like "Daily/2026-04-19.md" to a file handle
    async getFileHandle(pathParts, { create = false } = {}) {
      if (!this.root) throw new Error("Vault not connected");
      const parts = Array.isArray(pathParts) ? pathParts : pathParts.split("/");
      let dir = this.root;
      for (let i = 0; i < parts.length - 1; i++) {
        dir = await dir.getDirectoryHandle(parts[i], { create });
      }
      return dir.getFileHandle(parts[parts.length - 1], { create });
    },

    async readText(pathParts) {
      try {
        const fh = await this.getFileHandle(pathParts);
        const f = await fh.getFile();
        return await f.text();
      } catch (e) {
        return null;
      }
    },

    async writeText(pathParts, text) {
      const fh = await this.getFileHandle(pathParts, { create: true });
      const w = await fh.createWritable();
      await w.write(text);
      await w.close();
    },

    async backup(pathParts, text) {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const parts = Array.isArray(pathParts) ? pathParts : pathParts.split("/");
      const backupPath = [".rhw-backup", stamp, ...parts];
      await this.writeText(backupPath, text);
    },

    async listDir(pathParts) {
      const parts = Array.isArray(pathParts) ? pathParts : pathParts.split("/");
      let dir = this.root;
      for (const p of parts) {
        dir = await dir.getDirectoryHandle(p);
      }
      const entries = [];
      for await (const [name, handle] of dir.entries()) {
        entries.push({ name, kind: handle.kind });
      }
      return entries;
    },

    /* --------- Today helpers --------- */
    todayISO() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    },

    // Try today first, walk back up to 7 days to find the most recent gazette.
    async loadLatestDaily() {
      const now = new Date();
      for (let i = 0; i < 14; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const text = await this.readText(["Daily", `${iso}.md`]);
        if (text) return { date: iso, text, daysAgo: i };
      }
      return null;
    },

    /* --------- WRITE-BACK: keep the vault in sync with what's logged here --------- */

    /* Append a new dated entry to the top of a page's `## Updates` section.
       If the page exists: read, backup, insert entry, write.
       If the page doesn't exist: do nothing (don't silently create files we
       weren't told about).
       Returns { written: bool, path, reason? } */
    async appendUpdateEntry(entityPath, dateISO, summary) {
      if (!this.root) return { written: false, queued: true, reason: "vault not connected" };
      if (!entityPath || !summary) return { written: false, reason: "missing entityPath or summary" };
      const text = await this.readText(entityPath);
      if (text == null) return { written: false, reason: `page not found: ${entityPath}` };
      const next = insertUpdateEntry(text, dateISO, summary);
      await this.backup(entityPath, text);
      await this.writeText(entityPath, next);
      return { written: true, path: entityPath };
    },

    /* Write a phone-bank session log to /Log/phonebank-YYYY-MM-DD.md and
       append a one-line touchpoint entry to each linked entity's Updates section.
       Returns { written: bool, logPath?, touchpoints: [{path, written, reason?}], reason? } */
    async writePhoneBankLog(session, callsById, outcomeMeta) {
      if (!this.root) return { written: false, queued: true, touchpoints: [], reason: "vault not connected" };

      const isoDate = session.startedAt ? session.startedAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
      const logPath = ["Log", `phonebank-${isoDate}.md`];

      // Build the markdown
      const startedAt = new Date(session.startedAt);
      const durMin = Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 60000));
      const logged = Object.entries(session.outcomes);
      const skipped = session.queue.length - logged.length;
      const pledgedTotal = logged.reduce((s, [, e]) => {
        const n = Number(String(e.amount || "").replace(/[^0-9.]/g, ""));
        return s + (isFinite(n) ? n : 0);
      }, 0);

      let md = `---\n`;
      md += `type: phonebank-session\n`;
      md += `date: ${isoDate}\n`;
      md += `started_at: ${session.startedAt}\n`;
      md += `ended_at: ${new Date().toISOString()}\n`;
      md += `duration_min: ${durMin}\n`;
      md += `calls_queued: ${session.queue.length}\n`;
      md += `calls_logged: ${logged.length}\n`;
      md += `calls_skipped: ${skipped}\n`;
      md += `pledged_total: ${pledgedTotal}\n`;
      md += `---\n\n`;
      md += `# Phone Bank — ${isoDate}\n\n`;
      md += `Session ran ${durMin} min. **${session.queue.length} queued · ${logged.length} logged · ${skipped} skipped${pledgedTotal ? ` · $${pledgedTotal.toLocaleString()} pledged` : ""}**.\n\n`;
      md += `## Outcomes\n\n`;
      md += `| # | Name | Outcome | Pledge | Notes |\n`;
      md += `|---|---|---|---|---|\n`;
      session.queue.forEach((id, i) => {
        const c = callsById[id];
        const e = session.outcomes[id];
        const oMeta = e && outcomeMeta && outcomeMeta.find(o => o.id === e.outcome);
        const link = c && c.entityPath ? `[[${c.entityPath.replace(/\.md$/, "")}|${c.name}]]` : (c ? c.name : id);
        const outcomeLabel = oMeta ? oMeta.label : (e ? e.outcome : "Skipped");
        const pledge = e && e.amount ? `$${e.amount}` : "—";
        const note = e && e.note ? e.note.replace(/\|/g, "\\|") : "";
        md += `| ${i + 1} | ${link} | ${outcomeLabel} | ${pledge} | ${note} |\n`;
      });
      md += `\n*Generated by the Workspace phone bank.*\n`;

      // Write the log file (backup if existed)
      const existing = await this.readText(logPath);
      if (existing != null) await this.backup(logPath, existing);
      await this.writeText(logPath, md);

      // Append a touchpoint to each entity that has a vault page + a non-skip outcome
      const touchpoints = [];
      for (const id of session.queue) {
        const c = callsById[id];
        const e = session.outcomes[id];
        if (!c || !c.entityPath || !e) continue;
        const oMeta = outcomeMeta && outcomeMeta.find(o => o.id === e.outcome);
        const outcomeLabel = (oMeta && oMeta.label) || e.outcome;
        const pledgeBit = e.amount ? ` $${e.amount} pledged.` : "";
        const noteBit = e.note ? ` ${e.note}` : "";
        const summary = `Phone bank: ${outcomeLabel.toLowerCase()}.${pledgeBit}${noteBit}`.trim();
        const result = await this.appendUpdateEntry(c.entityPath, isoDate, summary);
        touchpoints.push({ name: c.name, ...result });
      }

      return { written: true, logPath: logPath.join("/"), touchpoints };
    },
  };

  window.Vault = Vault;
})();


/* ============================================================================
   parseGazette(text) — parse Daily/YYYY-MM-DD.md into the data shape that
   Today view consumes. Tolerant: missing sections return [] or null.
   ============================================================================ */
(function () {
  function parseGazette(text) {
    const sections = splitSections(text);

    const KNOWN_TODO_KEYS = new Set([
      "Development",
      "Programs / Operations", "Program / Operations", "Programs", "Program", "Programs / Ops", "Program / Ops",
      "Grants",
      "Content / Social", "Content",
      "Today at a Glance", "Glance",
      "Schedule", "Inbox Priorities",
      "Strategic Nudges", "KPI Pulse",
      "This Week", "Recent Meeting Notes", "Meeting Notes",
      "Morning Gazette", "To-Do Today",
      "Grant Pipeline", "Funding", "Pipeline",
    ]);
    // Gather any other h3 that contains a checklist — fold into development
    // so new subsections (LLM Optimization, New Project, etc.) render without
    // needing a parser update each time.
    const extraTodos = [];
    let extraIdx = 0;
    for (const key of Object.keys(sections)) {
      if (KNOWN_TODO_KEYS.has(key)) continue;
      const body = sections[key] || "";
      if (!/^\s*-\s*\[[ xX]\]/m.test(body)) continue;
      const items = parseTodoList(body, `x${extraIdx++}`);
      if (items.length) {
        // Prepend the bucket name as a virtual header item so Lauren can see grouping.
        extraTodos.push({ id: `xh-${extraIdx}`, label: `— ${key} —`, note: "", urgent: false, done: false, _header: true });
        extraTodos.push(...items);
      }
    }

    return {
      _raw: text,
      _sections: sections,
      weekday: extractWeekday(text),
      monthDay: extractMonthDay(text),
      glance: sectionLines(sections["Today at a Glance"] || sections["Glance"] || ""),
      schedule: parseScheduleTable(sections["Schedule"] || ""),
      inbox: parseInboxChecklist(sections["Inbox Priorities"] || ""),
      todos: {
        development: parseTodoList(sections["Development"] || "", "dev"),
        programs: [
          ...parseTodoList(sections["Programs / Operations"] || sections["Program / Operations"] || sections["Programs"] || sections["Program"] || sections["Programs / Ops"] || sections["Program / Ops"] || "", "prog"),
          ...extraTodos,
        ],
        grants:      parseTodoList(sections["Grants"] || "", "grant"),
      },
      nudges: parseCallouts(sections["Strategic Nudges"] || ""),
      pulse: parseKpiPulse(sections["KPI Pulse"] || ""),
      thisWeek: parseScheduleTable(sections["This Week"] || ""),
      meetings: parseMeetings(sections["Recent Meeting Notes"] || sections["Meeting Notes"] || ""),
    };
  }

  // Split by ## headings (also tolerates ### under nested sections).
  // Emoji and whitespace are stripped from the key for matching.
  function splitSections(text) {
    const out = {};
    const lines = text.split("\n");
    let current = null;
    let buf = [];
    const flush = () => {
      if (current != null) out[current] = buf.join("\n");
      buf = [];
    };
    for (const line of lines) {
      const h2 = line.match(/^##\s+(.+?)\s*$/);
      const h3 = line.match(/^###\s+(.+?)\s*$/);
      if (h2) {
        flush();
        current = cleanHeading(h2[1]);
        continue;
      }
      if (h3) {
        // also register h3s as their own keys so we can pull subheads
        flush();
        current = cleanHeading(h3[1]);
        continue;
      }
      if (current != null) buf.push(line);
    }
    flush();
    return out;
  }

  function cleanHeading(h) {
    // Strip leading emoji(s) and trim
    return h.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200d\s]+/u, "").trim();
  }

  function extractWeekday(text) {
    const m = text.match(/^#\s+Morning Gazette\s*[—-]\s*([A-Za-z]+),/m);
    return m ? m[1] : "";
  }
  function extractMonthDay(text) {
    const m = text.match(/^#\s+Morning Gazette\s*[—-]\s*[A-Za-z]+,\s*([A-Za-z]+\s+\d+)/m);
    return m ? m[1] : "";
  }

  function sectionLines(body) {
    return body
      .split("\n")
      .map((l) => l.replace(/^>\s?/, "").trim())
      .filter(Boolean)
      .filter((l) => !l.startsWith("[!"));
  }

  /* ---------- Schedule ---------- */
  // Matches a simple markdown pipe table. First row = header, rest = data.
  function parseScheduleTable(body) {
    const rows = [];
    const lines = body.split("\n").filter((l) => l.trim().startsWith("|"));
    if (lines.length < 2) return rows;
    const headerCells = splitRow(lines[0]);
    // Skip separator row (---)
    const dataLines = lines.slice(2).filter((l) => !/^\|[\s:|-]+\|?\s*$/.test(l));
    for (const l of dataLines) {
      const cells = splitRow(l);
      if (cells.length === 0) continue;
      const row = {};
      headerCells.forEach((h, i) => { row[h.toLowerCase()] = (cells[i] || "").trim(); });
      rows.push({
        when: row.time || row.when || row.date || cells[0] || "",
        label: row.meeting || row.what || row.event || cells[1] || "",
        who: row.with || row.who || cells[2] || "",
        note: row.notes || row.note || cells[3] || "",
        status: guessStatus(row),
      });
    }
    return rows;
  }
  function splitRow(line) {
    return line
      .replace(/^\|/, "")
      .replace(/\|\s*$/, "")
      .split("|")
      .map((c) => c.trim());
  }
  function guessStatus(row) {
    const s = (row.status || row.notes || "").toLowerCase();
    if (s.includes("confirmed")) return "confirmed";
    if (s.includes("prep")) return "prep";
    if (s.includes("deadline")) return "deadline";
    return "open";
  }

  /* ---------- Inbox / Todos (checkbox lists) ---------- */
  function parseTodoList(body, prefix) {
    const items = [];
    const lines = body.split("\n");
    let idCounter = 0;
    for (const raw of lines) {
      const m = raw.match(/^\s*-\s*\[([ xX])\]\s+(.+)$/);
      if (!m) continue;
      const done = m[1].toLowerCase() === "x";
      let txt = m[2].trim();
      const urgent = /\*\*NOW\*\*|\(now\)|:rotating_light:|⚠️|🔴/i.test(txt);
      txt = txt.replace(/\*\*NOW\*\*|\(now\)/gi, "").trim();
      // Pull a note if there's an em-dash or " — "
      let label = txt, note = "";
      const split = txt.split(/\s+—\s+|\s+--\s+/);
      if (split.length > 1) {
        label = split[0].trim();
        note = split.slice(1).join(" — ").trim();
      }
      items.push({
        id: `${prefix}-${idCounter++}`,
        label,
        note,
        urgent,
        done,
        _raw: raw,
      });
    }
    return items;
  }

  function parseInboxChecklist(body) {
    const rows = parseTodoList(body, "in");
    // Re-shape slightly toward inbox schema
    return rows.map((r, i) => ({
      id: `inbox-${i}`,
      from: r.label.split(/[—-]/)[0].replace(/^\*+|\*+$/g, "").trim() || "(unknown sender)",
      subject: r.label,
      preview: r.note,
      received: "",
      priority: r.urgent ? "rapid" : "action",
      action: r.note,
      tags: [],
    }));
  }

  /* ---------- Strategic Nudges — Obsidian > [!tone] Title \n > body ---------- */
  function parseCallouts(body) {
    const out = [];
    const lines = body.split("\n");
    let i = 0;
    while (i < lines.length) {
      const head = lines[i].match(/^>\s*\[!([a-z-]+)\]\s*(.*)$/i);
      if (!head) { i++; continue; }
      const tone = mapTone(head[1]);
      const title = head[2].trim();
      const bodyLines = [];
      i++;
      while (i < lines.length && lines[i].startsWith(">")) {
        bodyLines.push(lines[i].replace(/^>\s?/, "").trim());
        i++;
      }
      out.push({ tone, title: title || bodyLines.shift() || "", body: bodyLines.join(" ").trim() });
    }
    return out;
  }
  function mapTone(word) {
    const w = word.toLowerCase();
    if (["warning", "danger", "caution"].includes(w)) return "urgent";
    if (["tip", "hint"].includes(w)) return "major";
    if (["info", "note"].includes(w)) return "people";
    if (["success"].includes(w)) return "major";
    if (["example", "quote"].includes(w)) return "metric";
    return "people";
  }

  /* ---------- KPI Pulse: label/value pairs from first table found ----------
     Generic nonprofit KPIs: monthly donors, MRR, active grants, families/
     served. Order-tolerant; matches by keyword in the metric column. */
  function parseKpiPulse(body) {
    const lines = body.split("\n").filter((l) => l.trim().startsWith("|"));
    const pulse = { donors: null, mrr: null, grants: null, families: null };
    for (const l of lines) {
      if (/^\|[\s:|-]+\|?\s*$/.test(l)) continue; // separator
      const cells = splitRow(l);
      if (cells.length < 2) continue;
      const metric = cells[0].toLowerCase();
      if (metric.includes("metric") || metric.includes("kpi")) continue; // header
      const value = cells[1];
      if ((metric.includes("donor") || metric.includes("member")) && (metric.includes("recur") || metric.includes("monthly"))) {
        pulse.donors = Number(String(value).replace(/[^0-9]/g, "")) || null;
      } else if (metric.includes("mrr") || metric.includes("monthly revenue") || metric.includes("recurring revenue")) {
        pulse.mrr = value;
      } else if (metric.includes("grant") && (metric.includes("active") || metric.includes("pipeline"))) {
        pulse.grants = Number(String(value).replace(/[^0-9]/g, "")) || null;
      } else if (metric.includes("famil") || metric.includes("served") || metric.includes("clients")) {
        pulse.families = Number(String(value).replace(/[^0-9]/g, "")) || null;
      }
    }
    return pulse;
  }

  /* ---------- Meetings: bold heading then bullets ---------- */
  function parseMeetings(body) {
    const out = [];
    const blocks = body.split(/\n(?=\*\*|#### )/);
    for (const blk of blocks) {
      const head = blk.match(/^(?:\*\*(.+?)\*\*|####\s+(.+))\s*$/m);
      if (!head) continue;
      const title = (head[1] || head[2] || "").trim();
      const bullets = blk
        .split("\n")
        .filter((l) => /^\s*[-*]\s+/.test(l))
        .map((l) => l.replace(/^\s*[-*]\s+/, "").trim());
      if (bullets.length) out.push({ title, bullets });
    }
    return out;
  }

  window.parseGazette = parseGazette;
})();


/* ============================================================================
   mergeVaultIntoData(vault, fallback)
   Merges parsed gazette data over the static fallback, preserving anything
   the parser couldn't find. Returns a data object shaped like WORKSPACE_DATA.
   ============================================================================ */
window.mergeVaultIntoData = function (parsed, fallback) {
  if (!parsed) return fallback;

  const merged = JSON.parse(JSON.stringify(fallback));

  if (parsed.weekday) merged.today.weekday = parsed.weekday;
  if (parsed.monthDay) merged.today.monthDay = parsed.monthDay;

  if (parsed.nudges && parsed.nudges.length) merged.nudges = parsed.nudges;
  if (parsed.schedule && parsed.schedule.length) merged.schedule = parsed.schedule;
  if (parsed.inbox && parsed.inbox.length) merged.inbox = parsed.inbox;

  if (parsed.todos) {
    if (parsed.todos.development && parsed.todos.development.length) merged.todos.development = parsed.todos.development;
    if (parsed.todos.programs && parsed.todos.programs.length)         merged.todos.programs    = parsed.todos.programs;
    if (parsed.todos.grants && parsed.todos.grants.length)             merged.todos.grants      = parsed.todos.grants;
  }

  if (parsed.pulse) {
    if (parsed.pulse.donors   != null) merged.today.pulse.donors   = parsed.pulse.donors;
    if (parsed.pulse.mrr      != null) merged.today.pulse.mrr      = parsed.pulse.mrr;
    if (parsed.pulse.grants   != null) merged.today.pulse.grants   = parsed.pulse.grants;
    if (parsed.pulse.families != null) merged.today.pulse.families = parsed.pulse.families;
  }

  merged.meetings = parsed.meetings || [];
  merged._parsed = parsed;
  return merged;
};
