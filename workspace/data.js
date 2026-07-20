/* =======================================================================
   Pope Household Workspace — STATIC FALLBACK DATA
   Shown before a vault is connected. Mirrors the Pope household structure.
   Once a real vault is connected, the gazette parser overrides daily sections.
   ======================================================================= */
window.WORKSPACE_DATA = {
  org: {
    name: "Pope Household",
    short: "Pope",
    mark: "P",
  },

  user: {
    firstName: "Lauren",
    lastName: "Pope",
    role: "Household Operations",
    email: "execdirec@rehumanizeintl.org",
  },

  today: {
    date: "2026-05-28",
    weekday: "Thursday",
    monthDay: "May 28",
    year: 2026,
    countdowns: [
      { label: "Attic repair follow-up", date: "2026-06-04", days: 7 },
      { label: "Budget review",          date: "2026-06-07", days: 10 },
      { label: "Debt payoff checkpoint", date: "2026-08-01", days: 65 },
    ],
    pulse: {
      billsDueThisWeek: 2,
      debtTotal: "$65,159",
      openProjects: 5,
      openLoops: 8,
    },
  },

  schedule: [
    { when: "Mon Jul 20", label: "Citi/Discover avalanche payment window", who: "Citi", status: "deadline", note: "$850 targeted payment — due day 18 cycle" },
    { when: "Wed Jul 22", label: "Car payment due", who: "Neighbors ECM", status: "deadline", note: "$559.80 — resumed after June skip-a-payment" },
    { when: "Mon Jul 27", label: "Affirm (Oliver) due — manual", who: "Affirm", status: "deadline", note: "$152.94 — autopay broken, must pay manually" },
    { when: "Fri Jul 24", label: "Payday (Oliver)", who: "MasteryPrep", status: "prep", note: "$5,782.90 — Cycle B; set aside Cycle A buffer" },
  ],

  todos: {
    development: [
      { id: "t1", label: "Cancel Albert — still billing",                urgent: true,  done: false, note: "Pulled $51 + $55 in the first week of July. Roughly $100/mo bleeding since June. Cancel in the Albert app, then request recovery of auto-saved funds." },
      { id: "t3", label: "Follow up with Henry on attic repair",         urgent: false, done: false, note: "Claim 01-009-725103. Last contact May. Repair timeline? Docs needed for Progressive?" },
    ],
    programs: [
      { id: "t4", label: "Set $400 Cycle A buffer in checking",          urgent: true,  done: false, note: "Mid-month bill cluster exceeds one paycheck. Keep $400 carry from Cycle B at all times." },
      { id: "t6", label: "Set fast-food vs. grocery delivery budget cap", urgent: false, done: false, note: "Target: $900/mo groceries total (delivery inc.). Separate restaurant line at $200/mo." },
    ],
    grants: [
      { id: "t2", label: "Confirm Disney Chase + Amex actual APRs",      urgent: false, done: false, note: "12 of 14 confirmed. Disney Chase was 0% intro (expired). Amex over-limit — likely highest." },
      { id: "t9", label: "Gather homeschool curriculum details",         urgent: false, done: false, note: "Per-kid vault pages pending. Needed before building homeschool platform." },
    ],
  },

  nudges: [
    {
      tone: "urgent",
      title: "Albert is still billing — $106 pulled in the first week of July",
      body: "Flagged for cancellation June 2, never cancelled, still pulling ($51 on Jul 1, $55 on Jul 3). Cancelling it in the app and recovering the auto-saved balance is the single fastest recurring money win available.",
    },
    {
      tone: "major",
      title: "July 1 went clean — mortgage, car, and debt payments all confirmed",
      body: "Bank data confirms NewRez $2,968.98, Neighbors car payment $559.80 (resumed after the June skip), Citi $406, Chase $550, Amex $200, and First Premier $275 all cleared July 1. The month started handled.",
    },
    {
      tone: "metric",
      title: "Affirm (Oliver) is the one bill with no safety net",
      body: "Autopay bounced and it's manual now: $152.94 due the 27th. Until the payment method is fixed in the Affirm app, this is the likeliest bill to slip each month.",
    },
    {
      tone: "people",
      title: "Avalanche unchanged: First Premier first",
      body: "First Premier (36%) remains the target for every Rehumanize dollar. Citi/Discover transfer status needs a fresh look once the bank feed is current — Discover's balance will have risen and Citi may be closed.",
    },
  ],

  inbox: [
    {
      id: "in1",
      from: "Progressive / Homesite",
      subject: "Attic repair claim 01-009-725103",
      preview: "Track claim status and any document requests.",
      received: "",
      priority: "action",
      action: "Check claim status. Submit any outstanding docs to claimdocuments@afics.com.",
      tags: ["insurance", "home"],
    },
    {
      id: "in2",
      from: "Credit card statements",
      subject: "Pull APRs for avalanche ranking",
      preview: "Need current APR for all 14 cards to set payoff order.",
      received: "",
      priority: "action",
      action: "Log APRs in Bills/Credit Cards -- Debt Service.md and rank highest to lowest.",
      tags: ["debt", "finance"],
    },
    {
      id: "in3",
      from: "Henry (HR3 Productions)",
      subject: "Attic repair — timeline TBD",
      preview: "No confirmed repair start date yet.",
      received: "",
      priority: "chase",
      action: "Call or text Henry at 504-232-8827 if no update by June 4.",
      tags: ["home", "repair"],
    },
  ],

  // Bills — confirmed from live Wells Fargo transaction data (May 2026)
  bills: [
    { id: "b1",  name: "Mortgage",       amount: 2975.82, dueDay: 17,   payDay: 31,   autopay: false, status: "active", servicer: "NewRez/ShellPoint", method: "Neighbors FCU", note: "Due 14-17 but paid on the 31st of prior month", txnMatch: "newrez" },
    { id: "b2",  name: "HELOC",          amount: 686.94,  dueDay: 16,   autopay: true,  status: "active", servicer: "Dovenmuehl",        method: "autopay",     txnMatch: "dovenmuehl" },
    { id: "b3",  name: "Car Payment",    amount: 559.80,  dueDay: 22,   autopay: false, status: "active", servicer: "Neighbors ECM",    method: "Neighbors FCU", txnMatch: "neighbors", note: "Resumed after June skip-a-payment — $559.80 confirmed paid Jul 1." },
    { id: "b4",  name: "AT&T Cell",       amount: 114.99,  dueDay: 27,   autopay: true,  status: "active", servicer: "AT&T",              method: "autopay", note: "Cell phones — replaced T-Mobile", txnMatch: "at&t" },
    { id: "b5",  name: "RMA Music",      amount: 344.62,  dueDay: 16,   autopay: true,  status: "active", servicer: "RMA Music School",  method: "PayPal",      txnMatch: "rma" },
    { id: "b6",  name: "Life Ins",       amount: 113.36,  dueDay: 14,   autopay: true,  status: "active", servicer: "State Farm",        method: "autopay",     txnMatch: "state farm" },
    { id: "b8",  name: "Netflix",        amount: 27.61,   dueDay: 9,    autopay: true,  status: "active", servicer: "Netflix",           method: "credit card", txnMatch: "netflix" },
    { id: "b9",  name: "Kitty Poo",      amount: 60.88,   dueDay: 18,   autopay: true,  status: "active", servicer: "Kitty Poo Club",    method: "autopay",     txnMatch: "kitty poo" },
    { id: "b10", name: "Xbox",           amount: 24.89,   dueDay: 18,   autopay: true,  status: "active", servicer: "Microsoft",         method: "autopay",     txnMatch: "microsoft" },
    { id: "b11", name: "Affirm/Lauren",  amount: 58.81,   dueDay: 10,   autopay: true,  status: "active", servicer: "Shop.com/Affirm",   method: "autopay", note: "13 payments remaining — done Jun 2027", txnMatch: "affirm" },
    { id: "b11b",name: "Affirm/Oliver",  amount: 152.94,  dueDay: 27,   autopay: false, status: "active", servicer: "Shop.com/Affirm",   method: "manual",  note: "~12 months remaining. Wells Fargo stopped covering — payment bounced, must now be paid manually before the 27th.", txnMatch: "affirm" },
    { id: "b12", name: "Electric",       amount: 321.00,  dueDay: 2,    autopay: true,  status: "active", servicer: "Dixie Electric",    method: "autopay",     txnMatch: "dixie electric" },
    { id: "b13", name: "AT&T Internet",   amount: 100.00,  dueDay: 13,   autopay: true,  status: "active", servicer: "AT&T",              method: "autopay",     txnMatch: "at&t" },
    { id: "b14", name: "Car Insurance",  amount: 330.66,  dueDay: 16,   autopay: true,  status: "active", servicer: "Progressive",       method: "autopay",     txnMatch: "prog paloverde" },
    { id: "b15", name: "Hulu",           amount: 12.00,   dueDay: 12,   autopay: true,  status: "active", servicer: "Hulu",              method: "credit card", txnMatch: "hulu" },
    { id: "b16", name: "Dropbox",        amount: 11.99,   dueDay: 26,   autopay: true,  status: "active", servicer: "Dropbox",           method: "credit card", txnMatch: "dropbox" },
    { id: "b17", name: "Citi (debt)",    amount: 850.00,  dueDay: 18,   autopay: false, status: "active", servicer: "Citi",              method: "manual",      txnMatch: "citi" },
    { id: "b18", name: "Craft Violins",  amount: 49.25,   dueDay: 26,   autopay: true,  status: "active", servicer: "Craft Violins LLC", method: "autopay",     txnMatch: "craft violin" },
    { id: "b19", name: "YMCA",           amount: 111.00,  dueDay: 18,   autopay: true,  status: "active", servicer: "YMCA Americana",    method: "autopay",     txnMatch: "ymca" },
    { id: "b20", name: "US Law Shield",  amount: 27.80,   dueDay: 18,   autopay: true,  status: "active", servicer: "US Law Shield",     method: "autopay",     txnMatch: "law shield" },
    { id: "b21", name: "Zoom",           amount: 16.49,   dueDay: 18,   autopay: true,  status: "active", servicer: "Zoom",              method: "autopay",     txnMatch: "zoom" },
    { id: "b22", name: "Claude.ai",      amount: 22.30,   dueDay: 18,   autopay: true,  status: "active", servicer: "Anthropic",         method: "autopay",     txnMatch: "anthropic" },
    { id: "b24", name: "Spotify",        amount: 24.52,   dueDay: 26,   autopay: true,  status: "active", servicer: "Spotify",           method: "PayPal",      txnMatch: "spotify" },
    { id: "b25", name: "Crunchyroll",    amount: 19.87,   dueDay: 26,   autopay: true,  status: "active", servicer: "Crunchyroll",       method: "PayPal",      txnMatch: "crunchyroll" },
    { id: "b26", name: "Beast Academy",  amount: 15.99,   dueDay: 19,   autopay: true,  status: "active", servicer: "Beast Academy",     method: "autopay",     txnMatch: "beast academy" },
    { id: "b27", name: "Benny's Carwash",amount: 49.99,   dueDay: null, autopay: true,  status: "active", servicer: "Benny's",           method: "autopay",     txnMatch: "benny" },
    { id: "b28", name: "Uber One",       amount: 9.99,    dueDay: 18,   autopay: true,  status: "active", servicer: "Uber",              method: "autopay",     txnMatch: "uber one" },
    { id: "b29", name: "Google MLB",     amount: 4.32,    dueDay: 18,   autopay: true,  status: "active", servicer: "Google",            method: "autopay",     txnMatch: "google" },
    { id: "b30", name: "Apple Services", amount: 9.99,    dueDay: 26,   autopay: true,  status: "active", servicer: "Apple",             method: "PayPal",      txnMatch: "apple" },
  ],

  // Spending budgets — variable categories tracked against bank transactions + manual entries
  spending: {
    categories: [
      {
        id: "grocery",
        label: "Groceries",
        emoji: "🛒",
        budgetPerWeek: 450,    // Real spend for family of 8. Non-negotiable floor.
        txnKeywords: ["costco", "walmart", "kroger", "whole foods", "instacart", "uber eats", "doordash", "winn dixie", "rouses", "rouse", "brookshire", "albertson", "aldi", "trader joe"],
        note: "Family of 8. $450/wk is the real floor, not a target to cut. Uber Eats = Costco delivery.",
      },
      {
        id: "gas",
        label: "Gas",
        emoji: "⛽",
        budgetPerWeek: 75,
        txnKeywords: ["shell", "circle k", "chevron", "exxon", "bp", "murphy", "speedway", "valero", "racetrac", "marathon", "buc-ee", "qt", "quiktrip", "sunoco", "citgo", "texaco"],
        note: "Fuel only. Car wash excluded (separate bill).",
      },
      {
        id: "pharmacy",
        label: "Health",
        emoji: "💊",
        budgetPerWeek: 25,     // $100/mo ÷ 4 weeks
        txnKeywords: ["cvs", "walgreens", "hometown pharmacy", "bonin clinic", "copay", "lab corp", "quest diag"],
        note: "Pharmacy, copays, clinic visits.",
      },
      {
        id: "household",
        label: "Household",
        emoji: "🏠",
        budgetPerWeek: 113,    // $150/mo misc + $300/mo lawn = $450/mo ÷ 4 weeks
        txnKeywords: ["amazon", "home depot", "lowes", "target", "dollar tree", "dollar general", "lawn", "ac ", "air condition", "repair"],
        note: "Includes lawn ($300/mo summer rate, check/cash), Amazon, hardware, AC man, misc repairs.",
      },
      {
        id: "discretionary",
        label: "Discretionary",
        emoji: "✨",
        budgetPerWeek: 94,     // ~$375/mo (restaurants $200 + coffee $75 + kids $100) ÷ 4 weeks
        txnKeywords: [],
        note: "Dates, clothing, coffee runs, kids' incidentals. Truly optional spending.",
        manualOnly: true,
      },
    ],
  },

  // Oliver's bi-weekly pay schedule. Confirmed: $5,782.90 net (raise confirmed May 2026).
  paySchedule: {
    frequency: "biweekly",
    amount: 5782.90,
    name: "Oliver (MasteryPrep)",
    dates: [
      "2026-05-29",
      "2026-06-12", "2026-06-26",
      "2026-07-10", "2026-07-24",
      "2026-08-07", "2026-08-21",
      "2026-09-04", "2026-09-18",
    ],
  },

  // Credit card debt — avalanche order (highest APR first). Balances as of May 2026.
  debt: {
    total: 65159,
    startingTotal: 65159,       // Frozen starting point — never update this
    monthlyToDebt: 1500,        // Lauren's estimated monthly contribution to avalanche (update as income clarifies)
    strategy: "Avalanche — highest APR first. Lauren's income → top card each pay period.",
    // Debit descriptions that are credit card / debt payments. Budget-core
    // excludes these from spending categories (they're debt service, not spend).
    txnKeywords: ["citi payment", "chase credit", "american express", "fpb cr", "concora", "credit one", "capital one", "discover", "apple card", "applecard", "first premier", "indigo"],
    cards: [
      { name: "First Premier 8513", last4: "8513", limit: 1600,  balance: 1352,  apr: 36.00, avalancheRank: 1,  note: "First Premier — highest APR, first target" },
      { name: "First Premier 1308", last4: "1308", limit: 1000,  balance: 1096,  apr: 36.00, avalancheRank: 2,  note: "First Premier — tied for #1 APR" },
      { name: "Capital One 4405",   last4: "4405", limit: 3000,  balance: 3000,  apr: 30.24, avalancheRank: 3,  note: "Near maxed — exact balance fluctuates ~$100 depending on cycle" },
      { name: "Amex",               last4: null,   limit: 3700,  balance: 5298,  apr: 29.90, avalancheRank: 4,  note: "Strategy: pay off then use as monthly spend card (pay in full each month)" },
      { name: "Credit One 1001",    last4: "1001", limit: 1300,  balance: 1120,  apr: 29.65, avalancheRank: 5,  note: "" },
      { name: "Credit One 8559",    last4: "8559", limit: 2000,  balance: 1441,  apr: 29.15, avalancheRank: 6,  note: "" },
      { name: "Credit One 8853",    last4: "8853", limit: 550,   balance: null,  apr: 29.15, avalancheRank: 7,  note: "Balance TBD" },
      { name: "Capital One 0412",   last4: "0412", limit: 3500,  balance: 3500,  apr: 28.24, avalancheRank: 8,  note: "Near maxed — exact balance fluctuates ~$100 depending on cycle" },
      { name: "Capital One 3446",   last4: "3446", limit: 2000,  balance: 2000,  apr: 28.15, avalancheRank: 9,  note: "Near maxed — exact balance fluctuates ~$100 depending on cycle" },
      { name: "Apple Card",         last4: null,   limit: 2000,  balance: 1963,  apr: 27.24, avalancheRank: 10, note: "" },
      { name: "Credit One 8613",    last4: "8613", limit: 1400,  balance: null,  apr: 25.15, avalancheRank: 11, note: "Balance TBD" },
      { name: "Discover",           last4: null,   limit: 12000, balance: 12580, apr: 24.24, avalancheRank: 12, note: "Citi balance transferring here this month — balance will increase" },
      { name: "Disney Chase",       last4: null,   limit: 10500, balance: 10228, apr: 17.49, avalancheRank: 13, note: "Lowest confirmed APR — last in payoff order" },
      { name: "Indigo",             last4: null,   limit: 300,   balance: 0,     apr: 23.90, avalancheRank: null, pif: true, note: "Paid in full every month — not carrying a balance, not an avalanche target" },
      { name: "Citi",               last4: null,   limit: 12500, balance: 12138, apr: null,  avalancheRank: null, note: "Transferring to Discover this month — no account access currently. $850/mo payment ongoing." },
    ],
  },

  // Active projects
  wips: [
    {
      id: "attic",
      title: "Attic Leak Repair",
      phase: "ACTIVE",
      urgency: "hot",
      dueLabel: "Follow-up Jun 4",
      dueDate: "2026-06-04",
      owner: "Oliver + Lauren",
      summary: "Water leak in attic. Insurance claim filed with Homesite by Progressive. HR3 Productions (Henry) is the contractor. Waiting on repair timeline and insurance settlement.",
      next: "Follow up with Henry on repair timeline. Submit any outstanding docs to Progressive.",
      contacts: [
        { name: "Henry", role: "Contractor — HR3 Productions", phone: "504-232-8827", note: "Active on claim. Call if no update by Jun 4." },
        { name: "Progressive / Homesite", role: "Insurance", phone: "866-621-4823", note: "Claim 01-009-725103. Send docs to claimdocuments@afics.com." },
      ],
      milestones: [
        { id: "m1", label: "Claim filed with Progressive", done: true },
        { id: "m2", label: "Contractor (Henry) assigned", done: true },
        { id: "m3", label: "Estimate submitted to insurance", done: false },
        { id: "m4", label: "Estimate approved by Progressive", done: false },
        { id: "m5", label: "Repair scheduled", done: false },
        { id: "m6", label: "Repair complete", done: false },
        { id: "m7", label: "Final inspection / closeout", done: false },
      ],
    },
    {
      id: "budget",
      title: "Household Budget Overhaul",
      phase: "ACTIVE",
      urgency: "hot",
      dueLabel: "Review Jun 7",
      dueDate: "2026-06-07",
      owner: "Lauren + Oliver",
      summary: "Built from live Wells Fargo data. Oliver's income covers all fixed bills and minimum debt payments. Lauren's income goes entirely to avalanche debt payoff. Cycle A runs structurally short — requires a $400 carry buffer.",
      next: "Review session Jun 7: set variable category caps, confirm debt payoff order, confirm Disney Chase APR.",
      contacts: [],
      milestones: [
        { id: "m1", label: "Live bank data connected (Teller)", done: true },
        { id: "m2", label: "All bills confirmed from transactions", done: true },
        { id: "m3", label: "APRs confirmed for all cards", done: false },
        { id: "m4", label: "Avalanche payoff order locked", done: false },
        { id: "m5", label: "Variable spending caps agreed", done: false },
        { id: "m6", label: "$400 Cycle A buffer established", done: false },
        { id: "m7", label: "Albert cancelled", done: false },
      ],
    },
    {
      id: "homeschool",
      title: "Homeschool Platform",
      phase: "PLANNING",
      urgency: "warm",
      dueLabel: "Planning Jun 14",
      dueDate: "2026-06-14",
      owner: "Lauren",
      summary: "Per-kid pages for Anna (17), Charlie (15), Jessie (13), Rose (10), Finn (7) that surface curriculum, grades, and appointments into the workspace.",
      next: "Gather curriculum and grade level details per kid before building pages.",
      contacts: [],
      milestones: [
        { id: "m1", label: "Curriculum details gathered per kid", done: false },
        { id: "m2", label: "Per-kid vault pages created", done: false },
        { id: "m3", label: "Pages surfaced in Family view", done: false },
      ],
    },
    {
      id: "wfapi",
      title: "Live Bank Integration",
      phase: "ACTIVE",
      urgency: "warm",
      dueLabel: "Running",
      dueDate: "2026-09-01",
      owner: "Oliver + Lauren",
      summary: "Teller.io mTLS integration pulling live Wells Fargo balances and transactions. Powers bill paid detection, window coverage, and spending tracker.",
      next: "Monitor for token expiry. Add Neighbors FCU when Teller supports it.",
      contacts: [
        { name: "Teller.io", role: "Bank API", phone: "", note: "Token: token_jrnbiz4hrzeogkuae4huphtye4. Cert expires — watch for 401 errors." },
      ],
      milestones: [
        { id: "m1", label: "Teller account created", done: true },
        { id: "m2", label: "Wells Fargo connected via mTLS", done: true },
        { id: "m3", label: "Live balances in workspace", done: true },
        { id: "m4", label: "Transaction matching for bill paid status", done: true },
        { id: "m5", label: "Neighbors FCU connected", done: false },
      ],
    },
    {
      id: "gapi",
      title: "Google Suite Integration",
      phase: "PLANNING",
      urgency: "cool",
      dueLabel: "Future",
      dueDate: "2026-10-01",
      owner: "Lauren",
      summary: "Connect Google Calendar and Gmail to the workspace for morning briefing automation.",
      next: "Define scope — calendar events, Gmail inbox, or both.",
      contacts: [],
      milestones: [
        { id: "m1", label: "Scope defined", done: false },
        { id: "m2", label: "OAuth credentials set up", done: false },
        { id: "m3", label: "Calendar events in Today view", done: false },
        { id: "m4", label: "Gmail inbox in workspace", done: false },
      ],
    },
  ],

  // People in orbit
  people: [
    { id: "oliver", name: "Oliver Pope",   role: "Dad · primary income",          thread: "Mortgage, car payment, operations budget", tags: ["household"] },
    { id: "holden", name: "Holden Pope",   role: "Age 21",                        thread: "[TBD]",                                    tags: ["kids"] },
    { id: "anna",   name: "Anna Pope",     role: "Age 17 · homeschool",           thread: "Affirm laptop $58.81/mo; OLOL Neurology",   tags: ["kids","homeschool"] },
    { id: "charlie",name: "Charlie Pope",  role: "Age 15 · homeschool",           thread: "[TBD]",                                    tags: ["kids","homeschool"] },
    { id: "jessie", name: "Jessie Pope",   role: "Age 13 · homeschool",           thread: "[TBD]",                                    tags: ["kids","homeschool"] },
    { id: "rose",   name: "Rose Pope",     role: "Age 10 · homeschool",           thread: "OLOL Neurology",                           tags: ["kids","homeschool"] },
    { id: "finn",   name: "Finn Pope",     role: "Age 7 · homeschool",            thread: "[TBD]",                                    tags: ["kids","homeschool"] },
    { id: "henry",  name: "Henry (HR3)",   role: "Contractor · attic repair",     thread: "504-232-8827 · active on claim 01-009-725103", tags: ["professional"] },
    { id: "hopewell",name:"John Hopewell", role: "Lawyer",                        thread: "[TBD]",                                    tags: ["professional"] },
  ],
};

