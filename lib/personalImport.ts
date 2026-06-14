/**
 * Pre-mapped personal command register derived from Gmail review 14 May–14 Jun 2026.
 * Source: mornay_personal_mjw_signal_import.md
 * Privacy: this data is appended to the logged-in user's Supabase row only.
 * No credentials, OTPs, or API keys are stored here per PER-RULE-001.
 */

import type { Task, Habit, Project, MoneyData } from "@/lib/types";

/* ── Tasks (PER-TASK-001 to PER-TASK-021) ──────────────────────────── */
export const IMPORT_TASKS: Omit<Task, "id">[] = [
  {
    title: "Rotate exposed credentials — Supabase, dashboard, Telegram, API, system",
    area: "Work", time: "1 hour", priority: "critical", done: false,
    dueDate: "2026-06-14", status: "open", riskFlag: true,
    nextAction: "Rotate each credential and remove from email threads",
  },
  {
    title: "Confirm SARS eFiling instalment application submitted and save proof",
    area: "Money", time: "30 min", priority: "critical", done: false,
    dueDate: "2026-06-14", status: "open",
    nextAction: "Check eFiling portal and download written confirmation",
  },
  {
    title: "Track SARS cases — confirm no collection steps while arrangement pending",
    area: "Money", time: "30 min", priority: "critical", done: false,
    dueDate: "2026-06-17", status: "open",
    nextAction: "Request written confirmation — Case 569094513 / 579425427",
  },
  {
    title: "Pay or query Register Domain SA hosting invoice — mjwgroup.co.za (R229)",
    area: "Money", time: "15 min", priority: "high", done: false,
    dueDate: "2026-06-14", status: "open",
    nextAction: "Log in to Register Domain SA and pay Invoice 1481316",
  },
  {
    title: "Decide: renew or cancel Claude Pro — payment failed (R399.99)",
    area: "Personal", time: "15 min", priority: "high", done: false,
    dueDate: "2026-06-15", status: "open",
  },
  {
    title: "Decide: renew or cancel Suno — payment failed, fix by 15 Jun (R189.99)",
    area: "Personal", time: "15 min", priority: "high", done: false,
    dueDate: "2026-06-15", status: "open",
  },
  {
    title: "Decide: renew or cancel YouTube Premium Family — suspended (R149.99)",
    area: "Personal", time: "15 min", priority: "medium", done: false,
    dueDate: "2026-06-14", status: "open",
  },
  {
    title: "Download Notion export before link expires (~21 Jun)",
    area: "Personal", time: "15 min", priority: "high", done: false,
    dueDate: "2026-06-21", status: "open",
    nextAction: "Open export email and download the zip file",
  },
  {
    title: "Follow up Master of High Court Cape Town — estate process guidance",
    area: "Personal", time: "1 hour", priority: "high", done: false,
    dueDate: "2026-06-18", status: "open",
    nextAction: "Call/email Master to confirm estate number, documents, and appointment process",
  },
  {
    title: "Follow up SARS deceased-estate complaint — request case worker allocation",
    area: "Personal", time: "30 min", priority: "high", done: false,
    dueDate: "2026-06-18", status: "open",
    nextAction: "Reference estate risk notification and deceased-estate tax profile",
  },
  {
    title: "Confirm next Tyger Valley appointment after cancellation",
    area: "Health", time: "15 min", priority: "medium", done: false,
    dueDate: "2026-06-20", status: "open",
  },
  {
    title: "Pay, query, or arrange FD on Call — personal statement (R6,181.26 overdue)",
    area: "Money", time: "30 min", priority: "medium", done: false,
    dueDate: "2026-06-20", status: "open",
  },
  {
    title: "Pay, query, or arrange FD on Call — MJW Business Solutions (R3,451.25 overdue)",
    area: "Money", time: "30 min", priority: "medium", done: false,
    dueDate: "2026-06-20", status: "open",
  },
  {
    title: "Pay or query Aquazania — arrears and current due (R4,511.84 total)",
    area: "Money", time: "30 min", priority: "medium", done: false,
    dueDate: "2026-06-30", status: "open",
    nextAction: "Contact Aquazania and arrange payment on account C010308",
  },
  {
    title: "Export SilverCloud data before account expires (20 Jun)",
    area: "Health", time: "30 min", priority: "medium", done: false,
    dueDate: "2026-06-20", status: "open",
    nextAction: "Log in and download any data or notes before account closes",
  },
  {
    title: "Clear or upgrade Microsoft OneDrive storage — full, files not saving",
    area: "Personal", time: "30 min", priority: "medium", done: false,
    dueDate: "2026-06-30", status: "open",
  },
  {
    title: "Clear or upgrade Dropbox — 81% used, sync risk",
    area: "Personal", time: "30 min", priority: "low", done: false,
    dueDate: "2026-06-30", status: "open",
  },
  {
    title: "Prince daily care log — wound flush, meds, observations",
    area: "Health", time: "30 min", priority: "high", done: false,
    status: "open",
    nextAction: "Record today: flush done, symptoms, meds, appetite, next vet action",
  },
  {
    title: "Confirm Prince next vet review date and future scan timing",
    area: "Health", time: "15 min", priority: "medium", done: false,
    status: "open",
  },
  {
    title: "Monitor Copytype CPA dispute response (R2,834.58 — do not pay unless outcome requires)",
    area: "Personal", time: "15 min", priority: "medium", done: false,
    dueDate: "2026-06-20", status: "paused",
    nextAction: "Escalate only if Copytype continues pursuing — account S645",
  },
  {
    title: "Follow up KDP clarification — revise caregiver book when capacity allows",
    area: "Personal", time: "1 hour", priority: "low", done: false,
    status: "paused",
    nextAction: "Wait for or follow up KDP response — title ID 66241537",
  },
];

