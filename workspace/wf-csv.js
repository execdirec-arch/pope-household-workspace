/* =======================================================================
   Wells Fargo CSV import — parses "Download Account Activity" exports.
   Vendor-free path for bank data when the Teller feed is down.

   WF's export has no header row and five quoted columns:
     "M/D/YYYY","amount","*","check#","description"
   Debits are negative. Output matches the Teller transaction shape the
   views and budget-core already consume ({date, description, amount}),
   plus source:"csv" so merged data stays distinguishable.
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

  function parse(text) {
    const lines = String(text || "").split(/\r?\n/).filter((l) => l.trim() !== "");
    const txns = [];
    for (const line of lines) {
      const f = splitCsvLine(line);
      if (f.length < 5) continue;
      const date = toIso(f[0]);
      const amount = String(f[1]).trim();
      if (!date || !/^-?\d+(\.\d+)?$/.test(amount)) continue; // header or junk row
      txns.push({ date, description: f[4].trim(), amount, source: "csv" });
    }
    if (txns.length === 0) {
      throw new Error("That doesn't look like a Wells Fargo activity CSV (no parsable rows found).");
    }
    return txns;
  }

  return { parse, splitCsvLine, toIso };
});
