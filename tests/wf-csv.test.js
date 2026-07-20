/* Wells Fargo CSV import tests.

   The real "Download Account Activity" export (verified against Lauren's
   2026-07-20 Checking.csv) is header-first:
     "DATE","DESCRIPTION","AMOUNT","CHECK #","STATUS"
   with M/D/YYYY dates, negative debits, and a Pending/Posted status.
   Older WF exports are headerless and positional, so the parser maps
   columns by header name when one is present and falls back to detection.

   Pending rows are kept but flagged: a pending charge can re-post later
   with a different amount (restaurant tips), so the store replaces pending
   rows on each import rather than accumulating them. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const WfCsv = require("../workspace/wf-csv.js");
const core = require("../workspace/budget-core.js");

const HEADER = '"DATE","DESCRIPTION","AMOUNT","CHECK #","STATUS"';
const REAL = [
  HEADER,
  '"07/20/2026","PURCHASE TARGET T-136 Baton Rouge   LA CARD3702","-264.08","","Pending"',
  '"07/17/2026","PAYPAL           PURCHASE   260717 GOOGLE GOOGLE O REBECCA POPE","-10.65","","Posted"',
  '"07/15/2026","PURCHASE MARATHON 776 BATON ROUGE   LA CARD3702","-54.17","","Posted"',
  '"07/13/2026","MASTERYPREP PAYROLL QJYR81J6RNNEAWM OLIVER POPE","5782.90","","Posted"',
].join("\r\n");

test("parses the real header-first WF export", () => {
  const txns = WfCsv.parse(REAL);
  assert.equal(txns.length, 4);
  assert.deepEqual(txns[1], {
    date: "2026-07-17",
    description: "PAYPAL           PURCHASE   260717 GOOGLE GOOGLE O REBECCA POPE",
    amount: "-10.65",
    source: "csv",
    pending: false,
  });
});

test("flags pending rows", () => {
  const txns = WfCsv.parse(REAL);
  assert.equal(txns[0].pending, true);
  assert.equal(txns[0].amount, "-264.08");
});

test("maps columns by header name, not position", () => {
  // Same data, DESCRIPTION and AMOUNT swapped in the header and rows
  const swapped = [
    '"DATE","AMOUNT","DESCRIPTION","CHECK #","STATUS"',
    '"07/15/2026","-54.17","PURCHASE MARATHON 776","","Posted"',
  ].join("\n");
  const txns = WfCsv.parse(swapped);
  assert.equal(txns[0].amount, "-54.17");
  assert.equal(txns[0].description, "PURCHASE MARATHON 776");
});

test("still handles legacy headerless positional exports", () => {
  const legacy = '"07/15/2026","-54.17","*","","PURCHASE MARATHON 776 BATON ROUGE LA"';
  const txns = WfCsv.parse(legacy);
  assert.equal(txns[0].date, "2026-07-15");
  assert.equal(txns[0].amount, "-54.17");
  assert.equal(txns[0].description, "PURCHASE MARATHON 776 BATON ROUGE LA");
});

test("converts M/D/YYYY to ISO with zero padding", () => {
  assert.equal(WfCsv.parse(HEADER + '\n"7/4/2026","TEST","-10.00","","Posted"')[0].date, "2026-07-04");
});

test("handles quoted commas inside descriptions", () => {
  const txns = WfCsv.parse(HEADER + '\n"07/13/2026","PURCHASE COSTCO BY IN, +18882467822 CA","-85.95","","Posted"');
  assert.equal(txns[0].description, "PURCHASE COSTCO BY IN, +18882467822 CA");
});

test("strips currency symbols and thousands separators from amounts", () => {
  const txns = WfCsv.parse(HEADER + '\n"07/13/2026","BIG ONE","-$1,234.56","","Posted"');
  assert.equal(txns[0].amount, "-1234.56");
});

test("rejects non-WF content", () => {
  assert.throws(() => WfCsv.parse("just some text\nnot a csv"), /doesn't look like/i);
  assert.throws(() => WfCsv.parse(""), /doesn't look like/i);
  assert.throws(() => WfCsv.parse(HEADER), /doesn't look like/i); // header only, no rows
});

test("parses Lauren's actual 2026-07-20 export end to end", () => {
  const fixture = path.join(__dirname, "fixtures", "wf-checking-2026-07-20.csv");
  if (!fs.existsSync(fixture)) return; // fixture is gitignored (real financial data)
  const txns = WfCsv.parse(fs.readFileSync(fixture, "utf8"));
  assert.equal(txns.length, 607);
  assert.equal(txns.filter((t) => t.pending).length, 18);
  assert.ok(txns.every((t) => /^\d{4}-\d{2}-\d{2}$/.test(t.date)));
  assert.ok(txns.every((t) => /^-?\d+(\.\d+)?$/.test(t.amount)));
  assert.ok(txns.filter((t) => t.date > "2026-07-07").length >= 100);
});

test("parsed transactions categorize through budget-core unchanged", () => {
  const txns = WfCsv.parse(REAL);
  const cfg = {
    categories: [{ id: "gas", txnKeywords: ["marathon"], budgetPerWeek: 75 }],
    bills: [],
    debtKeywords: [],
  };
  assert.equal(core.categorize(txns[2], cfg).categoryId, "gas");
  assert.equal(core.categorize(txns[3], cfg).kind, "credit");
});

/* ---------- merging manual imports with the Teller feed ---------- */

