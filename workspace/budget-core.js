/* =======================================================================
   Budget core — pure transaction logic shared by SpendingView, TodayView,
   and the Node test suite (tests/budget-core.test.js).

   Categorization precedence, applied in order:
     credit  — any deposit (amount > 0)
     transfer — internal money movement (Save As You Go, overdraft, etc.)
     bill    — matches a bill's txnMatch (fixed obligations, not spending)
     debt    — matches debt.txnKeywords (card payments, not spending)
     spend   — matches a spending category's txnKeywords, else Teller's
               own category as fallback (fuel/groceries/health)
     other   — a real debit nothing claimed; views surface these so no
               spending is ever invisible

   Keywords match at word boundaries on a normalized description, so
   "shell" matches SHELL OIL but not NEWREZ-SHELLPOIN. Bills also get a
   collapsed-substring pass ("kitty poo" → KITTYPOOCLUB.COM) because a
   false bill match merely excludes a txn from spending, which is the
   safe direction.

   Dates are compared as ISO strings throughout — new Date("YYYY-MM-DD")
   parses as UTC and shifts every transaction back a day in US timezones.
   ======================================================================= */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.BudgetCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const TRANSFER_PATTERNS = ["transfer", "xfer", "overdraft protection", "save as you go"];

  // Teller's own category → our category id, used only when no keyword hits
  const TELLER_CATEGORY_MAP = { fuel: "gas", groceries: "grocery", health: "pharmacy" };

  function isoDay(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function addDaysISO(iso, days) {
    const [y, m, d] = iso.split("-").map(Number);
    return isoDay(new Date(y, m - 1, d + days));
  }

  // Monday of the week containing the given local date (ISO string or Date)
  function weekStartISO(dateStrOrDate) {
    let dt;
    if (typeof dateStrOrDate === "string") {
      const [y, m, d] = dateStrOrDate.split("-").map(Number);
      dt = new Date(y, m - 1, d);
    } else {
      dt = new Date(dateStrOrDate.getFullYear(), dateStrOrDate.getMonth(), dateStrOrDate.getDate());
    }
    const dow = dt.getDay(); // 0=Sun
    dt.setDate(dt.getDate() - (dow === 0 ? 6 : dow - 1));
    return isoDay(dt);
  }

  // Lowercase, punctuation → spaces (& kept — "at&t"), collapse whitespace
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9&]+/g, " ")
      .trim();
  }

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Word-boundary match, tolerant of how WF actually writes merchants:
  //   - trailing s/'s   BENNYS      matches "benny"
  //   - dropped &       ATT         matches "at&t"
  // Both stay anchored at word boundaries, so "rma" still cannot match
  // inside phaRMAcy and "shell" cannot match NEWREZ-SHELLPOIN.
  function matchesKeyword(description, keyword) {
    const desc = normalize(description);
    const kw = normalize(keyword);
    if (!desc || !kw) return false;
    // Trailing-s tolerance only for keywords long enough that the plural
    // can't be a different word: "benny"/"bennys" yes, "bp"/"bps" no.
    const s = kw.length >= 4 ? "s?" : "";
    if (new RegExp("\\b" + escapeRegex(kw) + s + "\\b").test(desc)) return true;
    // Punctuation-free spelling of an &-containing keyword ("at&t" -> "att")
    if (kw.includes("&")) {
      const stripped = kw.replace(/&/g, "");
      if (stripped && new RegExp("\\b" + escapeRegex(stripped) + "s?\\b").test(desc)) return true;
    }
    return false;
  }

  // Multi-word keywords also match WF's collapsed spelling: "circle k" ->
  // "Circlek", "kitty poo" -> KITTYPOOCLUB.COM. The collapsed form must
  // still start on a word boundary, so "circle k" cannot match "circle
  // keeper". Single short words are never collapsed-matched: too dangerous.
  function matchesKeywordLoose(description, keyword) {
    if (matchesKeyword(description, keyword)) return true;
    const kw = normalize(keyword);
    if (!kw.includes(" ")) return false;
    const collapsedKw = kw.replace(/ /g, "");
    const words = normalize(description).split(" ").filter(Boolean);
    const collapsedDesc = words.join("");

    // The match must start where a word starts, and then either stay inside
    // that one word (so "kitty poo" catches KITTYPOOCLUB.COM) or end exactly
    // where a word ends (so "prog paloverde" catches PROG PALOVERDE INS but
    // "circle k" does not catch "circle keeper").
    const bounds = [];
    let pos = 0;
    for (const word of words) {
      bounds.push({ start: pos, end: pos + word.length });
      pos += word.length;
    }
    const wordEnds = new Set(bounds.map((b) => b.end));
    return bounds.some((b) => {
      if (!collapsedDesc.startsWith(collapsedKw, b.start)) return false;
      const end = b.start + collapsedKw.length;
      return end <= b.end || wordEnds.has(end);
    });
  }

  function matchesBill(description, txnMatch) {
    if (!txnMatch) return false;
    return matchesKeywordLoose(description, txnMatch);
  }

  function isTransfer(description) {
    const desc = normalize(description);
    return TRANSFER_PATTERNS.some((p) => desc.includes(p));
  }

  // config: { categories, bills, debtKeywords }
  function categorize(tx, config) {
    const amount = Number(tx.amount);
    if (!(amount < 0)) return { kind: "credit" };

    const desc = tx.description || "";
    if (isTransfer(desc)) return { kind: "transfer" };

    for (const bill of config.bills || []) {
      if (bill.txnMatch && matchesBill(desc, bill.txnMatch)) return { kind: "bill", billId: bill.id };
    }

    for (const kw of config.debtKeywords || []) {
      if (matchesKeyword(desc, kw)) return { kind: "debt" };
    }

    const counterparty = (tx.details && tx.details.counterparty && tx.details.counterparty.name) || "";
    for (const cat of config.categories || []) {
      if (cat.manualOnly) continue;
      for (const kw of cat.txnKeywords || []) {
        if (matchesKeywordLoose(desc, kw) || (counterparty && matchesKeywordLoose(counterparty, kw))) {
          return { kind: "spend", categoryId: cat.id };
        }
      }
    }

    const tellerCat = tx.details && tx.details.category;
    const mapped = tellerCat && TELLER_CATEGORY_MAP[tellerCat];
    if (mapped && (config.categories || []).some((c) => c.id === mapped)) {
      return { kind: "spend", categoryId: mapped };
    }

    return { kind: "other" };
  }

  // All transactions across accounts inside [weekStartISO, weekStartISO + 7d)
  function weekTransactions(accounts, weekStart) {
    const weekEnd = addDaysISO(weekStart, 7);
    const out = [];
    for (const acct of accounts || []) {
      for (const tx of acct.transactions || []) {
        if (tx.date >= weekStart && tx.date < weekEnd) out.push(tx);
      }
    }
    return out;
  }

  function newestTransactionDate(accounts) {
    let newest = null;
    for (const acct of accounts || []) {
      for (const tx of acct.transactions || []) {
        if (!newest || tx.date > newest) newest = tx.date;
      }
    }
    return newest;
  }

  function bucket() {
    return { total: 0, txns: [] };
  }

  // One pass over a week: every debit lands in exactly one place.
  function summarizeWeek(accounts, weekStart, config) {
    const byCategory = {};
    for (const cat of config.categories || []) {
      if (!cat.manualOnly) byCategory[cat.id] = bucket();
    }
    const summary = { byCategory, uncategorized: bucket(), bills: bucket(), debt: bucket(), transfers: bucket(), credits: bucket() };

    for (const tx of weekTransactions(accounts, weekStart)) {
      const amount = Math.abs(Number(tx.amount));
      const r = categorize(tx, config);
      const target =
        r.kind === "spend" ? byCategory[r.categoryId] :
        r.kind === "bill" ? summary.bills :
        r.kind === "debt" ? summary.debt :
        r.kind === "transfer" ? summary.transfers :
        r.kind === "credit" ? summary.credits :
        summary.uncategorized;
      target.total += amount;
      target.txns.push(tx);
    }
    return summary;
  }

  // Fold a freshly imported CSV batch into the stored manual set.
  // Posted rows accumulate and dedupe. Pending rows are NOT kept across
  // imports: a pending charge re-posts later at a different amount (tips)
  // or vanishes entirely, so the newest export is always the authority on
  // what is currently pending.
  function mergeImportBatch(existing, incoming) {
    const kept = (existing || []).filter((t) => !t.pending);
    const seen = new Set(kept.map((t) => importKey(t)));
    const out = kept.slice();
    for (const t of incoming || []) {
      const key = importKey(t);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(t);
    }
    return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }

  function importKey(t) {
    return t.date + "|" + Number(t.amount).toFixed(2) + "|" + normalize(t.description);
  }

  // Fold manually imported transactions (CSV upload) into the account list
  // as one synthetic account, deduping on date+amount against everything the
  // feed already has — so a CSV covering an overlap period never double-counts,
  // and re-uploading the same file is harmless.
  function mergeManualTransactions(accounts, manualTxns) {
    if (!manualTxns || manualTxns.length === 0) return accounts || [];
    // Against the feed: date+amount only (descriptions differ across sources).
    // Within the manual set: date+amount+description, so re-uploads collapse
    // but two same-day same-amount purchases both survive.
    const feedKeys = new Set();
    for (const acct of accounts || []) {
      for (const tx of acct.transactions || []) {
        feedKeys.add(tx.date + "|" + Number(tx.amount).toFixed(2));
      }
    }
    const manualKeys = new Set();
    const kept = [];
    for (const tx of manualTxns) {
      const feedKey = tx.date + "|" + Number(tx.amount).toFixed(2);
      const fullKey = feedKey + "|" + normalize(tx.description);
      if (feedKeys.has(feedKey) || manualKeys.has(fullKey)) continue;
      manualKeys.add(fullKey);
      kept.push(tx);
    }
    if (kept.length === 0) return accounts || [];
    return (accounts || []).concat([{
      name: "Manual import (Wells Fargo CSV)",
      type: "depository",
      manual: true,
      transactions: kept,
    }]);
  }

  return {
    isoDay,
    addDaysISO,
    weekStartISO,
    mergeManualTransactions,
    mergeImportBatch,
    normalize,
    matchesKeyword,
    matchesBill,
    isTransfer,
    categorize,
    weekTransactions,
    newestTransactionDate,
    summarizeWeek,
  };
});
