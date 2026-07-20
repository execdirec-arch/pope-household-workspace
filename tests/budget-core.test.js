/* Budget core tests — run with `npm test` (node --test tests/).
   Fixture is a real /api/bank snapshot from 2026-07-19 (feed ends 2026-07-07).
   Config (categories, bills, debt) is the REAL data.js, loaded via vm, so these
   tests catch keyword drift in the config as well as logic bugs. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const core = require("../workspace/budget-core.js");
const fixture = require("./fixtures/bank-2026-07-19.json");

function loadWorkspaceData() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../workspace/data.js"), "utf8"), ctx);
  return ctx.window.WORKSPACE_DATA;
}
const DATA = loadWorkspaceData();
const CONFIG = { categories: DATA.spending.categories, bills: DATA.bills, debtKeywords: (DATA.debt && DATA.debt.txnKeywords) || [] };

/* ---------- keyword matching ---------- */

test("keyword 'shell' matches a real Shell station", () => {
  assert.equal(core.matchesKeyword("PURCHASE SHELL OIL 57544 ZACHARY LA CARD6632", "shell"), true);
});

test("keyword 'shell' does NOT match the Shellpoint mortgage", () => {
  assert.equal(core.matchesKeyword("NEWREZ-SHELLPOIN WEB PMTS 260629 0676536683 POPE OLIVER", "shell"), false);
});

test("keyword 'bp' matches at word boundary only", () => {
  assert.equal(core.matchesKeyword("PURCHASE BP PRODUCTS BATON ROUGE", "bp"), true);
  assert.equal(core.matchesKeyword("PURCHASE BPS SUPPLY", "bp"), false);
});

test("keyword 'buc-ee' matches Wells Fargo's spaced rendering", () => {
  assert.equal(core.matchesKeyword("PURCHASE AUTHORIZED ON 06/26 BUC-EE 'S #0018 WALLER TX", "buc-ee"), true);
});

test("keyword 'rouse' matches 'ROUSE S #60' (WF inserts a space)", () => {
  assert.equal(core.matchesKeyword("PURCHASE AUTHORIZED ON 07/04 ROUSE S #60 ZACHARY LA", "rouse"), true);
});

/* ---------- categorize precedence ---------- */

test("mortgage payment categorizes as bill, never gas", () => {
  const tx = { date: "2026-07-01", description: "NEWREZ-SHELLPOIN WEB PMTS 260629 0676536683 POPE OLIVER", amount: "-2968.98" };
  const r = core.categorize(tx, CONFIG);
  assert.equal(r.kind, "bill");
});

test("credit card ACH payment categorizes as debt, not spending", () => {
  const tx = { date: "2026-07-06", description: "AMERICAN EXPRESS ACH PMT 260706 M2624 OLIVER POPE", amount: "-200.00" };
  assert.equal(core.categorize(tx, CONFIG).kind, "debt");
});

test("internal transfers are excluded", () => {
  const a = { date: "2026-07-06", description: "SAVE AS YOU GO TRANSFER DEBIT TO XXXXXXXXXXX1328", amount: "-7.00" };
  const b = { date: "2026-05-01", description: "OVERDRAFT PROTECTION XFER TO CHECKING", amount: "-44.01" };
  assert.equal(core.categorize(a, CONFIG).kind, "transfer");
  assert.equal(core.categorize(b, CONFIG).kind, "transfer");
});

test("deposits are credits, never spending", () => {
  const tx = { date: "2026-06-26", description: "MASTERYPREP PAYROLL QJYR81J6RNNEAWM OLIVER POPE", amount: "5782.90" };
  assert.equal(core.categorize(tx, CONFIG).kind, "credit");
});

test("Marathon fill-up categorizes as gas", () => {
  const tx = { date: "2026-07-06", description: "PURCHASE AUTHORIZED ON 07/05 MARATHON 77669 BATON ROUGE LA P000000445474027 CARD 3702", amount: "-54.17" };
  const r = core.categorize(tx, CONFIG);
  assert.equal(r.kind, "spend");
  assert.equal(r.categoryId, "gas");
});

test("Rouses grocery run categorizes as groceries", () => {
  const tx = { date: "2026-07-06", description: "PURCHASE AUTHORIZED ON 07/04 ROUSE S #60 ZACHARY LA S356185760474445 CARD 3702", amount: "-60.32" };
  const r = core.categorize(tx, CONFIG);
  assert.equal(r.kind, "spend");
  assert.equal(r.categoryId, "grocery");
});