/* ── Habits (PER-HABIT-001 to PER-HABIT-008) ──────────────────────── */
export const IMPORT_HABITS: Omit<Habit, "id">[] = [
  { name: "Daily command review", detail: "Select top 3 focus items at start of day", goal: "Top 3 selected every morning", color: "coral", done: false, streak: 0 },
  { name: "Gmail-to-task capture", detail: "Convert important emails to tasks by end of day", goal: "No important emails left unactioned", color: "green", done: false, streak: 0 },
  { name: "Money exposure check", detail: "Review overdue items, failed payments, upcoming debits", goal: "All money items checked", color: "gold", done: false, streak: 0 },
  { name: "Prince care log", detail: "Flush, meds, observations, wound notes, appetite", goal: "Daily care record complete", color: "purple", done: false, streak: 0 },
  { name: "Tomorrow priority lock", detail: "Select next day top 3 before bed", goal: "Next day top 3 locked each evening", color: "blue", done: false, streak: 0 },
  { name: "Credential & security review", detail: "Check passwords, 2FA, exposed credentials weekly", goal: "All credentials reviewed", color: "red", done: false, streak: 0 },
  { name: "SARS & estate follow-up review", detail: "Update case status and next action weekly", goal: "Case status kept current", color: "orange", done: false, streak: 0 },
  { name: "Storage cleanup review", detail: "Keep OneDrive and Dropbox under control monthly", goal: "Storage issues cleared", color: "teal", done: false, streak: 0 },
];

