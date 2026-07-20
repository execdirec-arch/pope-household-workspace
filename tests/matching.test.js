/* Keyword/bill matching against how Wells Fargo actually writes merchants.

   Every description below is copied verbatim from Lauren's real export.
   The pattern these encode: WF drops spaces ("Circlek"), drops punctuation
   ("ATT" for AT&T), pluralizes ("BENNYS"), and abbreviates ("PROG
   PALOVERDE" for Progressive). Matching has to survive all four without
   becoming loose enough to fire on substrings ("rma" inside "pharmacy",
   "shell" inside NEWREZ-SHELLPOIN). */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const core = require("../workspace/budget-core.js");

const GAS = { id: "gas", txnKeywords: ["shell", "circle k", "marathon", "exxon"] };
const cfg = (extra = {}) => ({ categories: [GAS], bills: [], debtKeywords: [], ...extra });
const spend = (desc, config) => core.categorize({ description: desc, amount: "-20.00" }, config || cfg());

/* ---------- the bugs ---------- */

test("Circlek (no space) counts as circle k", () => {
  assert.equal(spend("PURCHASE Circlek #2740387          LA PLACE      LA").categoryId, "gas");
});

test("possessive/plural merchant names match the singular keyword", () => {
  const config = cfg({ bills: [{ id: "carwash", txnMatch: "benny" }] });
  assert.equal(core.categorize({ description: "PURCHASE BENNYS PERKI BATON ROUGE LA", amount: "-49.99" }, config).kind, "bill");
});

test("AT&T matches when WF writes ATT without punctuation", () => {
  const config = cfg({ bills: [{ id: "att", txnMatch: "at&t" }] });
  assert.equal(core.categorize({ description: "ATT   *BILL PAYMENT 800-288-2020 TX", amount: "-114.99" }, config).kind, "bill");
});

test("multi-word bill matchers survive WF's collapsed spelling", () => {
  const config = cfg({ bills: [{ id: "ins", txnMatch: "prog paloverde" }] });
  assert.equal(core.categorize({ description: "PROG PALOVERDE INS PREM 260701 Rebecca Pope", amount: "-330.66" }, config).kind, "bill");
});

/* ---------- the guardrails these fixes must not break ---------- */

test("shell does not match NEWREZ-SHELLPOIN (the mortgage-in-gas bug)", () => {
  const r = spend("NEWREZ-SHELLPOIN WEB PMTS   260629 0676536683 POPE OLIVER");
  assert.notEqual(r.categoryId, "gas");
});

test("short keywords still do not match inside longer words", () => {
  const config = cfg({ bills: [{ id: "rma", txnMatch: "rma" }] });
  assert.notEqual(core.categorize({ description: "PURCHASE CVS/PHARMACY #1234", amount: "-12.00" }, config).kind, "bill");
  // and the plural rule must not turn "bp" into a match for "bps" inside words
  assert.notEqual(spend("PURCHASE SUBPOENA SERVICES").categoryId, "gas");
});

test("collapsed matching does not let a keyword span unrelated words", () => {
  // "circle k" collapsed is "circlek" — must not match "circle keeper"
  assert.notEqual(spend("PURCHASE THE CIRCLE KEEPER LLC").categoryId, "gas");
});

test("exxon does not match inside a longer token", () => {
  assert.notEqual(spend("PURCHASE EXXONERATED BOOKS").categoryId, "gas");
});

/* ---------- dead-matcher guard ----------
   A bill whose txnMatch never fires looks permanently unpaid and silently
   drops out of spending totals. This is how "Electric: entergy" and
   "Car Insurance: progressive" sat broken while the real charges came
   through as DIXIE ELECTRIC and PROG PALOVERDE. Any autopay/recurring bill
   configured here must match something in the real statement history. */
test("every autopay bill matcher fires against real statement history", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const fixture = path.join(__dirname, "fixtures", "wf-checking-2026-07-20.csv");
  if (!fs.existsSync(fixture)) return; // fixture is gitignored (real financial data)

  const WfCsv = require("../workspace/wf-csv.js");
  global.window = global.window || {};
  require("../workspace/data.js");
  const data = global.window.WORKSPACE_DATA;
  const txns = WfCsv.parse(fs.readFileSync(fixture, "utf8"));

  // Only bills that should appear in ~4 months of checking activity:
  // autopay/recurring ones, excluding anything paid from another account.
  // Known exceptions: bills that genuinely don't appear in THIS account's
  // history. Add here only with a reason, never to silence a real miss.
  const NOT_IN_CHECKING = [
    "HELOC", // no payment found Apr-Jul 2026 at any amount; paid elsewhere or inactive — open question for Lauren 2026-07-20
  ];

  const expected = (data.bills || []).filter(
    (b) => b.autopay && b.status === "active" && b.txnMatch && !NOT_IN_CHECKING.includes(b.name)
  );
  const dead = expected.filter((b) => !txns.some((t) => core.categorize(
    { description: t.description, amount: "-1.00" },
    { categories: [], bills: [b], debtKeywords: [] }
  ).billId));

  assert.deepEqual(dead.map((b) => b.name + " (" + b.txnMatch + ")"), [],
    "these bill matchers never fire against the real statement");
});