test("KittyPooClub charge matches its bill despite collapsed domain name", () => {
  const tx = { date: "2026-06-29", description: "RECURRING PAYMENT AUTHORIZED ON 06/27 KITTYPOOCLUB.COM KITTYPOOCLUB. OH S386179217587029 CARD 6632", amount: "-61.74" };
  assert.equal(core.categorize(tx, CONFIG).kind, "bill");
});

test("Teller category is used as fallback when no keyword matches", () => {
  const tx = { date: "2026-07-06", description: "PURCHASE SOME BRAND NEW STATION LA", amount: "-30.00", details: { category: "fuel" } };
  const r = core.categorize(tx, CONFIG);
  assert.equal(r.kind, "spend");
  assert.equal(r.categoryId, "gas");
});

/* ---------- week windows (timezone regression) ---------- */

test("weekStartISO returns the Monday of the week, by string math", () => {
  assert.equal(core.weekStartISO("2026-07-06"), "2026-07-06"); // Monday
  assert.equal(core.weekStartISO("2026-07-07"), "2026-07-06");
  assert.equal(core.weekStartISO("2026-07-12"), "2026-07-06"); // Sunday
  assert.equal(core.weekStartISO("2026-07-13"), "2026-07-13"); // next Monday
});

test("a transaction dated on week-start Monday is included (UTC-shift regression)", () => {
  const accounts = [{ transactions: [{ date: "2026-07-06", description: "PAYPAL PURCHASE 260705 UBER EATS REBECCA POPE", amount: "-46.19" }] }];
  const txns = core.weekTransactions(accounts, "2026-07-06");
  assert.equal(txns.length, 1);
});

test("newestTransactionDate finds the feed edge", () => {
  assert.equal(core.newestTransactionDate(fixture.accounts), "2026-07-07");
});

/* ---------- full-week summary against the real fixture ---------- */

test("week of 2026-07-06: category totals from real bank data", () => {
  const s = core.summarizeWeek(fixture.accounts, "2026-07-06", CONFIG);
  // Groceries: 4 Uber Eats (Costco delivery) + Rouses + Trader Joe's + Costco
  assert.equal(s.byCategory.grocery.total.toFixed(2), "288.79");
  // Gas: Marathon only — and definitely not the mortgage
  assert.equal(s.byCategory.gas.total.toFixed(2), "54.17");
  for (const tx of s.byCategory.gas.txns) {
    assert.ok(!/newrez|shellpoin/i.test(tx.description), "mortgage leaked into gas: " + tx.description);
  }
  // Health: two CVS runs
  assert.equal(s.byCategory.pharmacy.total.toFixed(2), "70.65");
  // Household: nothing that week
  assert.equal(s.byCategory.household.total.toFixed(2), "0.00");
});

test("week of 2026-07-06: unmatched spending is visible, not dropped", () => {
  const s = core.summarizeWeek(fixture.accounts, "2026-07-06", CONFIG);
  // Raising Canes, Whataburger, Starbucks, Lyft, Metro, museum etc. — 11 debits
  assert.equal(s.uncategorized.txns.length, 11);
  assert.equal(s.uncategorized.total.toFixed(2), "232.73");
});

test("week of 2026-07-06: bills and debt payments excluded from every category", () => {
  const s = core.summarizeWeek(fixture.accounts, "2026-07-06", CONFIG);
  const allSpend = Object.values(s.byCategory).flatMap((c) => c.txns).concat(s.uncategorized.txns);
  for (const tx of allSpend) {
    assert.ok(!/at&t mobilit|american express ach/i.test(tx.description), "bill/debt leaked into spending: " + tx.description);
  }
});

/* ---------- config sanity (data.js itself) ---------- */

test("data.js gas keywords cover the stations this family actually uses", () => {
  const gas = DATA.spending.categories.find((c) => c.id === "gas").txnKeywords;
  for (const kw of ["marathon", "buc-ee", "qt", "shell", "murphy"]) {
    assert.ok(gas.includes(kw), "missing gas keyword: " + kw);
  }
});

test("data.js declares debt payment keywords", () => {
  assert.ok(CONFIG.debtKeywords.length >= 5, "debt.txnKeywords missing or too short");
});
