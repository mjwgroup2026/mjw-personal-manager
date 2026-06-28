import { useState, useEffect } from "react";
import type {
  Task,
  Habit,
  JournalEntry,
  MoneyData,
  Project,
  Person,
  CalendarEvent,
  Medication,
  MedicationLog,
  HealthData,
} from "@/lib/personal-types";

const STORAGE_KEY = "ledgera_personal_data";

interface PersonalDataStore {
  tasks: Task[];
  habits: Habit[];
  journal: JournalEntry[];
  money: MoneyData;
  projects: Project[];
  people: Person[];
  calendarEvents: CalendarEvent[];
  medications: Medication[];
  medicationLogs: MedicationLog[];
  health: HealthData;
}

const defaultData: PersonalDataStore = {
  tasks: [],
  habits: [],
  journal: [],
  money: { accounts: [], salary: 0, spendingPressure: 0 },
  projects: [],
  people: [],
  calendarEvents: [],
  medications: [],
  medicationLogs: [],
  health: {
    profile: {},
    medicalAid: {},
    readings: [],
    emergencyContacts: [],
  },
};

function loadFromStorage(): PersonalDataStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    return { ...defaultData, ...JSON.parse(raw) };
  } catch {
    return defaultData;
  }
}

function saveToStorage(data: PersonalDataStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function usePersonalData() {
  const [store, setStore] = useState<PersonalDataStore>(() => loadFromStorage());

  useEffect(() => {
    saveToStorage(store);
  }, [store]);

  const setter =
    <K extends keyof PersonalDataStore>(key: K) =>
    (value: PersonalDataStore[K] | ((prev: PersonalDataStore[K]) => PersonalDataStore[K])) => {
      setStore((prev) => ({
        ...prev,
        [key]:
          typeof value === "function"
            ? (value as (prev: PersonalDataStore[K]) => PersonalDataStore[K])(prev[key])
            : value,
      }));
    };

  return {
    tasks: store.tasks,
    setTasks: setter("tasks"),
    habits: store.habits,
    setHabits: setter("habits"),
    journal: store.journal,
    setJournal: setter("journal"),
    money: store.money,
    setMoney: setter("money"),
    projects: store.projects,
    setProjects: setter("projects"),
    people: store.people,
    setPeople: setter("people"),
    calendarEvents: store.calendarEvents,
    setCalendarEvents: setter("calendarEvents"),
    medications: store.medications,
    setMedications: setter("medications"),
    medicationLogs: store.medicationLogs,
    setMedicationLogs: setter("medicationLogs"),
    health: store.health,
    setHealth: setter("health"),
  };
}
