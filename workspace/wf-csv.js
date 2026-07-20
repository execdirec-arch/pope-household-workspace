/* =======================================================================
   Wells Fargo CSV import — parses "Download Account Activity" exports.
   Vendor-free path for bank data when the Teller feed is down.

   Current WF export (verified 2026-07-20) is header-first:
     "DATE","DESCRIPTION","AMOUNT","CHECK #","STATUS"
   Older exports are headerless and positional. Columns are mapped by
   header name when a header exists, and detected by content otherwise,
   so column order changes on WF's side can't silently corrupt the import.

   Output matches the Teller transaction shape the views and budget-core
   already consume ({date, description, amount}), plus source:"csv" and a
   pending flag (pending charges can re-post later at a different amount).
   ======================================================================= */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.WfCsv = factory();
})(typeof self !== "undefined" ? self : this, function () {
  // Minimal RFC-4180 line splitter (quoted fields, embedded commas/quotes)
  function splitCsvLine(line) {
    const fields = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQuotes = false;
        else cur += ch;
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === ",") { fields.push(cur); cur = ""; }
        else cur += ch;
      }
    }
    fields.push(cur);
    return fields;
  }

  function toIso(mdY) {
    const m = String(mdY).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    return m[3] + "-" + m[1].padStart(2, "0") + "-" + m[2].padStart(2, "0");
  }

  // WF writes plain "-54.17", but tolerate "-$1,234.56" and "(54.17)"
  function toAmount(raw) {
    let s = String(raw).trim().replace(/[$,\s]/g, "");
    if (/^\(.*\)$/.test(s)) s = "-" + s.slice(1, -1);
    return /^-?\d+(\.\d+)?$/.test(s) ? s : null;
  }

  function isHeaderRow(fields) {
    return fields.some((f) => /^\s*date\s*$/i.test(f)) &&
           fields.some((f) => /^\s*amount\s*$/i.test(f));
  }

  // Map by header name; fall back to detecting columns from the first data row
  function resolveColumns(fields, headerFields) {
    if (headerFields) {
      const idx = (re) => headerFields.findIndex((h) => re.test(h.trim()));
      return {
        date: idx(/^date$/i),
        description: idx(/^description$/i),
        amount: idx(/^amount$/i),
        status: idx(/^status$/i),
      };
    }
    // Headerless: date is the M/D/YYYY column, amount the numeric one,
    // description the longest remaining text field.
    const date = fields.findIndex((f) => toIso(f) !== null);
    const amount = fields.findIndex((f, i) => i !== date && toAmount(f) !== null);
    let description = -1;
    let longest = -1;
    fields.forEach((f, i) => {
      if (i === date || i === amount) return;
      if (f.trim().length > longest) { longest = f.trim().length; description = i; }
    });
    return { date, description, amount, status: -1 };
  }

  function parse(text) {
    const lines = String(text || "").split(/\r?\n/).filter((l) => l.trim() !== "");
    if (lines.length === 0) throw new Error(BAD);

    let headerFields = null;
    let start = 0;
    const first = splitCsvLine(lines[0]);
    if (isHeaderRow(first)) { headerFields = first; start = 1; }

    let cols = null;
    const txns = [];
    for (let i = start; i < lines.length; i++) {
      const f = splitCsvLine(lines[i]);
      if (f.length < 3) continue;
      if (!cols) cols = resolveColumns(f, headerFields);
      if (cols.date < 0 || cols.amount < 0 || cols.description < 0) continue;

      const date = toIso(f[cols.date]);
      const amount = toAmount(f[cols.amount]);
      if (!date || amount === null) continue; // stray/summary row

      const status = cols.status >= 0 ? String(f[cols.status] || "") : "";
      txns.push({
        date,
        description: String(f[cols.description] || "").trim(),
        amount,
        source: "csv",
        pending: /pending/i.test(status),
      });
    }
    if (txns.length === 0) throw new Error(BAD);
    return txns;
  }

  const BAD = "That doesn't look like a Wells Fargo activity CSV (no parsable rows found). " +
    "In Wells Fargo online banking use Download Account Activity and choose the Comma Delimited / CSV format.";

  return { parse, splitCsvLine, toIso, toAmount };
});
