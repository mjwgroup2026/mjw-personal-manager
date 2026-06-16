export type Priority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "open" | "paused" | "archived";
export type EffortLevel = "light" | "medium" | "heavy";

export type Task = {
  id: number;
  title: string;
  area: string;
  time: string;
  priority: Priority;
  done: boolean;
  dueDate?: string;       // ISO date YYYY-MM-DD
  scheduledDate?: string; // ISO date YYYY-MM-DD
  nextAction?: string;
  status?: TaskStatus;    // undefined = open (backward compat)
  effort?: EffortLevel;
  riskFlag?: boolean;
};

export type Habit = {
  id: number;
  name: string;
  detail: string;
  goal: string;
  color: string;
  done: boolean;
  streak: number;
};

export type JournalEntry = {
  id: number;
  date: string; // ISO date string YYYY-MM-DD
  content: string;
  mood: "great" | "good" | "okay" | "tough" | "";
};

export type BankAccount = {
  id: number;
  name: string;
  type: "cheque" | "savings" | "credit" | "investment" | "cash";
  balance: number;
};

export type Expense = {
  id: number;
  name: string;
  amount: number;
  category: string;
  date: string;
  recurring: boolean;
  frequency?: "daily" | "weekly" | "monthly" | "yearly";
  accountId?: number;
};

export type Loan = {
  id: number;
  name: string;
  totalAmount: number;
  balance: number;
  interestRate: number;
  monthlyPayment: number;
  dueDay: number;
};

export type FinancialGoal = {
  id: number;
  name: string;
  target: number;
  saved: number;
  deadline: string;
  color: string;
};

export type MoneyPayment = {
  id: number;
  expenseId: number;
  period: string;        // "YYYY-MM"
  paid: boolean;
  paidDate?: string;
  paidAccountId?: number;
  amount: number;        // snapshot at time of payment
};

export type ArchivedExpense = Expense & { period: string };

export type MoneyData = {
  salary: number;
  salaryDay: number;
  accounts: BankAccount[];
  expenses: Expense[];
  loans: Loan[];
  goals: FinancialGoal[];
  currentPeriod?: string;          // "YYYY-MM", defaults to current month
  payments?: MoneyPayment[];
  archivedExpenses?: ArchivedExpense[];
};

export type ProjectTask = {
  id: number;
  title: string;
  done: boolean;
};

export type ProjectGoal = {
  id: number;
  title: string;
  done: boolean;
};

export type Project = {
  id: number;
  name: string;
  description: string;
  color: string;
  status: "active" | "paused" | "done";
  tasks: ProjectTask[];
  goals: ProjectGoal[];
};

export type CalendarEvent = {
  id: number;
  title: string;
  date: string;          // ISO YYYY-MM-DD
  time?: string;         // HH:MM (optional)
  type: "appointment" | "deadline" | "reminder" | "birthday" | "other";
  description?: string;
  allDay?: boolean;
};

export type DocumentMeta = {
  id: number;
  name: string;          // user-editable display name
  fileName: string;      // original file name
  storagePath: string;   // path in Supabase Storage bucket
  size: number;          // bytes
  mimeType: string;
  category: string;
  notes: string;
  uploadedAt: string;    // ISO date
};

export type Reminder = {
  id: number;
  text: string;
  date: string;
};

export type Person = {
  id: number;
  name: string;
  initials: string;
  relation: string;
  phone: string;
  email: string;
  birthday: string;
  notes: string;
  color: string;
  reminders: Reminder[];
};
