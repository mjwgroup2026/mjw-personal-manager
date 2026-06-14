export type Priority = "critical" | "high" | "medium" | "low";

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

export type MoneyData = {
  salary: number;
  salaryDay: number;
  accounts: BankAccount[];
  expenses: Expense[];
  loans: Loan[];
  goals: FinancialGoal[];
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