/* ── Projects (PER-PROJ-001 to PER-PROJ-009) ──────────────────────── */
export const IMPORT_PROJECTS: Omit<Project, "id">[] = [
  {
    name: "MJW Signal", description: "Private command dashboard — tasks, habits, money, projects, people, dates, daily focus",
    color: "coral", status: "active", tasks: [],
    goals: [
      { id: 1, title: "Lock product naming and import Personal register", done: false },
      { id: 2, title: "All 6 modules active and populated", done: false },
    ],
  },
  {
    name: "MJW Signal Security", description: "Protect private dashboard accounts, credentials, and integrations",
    color: "red", status: "active", tasks: [],
    goals: [
      { id: 1, title: "Rotate all exposed credentials", done: false },
      { id: 2, title: "Create and maintain security register", done: false },
    ],
  },
  {
    name: "SARS Personal Tax", description: "Secure written instalment arrangement — R73,125.47. Cases 569094513 & 579425427",
    color: "orange", status: "active", tasks: [],
    goals: [
      { id: 1, title: "Confirm eFiling proof received", done: false },
      { id: 2, title: "Receive written SARS acceptance of arrangement", done: false },
      { id: 3, title: "No collection steps taken while arrangement pending", done: false },
    ],
  },
  {
    name: "Estate — Johannes Oswald Walters", description: "Regularise estate reporting, executor process, GEPF/funeral claim, SARS deceased-estate risk",
    color: "purple", status: "active", tasks: [],
    goals: [
      { id: 1, title: "Confirm estate number with Master of High Court", done: false },
      { id: 2, title: "Document next legal step and timeline", done: false },
      { id: 3, title: "SARS deceased-estate case worker allocated", done: false },
    ],
  },
  {
    name: "Prince Medical", description: "Post-operative wound care, cancer follow-up, infection status, vet reviews and costs",
    color: "green", status: "active", tasks: [],
    goals: [
      { id: 1, title: "Daily care log maintained", done: false },
      { id: 2, title: "Next vet review date confirmed", done: false },
    ],
  },
  {
    name: "Personal Cashflow Stabilisation", description: "Control overdue payments, failed subscriptions, cash-flow commitments — min exposure R88,238.79",
    color: "gold", status: "active", tasks: [],
    goals: [
      { id: 1, title: "Every overdue account paid, cancelled, arranged, or disputed", done: false },
      { id: 2, title: "SARS arrangement confirmed", done: false },
    ],
  },
  {
    name: "MJW Music / Creative", description: "Keep music subscriptions, files, and release workflow stable",
    color: "purple", status: "active", tasks: [],
    goals: [
      { id: 1, title: "Decide on Suno renewal", done: false },
      { id: 2, title: "Storage cleanup complete", done: false },
    ],
  },
  {
    name: "Digital Storage Control", description: "Prevent OneDrive/Dropbox storage blocks interrupting file access and backups",
    color: "blue", status: "active", tasks: [],
    goals: [
      { id: 1, title: "OneDrive storage resolved", done: false },
      { id: 2, title: "Dropbox under 70% used", done: false },
    ],
  },
  {
    name: "Caregiver Command Book / KDP", description: "Revise and resubmit caregiver book after KDP clarification — title ID 66241537",
    color: "teal", status: "paused", tasks: [],
    goals: [
      { id: 1, title: "Receive KDP clarification response", done: false },
      { id: 2, title: "Revise and resubmit when capacity allows", done: false },
    ],
  },
];

/* ── Money additions ────────────────────────────────────────────────── */
/* Call applyMoneyImport(existingMoney) to get an updated MoneyData.    */
export function applyMoneyImport(existing: MoneyData): MoneyData {
  const base = Date.now();
  const newLoans = [
    {
      id: base + 1, name: "SARS Personal Tax (arrangement pending)",
      totalAmount: 73125.47, balance: 73125.47, interestRate: 0,
      monthlyPayment: 9400, dueDay: 25,
    },
    {
      id: base + 2, name: "FD on Call — Mornay Walters",
      totalAmount: 6181.26, balance: 6181.26, interestRate: 0,
      monthlyPayment: 0, dueDay: 20,
    },
    {
      id: base + 3, name: "FD on Call — MJW Business Solutions",
      totalAmount: 3451.25, balance: 3451.25, interestRate: 0,
      monthlyPayment: 0, dueDay: 20,
    },
  ];

  const newExpenses = [
    { id: base + 10, name: "Aquazania arrears (account C010308)", amount: 1395.34, category: "Utilities", date: "2026-06-30", recurring: false },
    { id: base + 11, name: "Aquazania current due", amount: 3116.50, category: "Utilities", date: "2026-06-30", recurring: true, frequency: "monthly" as const },
    { id: base + 12, name: "Register Domain SA — mjwgroup.co.za hosting", amount: 229.00, category: "Hosting", date: "2026-06-04", recurring: true, frequency: "monthly" as const },
    { id: base + 13, name: "YouTube Premium Family", amount: 149.99, category: "Subscriptions", date: "2026-06-14", recurring: true, frequency: "monthly" as const },
    { id: base + 14, name: "Claude Pro", amount: 399.99, category: "Subscriptions", date: "2026-06-15", recurring: true, frequency: "monthly" as const },
    { id: base + 15, name: "Suno", amount: 189.99, category: "Subscriptions", date: "2026-06-15", recurring: true, frequency: "monthly" as const },
  ];

  // Deduplicate by name to avoid re-running import twice
  const existingLoanNames = new Set((existing.loans ?? []).map((l) => l.name));
  const existingExpenseNames = new Set(existing.expenses.map((e) => e.name));

  return {
    ...existing,
    loans: [...(existing.loans ?? []), ...newLoans.filter((l) => !existingLoanNames.has(l.name))],
    expenses: [...existing.expenses, ...newExpenses.filter((e) => !existingExpenseNames.has(e.name))],
  };
}
