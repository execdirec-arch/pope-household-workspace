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
    { when: "Thu May 28", label: "Follow up with Henry (HR3) on attic repair timeline", who: "Henry 504-232-8827", status: "open", note: "Claim 01-009-725103, Homesite by Progressive" },
    { when: "Sun Jun 1",  label: "Mortgage due", who: "NewRez/ShellPoint", status: "deadline", note: "$2,975.82 — confirm payment" },
    { when: "Sun Jun 1",  label: "HELOC due",    who: "Dovenmuehl",        status: "deadline", note: "$686.94" },
    { when: "Wed Jun 4",  label: "HR3 follow-up — repair timeline", who: "Henry", status: "open", note: "If no update by now, call" },
    { when: "Sat Jun 7",  label: "Budget + debt review session", who: "Oliver + Lauren", status: "prep", note: "Set payoff order, APRs, fast-food cap" },
  ],

  todos: {
    development: [
      { id: "t1", label: "Cancel Albert (Mon Jun 2)",                    urgent: true,  done: false, note: "Pending pulls need to clear first. Check Mon Jun 2 and cancel. Recover auto-saved funds." },
      { id: "t2", label: "Confirm Disney Chase + Amex actual APRs",      urgent: true,  done: false, note: "All others confirmed. Disney Chase was 0% intro (expired). Amex over-limit — likely highest. Pull current statements." },
      { id: "t3", label: "Follow up with Henry on attic repair",         urgent: true,  done: false, note: "Claim 01-009-725103. Repair timeline? Docs needed for Progressive?" },
    ],
    programs: [
      { id: "t4", label: "Set $400 Cycle A buffer in checking",          urgent: true,  done: false, note: "Mid-month bill cluster exceeds one paycheck. Keep $400 carry from Cycle B at all times." },
      { id: "t5", label: "Confirm mortgage + HELOC autopay status",      urgent: true,  done: false, note: "Both manual. Due mid-month. These are the ones that slip." },
      { id: "t6", label: "Set fast-food vs. grocery delivery budget cap", urgent: false, done: false, note: "Target: $900/mo groceries total (delivery inc.). Separate restaurant line at $200/mo." },
    ],
    grants: [
      { id: "t7", label: "Confirm AT&T: does it cover internet too?",    urgent: false, done: false, note: "$114.99 cell confirmed. Is internet a separate AT&T bill or different provider?" },
      { id: "t8", label: "Confirm lawn rate",                            urgent: false, done: false, note: "Vault says $195, tracker showed $315. What's the current contract?" },
      { id: "t9", label: "Gather homeschool curriculum details",         urgent: false, done: false, note: "Per-kid vault pages pending. Needed before building homeschool platform." },
    ],
  },

  nudges: [
    {
      tone: "urgent",
      title: "Mortgage and HELOC both hit June 1 — confirm payment now",
      body: "These are the exact bills that slip. $2,975.82 (NewRez) and $686.94 (Dovenmuehl) are both due June 1. That's $3,662 in four days. Verify the payment is queued or autopay is active. Don't let them push to end of month.",
    },
    {
      tone: "major",
      title: "Avalanche order set — one card still pending",
      body: "14 of 15 cards ranked. First Premier (36%) is the immediate target. Citi APR is the only unknown — account access blocked during Discover transfer. Once transfer completes, Discover balance will rise and Citi closes. Amex strategy: pay off (29.90%), then use as the household monthly spend card paid in full.",
    },
    {
      tone: "metric",
      title: "The budget leak analysis will pay for itself fast",
      body: "The Expense Tracker shows Amazon, Prime Video, Apple, Xbox, Avast, and Microsoft all hitting in the same pay period. Some of these may be duplicating or forgotten. One audit session could free up $50-100/mo that goes straight to debt.",
    },
    {
      tone: "people",
      title: "Attic repair has a hard dependency on insurance",
      body: "Henry (HR3) can't finish without Progressive settling the claim. Keep the claim number (01-009-725103) and adjuster line (866-621-4823) front of mind. If the claim stalls, the repair stalls. Follow up proactively.",
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
    { id: "b3",  name: "Car Payment",    amount: 559.80,  dueDay: 22,   autopay: false, status: "active", servicer: "Neighbors ECM",     method: "Neighbors FCU", txnMatch: "neighbors" },
    { id: "b4",  name: "AT&T",           amount: 114.99,  dueDay: 27,   autopay: true,  status: "active", servicer: "AT&T",              method: "autopay", note: "Cell — replaced T-Mobile", txnMatch: "at&t" },
    { id: "b5",  name: "RMA Music",      amount: 344.62,  dueDay: 16,   autopay: true,  status: "active", servicer: "RMA Music School",  method: "PayPal",      txnMatch: "rma" },
    { id: "b6",  name: "Life Ins",       amount: 113.36,  dueDay: 14,   autopay: true,  status: "active", servicer: "State Farm",        method: "autopay",     txnMatch: "state farm" },
    { id: "b7",  name: "Lawn",           amount: 195.00,  dueDay: 30,   autopay: false, status: "active", servicer: "[TBD]",             method: "check/cash" },
    { id: "b8",  name: "Netflix",        amount: 27.61,   dueDay: 9,    autopay: true,  status: "active", servicer: "Netflix",           method: "credit card", txnMatch: "netflix" },
    { id: "b9",  name: "Kitty Poo",      amount: 60.88,   dueDay: 18,   autopay: true,  status: "active", servicer: "Kitty Poo Club",    method: "autopay",     txnMatch: "kitty poo" },
    { id: "b10", name: "Xbox",           amount: 24.89,   dueDay: 18,   autopay: true,  status: "active", servicer: "Microsoft",         method: "autopay",     txnMatch: "microsoft" },
    { id: "b11", name: "Affirm/Lauren",  amount: 58.81,   dueDay: 10,   autopay: true,  status: "active", servicer: "Shop.com/Affirm",   method: "autopay", note: "13 payments remaining — done Jun 2027", txnMatch: "affirm" },
    { id: "b11b",name: "Affirm/Oliver",  amount: 152.94,  dueDay: 27,   autopay: false, status: "active", servicer: "Shop.com/Affirm",   method: "manual",  note: "~12 months remaining. Wells Fargo stopped covering — payment bounced, must now be paid manually before the 27th.", txnMatch: "affirm" },
    { id: "b12", name: "Electric",       amount: 321.00,  dueDay: 2,    autopay: true,  status: "active", servicer: "Entergy",           method: "autopay",     txnMatch: "entergy" },
    { id: "b13", name: "Internet",       amount: 100.00,  dueDay: 13,   autopay: true,  status: "active", servicer: "AT&T",              method: "autopay",     txnMatch: "at&t internet" },
    { id: "b14", name: "Car Insurance",  amount: 330.66,  dueDay: 16,   autopay: true,  status: "active", servicer: "Progressive",       method: "autopay",     txnMatch: "progressive" },
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
    cards: [
      { name: "First Premier 8513", last4: "8513", limit: 1600,  balance: 1352,  apr: 36.00, avalancheRank: 1,  note: "First Premier — highest APR, first target" },
      { name: "First Premier 1308", last4: "1308", limit: 1000,  balance: 1096,  apr: 36.00, avalancheRank: 2,  note: "First Premier — tied for #1 APR" },
      { name: "Capital One 4405",   last4: "4405", limit: 3000,  balance: null,  apr: 30.24, avalancheRank: 3,  note: "Balance TBD — confirm open/closed with Oliver" },
      { name: "Amex",               last4: null,   limit: 3700,  balance: 5298,  apr: 29.90, avalancheRank: 4,  note: "Strategy: pay off then use as monthly spend card (pay in full each month)" },
      { name: "Credit One 1001",    last4: "1001", limit: 1300,  balance: 1120,  apr: 29.65, avalancheRank: 5,  note: "" },
      { name: "Credit One 8559",    last4: "8559", limit: 2000,  balance: 1441,  apr: 29.15, avalancheRank: 6,  note: "" },
      { name: "Credit One 8853",    last4: "8853", limit: 550,   balance: null,  apr: 29.15, avalancheRank: 7,  note: "Balance TBD" },
      { name: "Capital One 0412",   last4: "0412", limit: 3500,  balance: null,  apr: 28.24, avalancheRank: 8,  note: "Balance TBD — confirm open/closed with Oliver" },
      { name: "Capital One 3446",   last4: "3446", limit: 2000,  balance: null,  apr: 28.15, avalancheRank: 9,  note: "Balance TBD — confirm open/closed with Oliver" },
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
      summary: "Water leak in attic. Insurance claim filed with Homesite by Progressive. HR3 Productions (Henry) is the contractor.",
      next: "Follow up with Henry on repair timeline. Submit any outstanding docs to Progressive.",
      stats: "Claim 01-009-725103 · Henry 504-232-8827",
    },
    {
      id: "budget",
      title: "Household Budget Overhaul",
      phase: "ACTIVE",
      urgency: "hot",
      dueLabel: "Review Jun 7",
      dueDate: "2026-06-07",
      owner: "Lauren",
      summary: "Oliver's income covers operations + minimum debt service. Lauren's income goes entirely to accelerated debt payoff (avalanche method).",
      next: "Pull APRs on all 14 cards. Set fast-food monthly cap. Run budget leak analysis.",
      stats: "~$65K debt · avalanche method confirmed",
    },
    {
      id: "homeschool",
      title: "Homeschool Platform",
      phase: "PLANNING",
      urgency: "warm",
      dueLabel: "Planning Jun 14",
      dueDate: "2026-06-14",
      owner: "Lauren",
      summary: "Per-kid vault pages (Anna 17, Charlie 15, Jessie 13, Rose 10, Finn 7) that surface into this workspace.",
      next: "Gather curriculum and grade level details per kid before building pages.",
      stats: "5 kids to track · no pages yet",
    },
    {
      id: "wfapi",
      title: "Wells Fargo API Integration",
      phase: "PLANNING",
      urgency: "cool",
      dueLabel: "Future",
      dueDate: "2026-09-01",
      owner: "Oliver",
      summary: "Automatic transaction pull from Neighbors FCU into the workspace. Eliminates manual Expense Tracker entry.",
      next: "Research Plaid API access (connects to most banks including Wells Fargo).",
      stats: "Planning only · no build started",
    },
    {
      id: "gapi",
      title: "Google Suite Integration",
      phase: "PLANNING",
      urgency: "cool",
      dueLabel: "Future",
      dueDate: "2026-10-01",
      owner: "Lauren",
      summary: "Connect Google Calendar and Gmail to the household vault for morning briefing automation.",
      next: "Define scope — calendar, Gmail, Drive, or all three.",
      stats: "Future state only",
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
