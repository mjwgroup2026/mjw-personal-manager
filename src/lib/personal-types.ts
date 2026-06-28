// Personal life management types for Ledgera

export type TaskStatus = "open" | "paused" | "done" | "archived";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskArea = "Personal" | "Work" | "Health" | "Money" | "Home" | "Learning" | "Other";
export type TaskEffort = "light" | "medium" | "heavy";

export interface Task {
  id: string;
  title: string;
  area: TaskArea;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string; // ISO date string
  timeEstimate?: number; // minutes
  effort?: TaskEffort;
  nextAction?: string;
  createdAt: string;
  updatedAt: string;
}

export type HabitColor = "coral" | "blue" | "purple" | "green" | "orange";

export interface Habit {
  id: string;
  name: string;
  detail?: string; // e.g. "30 min"
  color: HabitColor;
  streak: number;
  doneToday: boolean;
  createdAt: string;
}

export type JournalMood = "great" | "good" | "okay" | "tough";

export interface JournalEntry {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  content: string;
  mood?: JournalMood;
  createdAt: string;
  updatedAt: string;
}

export interface MoneyAccount {
  id: string;
  name: string;
  balance: number;
  currency?: string;
}

export interface MoneyData {
  accounts: MoneyAccount[];
  salary?: number; // monthly net
  spendingPressure?: number; // 0-100
}

export type ProjectStatus = "active" | "paused" | "done";

export interface ProjectTask {
  id: string;
  title: string;
  done: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string; // hex or color name
  status: ProjectStatus;
  tasks: ProjectTask[];
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  name: string;
  relation?: string;
  phone?: string;
  email?: string;
  birthday?: string; // ISO date string YYYY-MM-DD
  notes?: string;
  color?: string; // for avatar background
  createdAt: string;
}

export type EventType = "appointment" | "deadline" | "reminder" | "birthday" | "other";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  time?: string; // HH:MM
  type: EventType;
  description?: string;
  allDay: boolean;
  createdAt: string;
}

export interface DocumentMeta {
  id: string;
  name: string;
  category?: string;
  url?: string;
  notes?: string;
  createdAt: string;
}

export interface MedicationScheduleTime {
  time: string; // HH:MM
}

export interface Medication {
  id: string;
  name: string;
  dosage?: string;
  instructions?: string;
  scheduleTimes: string[]; // array of HH:MM strings
  startDate?: string;
  endDate?: string;
  active: boolean;
  createdAt: string;
}

export type MedicationLogStatus = "taken" | "skipped" | "snoozed";

export interface MedicationLog {
  id: string;
  medicationId: string;
  date: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  status: MedicationLogStatus;
  loggedAt: string; // ISO datetime
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship?: string;
  phone?: string;
  email?: string;
}

export type HealthReadingType =
  | "blood_sugar"
  | "bp"
  | "weight"
  | "hba1c"
  | "cholesterol"
  | "heart_rate"
  | "sleep"
  | "mood"
  | "peak_flow";

export interface HealthReading {
  id: string;
  type: HealthReadingType;
  value: number;
  value2?: number; // e.g. diastolic BP
  unit?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  notes?: string;
  createdAt: string;
}

export interface HealthProfile {
  fullName?: string;
  dateOfBirth?: string;
  idNumber?: string;
  gender?: string;
  bloodType?: string;
  organDonor?: boolean;
  clinicalSummary?: string;
  conditions?: string[];
  allergies?: string[];
}

export interface MedicalAid {
  scheme?: string;
  plan?: string;
  memberNumber?: string;
  principalMember?: string;
  authLine?: string;
  emergencyLine?: string;
}

export interface HealthData {
  profile: HealthProfile;
  medicalAid: MedicalAid;
  readings: HealthReading[];
  emergencyContacts: EmergencyContact[];
}
