/* Wells Fargo CSV import tests. WF's "Download Account Activity" CSV has no
   header row and five quoted columns: Date, Amount, Star, Blank, Description.
   Dates are M/D/YYYY; debits negative. The parser must also tolerate a header
   row and CRLF, and reject files that aren't WF activity exports. */
const { test } = require("node:test");
const assert = require("node:assert/strict");

const WfCsv = require("../workspace/wf-csv.js");
const core = require("../workspace/budget-core.js");

const SAMPLE = [
  '"07/15/2026","-54.17","*","","PURCHASE AUTHORIZED ON 07/14 MARATHON 77669 BATON ROUGE LA CARD 3702"',
  '"07/14/2026","-2968.98","*","","NEWREZ-SHELLPOIN WEB PMTS 260713 0676536683 POPE OLIVER"',
  '"07/13/2026","5782.90","*","","MASTERYPREP PAYROLL QJYR81J6RNNEAWM OLIVER POPE"',
  '"07/13/2026","-85.95","*","","PURCHASE COSTCO BY IN, +18882467822 CA CARD6632"',
].join("\r\n");

test("parses WF five-column no-header format", () => {
  const txns = WfCsv.parse(SAMPLE);
  assert.equal(txns.length, 4);
  assert.deepEqual(txns[0], {
    date: "2026-07-15",
    description: "PURCHASE AUTHORIZED ON 07/14 MARATHON 77669 BATON ROUGE LA CARD 3702",
    amount: "-54.17",
    source: "csv",
  });
});

test("converts M/D/YYYY to ISO with zero padding", () => {
  const txns = WfCsv.parse('"7/4/2026","-10.00","*","","TEST"');
  assert.equal(txns[0].date, "2026-07-04");
});

test("handles quoted commas inside descriptions", () => {
  const txns = WfCsv.parse(SAMPLE);
  assert.equal(txns[3].description, "PURCHASE COSTCO BY IN, +18882467822 CA CARD6632");
});

test("tolerates a header row", () => {
  const withHeader = '"Date","Amount","Star","Check","Description"\r\n' + SAMPLE;
  assert.equal(WfCsv.parse(withHeader).length, 4);
});

test("rejects non-WF content", () => {
  assert.throws(() => WfCsv.parse("just some text\nnot a csv"), /doesn't look like/i);
  assert.throws(() => WfCsv.parse(""), /doesn't look like/i);
});

test("parsed transactions categorize through budget-core unchanged", () => {
  const txns = WfCsv.parse(SAMPLE);
  const cfg = {
    categories: [{ id: "gas", txnKeywords: ["marathon"], budgetPerWeek: 75 }],
    bills: [{ id: "b1", txnMatch: "newrez" }],
    debtKeywords: [],
  };
  assert.equal(core.categorize(txns[0], cfg).categoryId, "gas");
  assert.equal(core.categorize(txns[1], cfg).kind, "bill");
  assert.equal(core.categorize(txns[2], cfg).kind, "credit");
});

/* ---------- merging manual imports with the Teller feed ---------- */

test("mergeManualTransactions dedupes on date+amount against feed data", () => {
  const accounts = [{
    name: "EVERYDAY CHECKING",
    type: "depository",
    transactions: [
      { date: "2026-07-07", description: "PURCHASE COSTCO BY IN +18882467822 CA CARD6632", amount: "-85.95" },
    ],
  }];
  const manual = [
    { date: "2026-07-07", description: "PURCHASE COSTCO BY IN, +18882467822 CA CARD6632", amount: "-85.95", source: "csv" }, // dup of feed txn
    { date: "2026-07-15", description: "PURCHASE MARATHON 77669", amount: "-54.17", source: "csv" }, // new
  ];
  const merged = core.mergeManualTransactions(accounts, manual);
  assert.equal(merged.length, 2);
  const manualAcct = merged.find((a) => a.manual);
  assert.equal(manualAcct.transactions.length, 1);
  assert.equal(manualAcct.transactions[0].date, "2026-07-15");
});

test("mergeManualTransactions dedupes within the manual set itself (re-uploads)", () => {
  const manual = [
    { date: "2026-07-15", description: "PURCHASE MARATHON 77669", amount: "-54.17", source: "csv" },
    { date: "2026-07-15", description: "PURCHASE MARATHON 77669", amount: "-54.17", source: "csv" },
  ];
  const merged = core.mergeManualTransactions([], manual);
  assert.equal(merged.find((a) => a.manual).transactions.length, 1);
});

test("mergeManualTransactions keeps distinct same-day same-amount manual purchases", () => {
  const manual = [
    { date: "2026-07-15", description: "PURCHASE STARBUCKS BATON ROUGE", amount: "-9.99", source: "csv" },
    { date: "2026-07-15", description: "PURCHASE HULU BILL", amount: "-9.99", source: "csv" },
  ];
  const merged = core.mergeManualTransactions([], manual);
  assert.equal(merged.find((a) => a.manual).transactions.length, 2);
});

test("mergeManualTransactions with no manual txns returns accounts untouched", () => {
  const accounts = [{ name: "X", transactions: [] }];
  assert.equal(core.mergeManualTransactions(accounts, []), accounts);
});
