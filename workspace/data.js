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
      { id: "t1", label: "Pull APRs for all 14 credit cards",           urgent: true,  done: false, note: "Needed to set avalanche payoff order. Check each card's current statement." },
      { id: "t2", label: "Follow up with Henry on attic repair",         urgent: true,  done: false, note: "Claim 01-009-725103. What's the repair timeline? Any docs needed for Progressive?" },
      { id: "t3", label: "Submit any outstanding docs to Progressive",   urgent: false, done: false, note: "claimdocuments@afics.com · adjuster 866-621-4823" },
    ],
    programs: [
      { id: "t4", label: "Set monthly fast-food budget cap",             urgent: false, done: false, note: "Communicate to Oliver. Log the number in CONTEXT.md." },
      { id: "t5", label: "Set up autopay or calendar for mortgage + HELOC", urgent: false, done: false, note: "Both due June 1. These are the ones that slip." },
      { id: "t6", label: "Run budget leak analysis (first pass)",        urgent: false, done: false, note: "3 months of Expense Tracker data. Flag unknowns and silent price hikes." },
    ],
    grants: [
      { id: "t7", label: "Gather homeschool curriculum details",         urgent: false, done: false, note: "Need grade level, subjects, and current materials for each kid before building pages." },
      { id: "t8", label: "Confirm 401K institution and contribution rate", urgent: false, done: false, note: "Add to /Accounts/401K.md" },
      { id: "t9", label: "Fill in T-Mobile due date and plan details",   urgent: false, done: false, note: "$247.43/mo — how many lines? Due when?" },
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
      title: "Avalanche order needs APRs to work",
      body: "The payoff strategy is set: Lauren's income goes to debt, avalanche order. But you haven't ranked the cards yet. The highest-rate card should get every extra dollar. Pull statements for all 14 and rank them. One hour of work; months of savings.",
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

  // Bills — due soon + ongoing
  bills: [
    { id: "b1", name: "Mortgage",     amount: 2975.82, dueDate: "2026-06-01", autopay: false, status: "due-soon",  servicer: "NewRez/ShellPoint",  method: "Neighbors FCU" },
    { id: "b2", name: "HELOC",        amount: 686.94,  dueDate: "2026-06-01", autopay: false, status: "due-soon",  servicer: "Dovenmuehl",         method: "Neighbors FCU" },
    { id: "b3", name: "Car Payment",  amount: 559.80,  dueDate: "2026-06-03", autopay: false, status: "upcoming",  servicer: "Neighbors ECM",      method: "Neighbors FCU" },
    { id: "b4", name: "T-Mobile",     amount: 247.43,  dueDate: "[TBD]",      autopay: true,  status: "active",    servicer: "T-Mobile",           method: "autopay" },
    { id: "b5", name: "RMA Music",    amount: 344.62,  dueDate: "[TBD]",      autopay: true,  status: "active",    servicer: "RMA Music School",   method: "PayPal" },
    { id: "b6", name: "Life Ins",     amount: 113.36,  dueDate: "[TBD]",      autopay: true,  status: "active",    servicer: "[TBD]",              method: "autopay" },
    { id: "b7", name: "Lawn",         amount: 195.00,  dueDate: "[TBD]",      autopay: false, status: "active",    servicer: "[provider TBD]",     method: "check/cash" },
    { id: "b8", name: "Netflix",      amount: 27.61,   dueDate: "[TBD]",      autopay: true,  status: "active",    servicer: "Netflix",            method: "credit card" },
    { id: "b9", name: "Kitty Poo",    amount: 60.88,   dueDate: "[TBD]",      autopay: true,  status: "active",    servicer: "Kitty Poo Club",     method: "autopay" },
    { id: "b10", name: "Xbox",        amount: 33.69,   dueDate: "[TBD]",      autopay: true,  status: "active",    servicer: "Microsoft",          method: "Neighbors FCU" },
    { id: "b11", name: "MS 365",      amount: 14.05,   dueDate: "[TBD]",      autopay: true,  status: "active",    servicer: "Microsoft",          method: "Neighbors FCU" },
    { id: "b12", name: "Prime Video", amount: 14.48,   dueDate: "[TBD]",      autopay: true,  status: "active",    servicer: "Amazon",             method: "Neighbors FCU" },
    { id: "b13", name: "Apple",       amount: 9.93,    dueDate: "[TBD]",      autopay: true,  status: "active",    servicer: "Apple",              method: "PayPal" },
    { id: "b14", name: "Affirm/Anna", amount: 58.81,   dueDate: "[TBD]",      autopay: true,  status: "active",    servicer: "Affirm",             method: "autopay" },
  ],

  // Credit card debt summary
  debt: {
    total: 65159,
    strategy: "Avalanche — highest APR first",
    cards: [
      { name: "Amex",           limit: 3700,  balance: 5298,  utilization: 143, apr: "[TBD]" },
      { name: "Apple",          limit: 2000,  balance: 1935,  utilization: 97,  apr: "[TBD]" },
      { name: "Capital One L1", limit: 3500,  balance: 3491,  utilization: 100, apr: "[TBD]" },
      { name: "Capital One O1", limit: 2001,  balance: 1946,  utilization: 97,  apr: "[TBD]" },
      { name: "Capital One O2", limit: 3000,  balance: 3090,  utilization: 103, apr: "[TBD]" },
      { name: "Chase 1",        limit: 600,   balance: 1235,  utilization: 206, apr: "[TBD]" },
      { name: "Chase 2",        limit: 10400, balance: 10453, utilization: 101, apr: "[TBD]" },
      { name: "Citi",           limit: 12500, balance: 12138, utilization: 97,  apr: "[TBD]" },
      { name: "Credit One L1",  limit: 550,   balance: 562,   utilization: 102, apr: "[TBD]" },
      { name: "Credit One L2",  limit: 1200,  balance: 1221,  utilization: 102, apr: "[TBD]" },
      { name: "Credit One O1",  limit: 2250,  balance: 2203,  utilization: 98,  apr: "[TBD]" },
      { name: "Credit One O2",  limit: 1400,  balance: 1070,  utilization: 76,  apr: "[TBD]" },
      { name: "Discover",       limit: 12500, balance: 12519, utilization: 100, apr: "[TBD]" },
      { name: "First Premier 1",limit: 1650,  balance: 1352,  utilization: 82,  apr: "[TBD]" },
      { name: "First Premier 2",limit: 1100,  balance: 1096,  utilization: 100, apr: "[TBD]" },
      { name: "Indigo",         limit: 300,   balance: 3,     utilization: 1,   apr: "[TBD]" },
      { name: "PayPal",         limit: 4400,  balance: 5545,  utilization: 126, apr: "[TBD]" },
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