const checkingAcct = (txns) => ({
  id: "acc_1", name: "EVERYDAY CHECKING", type: "depository", subtype: "checking", transactions: txns,
});

test("imported rows join the checking account's own list, not a separate block", () => {
  // The feed stops at 07-07; the CSV runs to 07-15. The checking section
  // must lead with 07-15, otherwise the view still looks stale.
  const accounts = [
    checkingAcct([{ date: "2026-07-07", description: "COSTCO", amount: "-85.95" }]),
    { id: "acc_2", name: "WAY2SAVE SAVINGS", type: "depository", subtype: "savings", transactions: [] },
  ];
  const manual = [{ date: "2026-07-15", description: "MARATHON", amount: "-54.17", source: "csv" }];

  const merged = core.mergeManualTransactions(accounts, manual);
  assert.equal(merged.length, 2, "no synthetic account should be added");
  const checking = merged.find((a) => a.subtype === "checking");
  assert.equal(checking.transactions.length, 2);
  assert.equal(checking.transactions[0].date, "2026-07-15", "newest transaction must be first");
  assert.equal(merged.find((a) => a.subtype === "savings").transactions.length, 0, "savings must be untouched");
});

test("merged checking list stays sorted newest first across both sources", () => {
  const accounts = [checkingAcct([
    { date: "2026-07-07", description: "FEED B", amount: "-2.00" },
    { date: "2026-07-01", description: "FEED A", amount: "-1.00" },
  ])];
  const manual = [
    { date: "2026-07-20", description: "CSV NEW", amount: "-4.00", source: "csv" },
    { date: "2026-07-04", description: "CSV MID", amount: "-3.00", source: "csv" },
  ];
  const dates = core.mergeManualTransactions(accounts, manual)[0].transactions.map((t) => t.date);
  assert.deepEqual(dates, ["2026-07-20", "2026-07-07", "2026-07-04", "2026-07-01"]);
});

test("mergeManualTransactions dedupes on date+amount against feed data", () => {
  const accounts = [checkingAcct([
    { date: "2026-07-07", description: "PURCHASE COSTCO BY IN +18882467822 CA CARD6632", amount: "-85.95" },
  ])];
  const manual = [
    { date: "2026-07-07", description: "PURCHASE COSTCO BY IN, +18882467822 CA CARD6632", amount: "-85.95", source: "csv" },
    { date: "2026-07-15", description: "PURCHASE MARATHON 77669", amount: "-54.17", source: "csv" },
  ];
  const checking = core.mergeManualTransactions(accounts, manual)[0];
  assert.equal(checking.transactions.length, 2, "the duplicate Costco row must not appear twice");
  assert.equal(checking.transactions.filter((t) => t.date === "2026-07-07").length, 1);
});

