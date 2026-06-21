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

export type Medication = {
  id: number;
  name: string;
  dosage: string;
  instructions: string;
  scheduleTimes: string[];   // ["08:00", "20:00"]
  startDate: string;
  endDate?: string;
  refillDate?: string;
  prescribingDoctor?: string;
  pharmacy?: string;
  active: boolean;
  color: string;
};

export type MedicationLog = {
  id: number;
  medicationId: number;
  scheduledTime: string;     // "HH:MM"
  date: string;              // YYYY-MM-DD
  status: "taken" | "skipped" | "missed" | "snoozed";
  takenAt?: string;
  notes?: string;
};

export type Reminder = {
  id: number;
  text: string;
  date: string;
};

/* ─── Health Hub ─────────────────────────────────────────────────── */

export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "";

export type HealthEmergencyContact = {
  id: number;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
};

export type HealthDoctor = {
  id: number;
  name: string;
  specialty: string;
  phone: string;
  practiceNumber?: string;
  hospital?: string;
};

export type HealthProfile = {
  fullName: string;
  dateOfBirth: string;
  idNumber: string;
  gender: "male" | "female" | "other" | "";
  bloodType: BloodType;
  organDonor: boolean;
  clinicalSummary: string;
  conditions: string[];
  allergies: string[];
  emergencyContacts: HealthEmergencyContact[];
  doctors: HealthDoctor[];
  lastVerified: string;
};

export type MedicalAidDetails = {
  scheme: string;
  plan: string;
  memberNumber: string;
  principalMember: string;
  dependantCode?: string;
  authLine?: string;
  emergencyLine?: string;
  hospitalNetwork?: string;
};

export type ReadingType =
  | "blood_sugar" | "bp" | "weight" | "hba1c"
  | "cholesterol" | "heart_rate" | "sleep" | "mood" | "peak_flow";

export type HealthReading = {
  id: number;
  type: ReadingType;
  value: number;
  value2?: number;   // diastolic for BP
  unit: string;
  date: string;      // YYYY-MM-DD
  time: string;      // HH:MM
  notes?: string;
};

export type Prescription = {
  id: number;
  medicationName: string;
  dosage: string;
  doctor: string;
  issuedDate: string;
  validUntil?: string;
  repeats?: number;
  repeatsUsed?: number;
  pharmacy?: string;
  notes?: string;
};

export type LegacyPolicyType = "life" | "medical" | "funeral" | "vehicle" | "home" | "disability" | "investment" | "other";

export type LegacyPolicy = {
  id: number;
  name: string;
  type: LegacyPolicyType;
  insurer: string;
  policyNumber: string;
  beneficiary?: string;
  contact?: string;
  premiumAmount?: number;
  notes?: string;
};

export type LegacyWishSection =
  | "funeral" | "medical_directive" | "personal_message"
  | "will_location" | "executor" | "digital_assets" | "other";

export type LegacyWish = {
  id: number;
  section: LegacyWishSection;
  title: string;
  content: string;
  updatedAt: string;
};

export type LegacyAccess = {
  pin: string;
  trustedName: string;
  trustedPhone: string;
  trustedEmail?: string;
  grantedSections: ("emergency_card" | "policies" | "wishes" | "medications")[];
  message?: string;
};

export type HealthData = {
  profile: HealthProfile;
  medicalAid: MedicalAidDetails;
  readings: HealthReading[];
  prescriptions: Prescription[];
  policies: LegacyPolicy[];
  wishes: LegacyWish[];
  legacyAccess?: LegacyAccess;
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