/* Override the static `today` snapshot with the real clock at load time.
   The static values above are only a shape reference; without this block the
   header and countdowns stay frozen at the day the file was last edited. */
(function () {
  const now = new Date();
  const iso = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  const t = window.WORKSPACE_DATA.today;
  t.date = iso;
  t.year = now.getFullYear();
  t.weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  t.monthDay = now.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  t.countdowns = (t.countdowns || [])
    .map((c) => {
      const days = Math.ceil((new Date(c.date + "T00:00:00") - now) / 86400000);
      return { ...c, days };
    })
    .filter((c) => c.days >= 0);

  // Compute bill due-status from the real calendar (views filter on these,
  // nothing else sets them): due-soon = next 7 days, upcoming = 7-14 days.
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  for (const b of window.WORKSPACE_DATA.bills || []) {
    if (!b.dueDay || b.status === "skipped") continue;
    let delta = b.dueDay - now.getDate();
    if (delta < 0) delta += daysInMonth; // wraps to next month
    if (delta <= 7) b.status = "due-soon";
    else if (delta <= 14) b.status = "upcoming";
    else b.status = "active";
  }

  // Extend the biweekly pay schedule indefinitely from the last known payday
  // so Bill Map checkpoints keep working past the hardcoded list.
  const ps = window.WORKSPACE_DATA.paySchedule;
  if (ps && ps.frequency === "biweekly" && ps.dates && ps.dates.length) {
    const last = ps.dates[ps.dates.length - 1];
    let [y, m, d] = last.split("-").map(Number);
    let cur = new Date(y, m - 1, d);
    const horizon = new Date(now.getFullYear(), now.getMonth() + 14, 1);
    while (cur < horizon) {
      cur = new Date(cur.getTime() + 14 * 86400000);
      ps.dates.push(
        cur.getFullYear() + "-" + String(cur.getMonth() + 1).padStart(2, "0") + "-" + String(cur.getDate()).padStart(2, "0")
      );
    }
  }
})();