test("mergeManualTransactions dedupes within the manual set itself (re-uploads)", () => {
  const manual = [
    { date: "2026-07-15", description: "PURCHASE MARATHON 77669", amount: "-54.17", source: "csv" },
    { date: "2026-07-15", description: "PURCHASE MARATHON 77669", amount: "-54.17", source: "csv" },
  ];
  const merged = core.mergeManualTransactions([checkingAcct([])], manual);
  assert.equal(merged[0].transactions.length, 1);
});

test("mergeManualTransactions keeps distinct same-day same-amount manual purchases", () => {
  const manual = [
    { date: "2026-07-15", description: "PURCHASE STARBUCKS BATON ROUGE", amount: "-9.99", source: "csv" },
    { date: "2026-07-15", description: "PURCHASE HULU BILL", amount: "-9.99", source: "csv" },
  ];
  const merged = core.mergeManualTransactions([checkingAcct([])], manual);
  assert.equal(merged[0].transactions.length, 2);
});

test("falls back to a synthetic account when there is no checking account", () => {
  // Teller creds missing entirely: still surface the imported data somewhere
  const manual = [{ date: "2026-07-15", description: "MARATHON", amount: "-54.17", source: "csv" }];
  const merged = core.mergeManualTransactions([], manual);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].manual, true);
  assert.equal(merged[0].transactions.length, 1);
});

test("mergeManualTransactions with no manual txns returns accounts untouched", () => {
  const accounts = [{ name: "X", transactions: [] }];
  assert.equal(core.mergeManualTransactions(accounts, []), accounts);
});

/* ---------- what a re-import does to the stored set ---------- */

test("mergeImportBatch keeps posted rows and adds new ones", () => {
  const existing = [{ date: "2026-07-15", description: "MARATHON", amount: "-54.17", pending: false }];
  const incoming = [
    { date: "2026-07-15", description: "MARATHON", amount: "-54.17", pending: false }, // already have
    { date: "2026-07-18", description: "TARGET", amount: "-18.77", pending: false },   // new
  ];
  const out = core.mergeImportBatch(existing, incoming);
  assert.equal(out.length, 2);
  assert.equal(out.filter((t) => t.description === "TARGET").length, 1);
});

test("mergeImportBatch replaces stale pending rows instead of accumulating", () => {
  // Tuesday's import: dinner pending at $52.33
  const existing = [
    { date: "2026-07-20", description: "TST* NOTHING BATON ROUGE", amount: "-52.33", pending: true },
    { date: "2026-07-15", description: "MARATHON", amount: "-54.17", pending: false },
  ];
  // Wednesday's import: same dinner posted with tip, now $61.75
  const incoming = [
    { date: "2026-07-20", description: "TST* NOTHING BATON ROUGE", amount: "-61.75", pending: false },
    { date: "2026-07-15", description: "MARATHON", amount: "-54.17", pending: false },
  ];
  const out = core.mergeImportBatch(existing, incoming);
  const dinners = out.filter((t) => t.description.includes("NOTHING"));
  assert.equal(dinners.length, 1, "the $52.33 pending row must not survive alongside the $61.75 posted one");
  assert.equal(dinners[0].amount, "-61.75");
  assert.equal(dinners[0].pending, false);
  assert.equal(out.length, 2);
});

test("mergeImportBatch drops pending rows that vanished from the new export", () => {
  const existing = [{ date: "2026-07-20", description: "CANCELLED HOLD", amount: "-99.00", pending: true }];
  const out = core.mergeImportBatch(existing, [{ date: "2026-07-19", description: "REAL", amount: "-5.00", pending: false }]);
  assert.equal(out.length, 1);
  assert.equal(out[0].description, "REAL");
});

test("mergeImportBatch returns newest first", () => {
  const out = core.mergeImportBatch([], [
    { date: "2026-05-01", description: "OLD", amount: "-1.00", pending: false },
    { date: "2026-07-20", description: "NEW", amount: "-2.00", pending: false },
  ]);
  assert.equal(out[0].description, "NEW");
});
