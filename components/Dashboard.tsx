"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Flame,
  FolderKanban,
  Home,
  ListTodo,
  LogOut,
  Menu,
  Moon,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
  Target,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import type { Habit, JournalEntry, MoneyData, Person, Priority, Project, Task } from "@/lib/types";
import { useUserData } from "@/lib/useUserData";
import MjwLogo from "./MjwLogo";
import { HabitsSection } from "./sections/HabitsSection";
import { JournalSection } from "./sections/JournalSection";
import { MoneySection } from "./sections/MoneySection";
import { PeopleSection } from "./sections/PeopleSection";
import { ProjectsSection } from "./sections/ProjectsSection";
import { SettingsSection } from "./sections/SettingsSection";
import { TasksSection } from "./sections/TasksSection";

type View = "today" | "tasks" | "habits" | "journal" | "money" | "projects" | "people" | "settings";
type QuickAddType = "task" | "habit" | "journal" | "money" | "project" | "person";
type QuickFields = {
  title: string; area: string; time: string; priority: Priority; dueDate: string;
  detail: string; color: string; note: string; amount: string; category: string;
  description: string; relation: string; notes: string;
  status: "open" | "paused" | "archived"; effort: "light" | "medium" | "heavy";
};
const DEFAULT_QUICK_FIELDS: QuickFields = {
  title: "", area: "Personal", time: "15 min", priority: "medium", dueDate: "",
  detail: "", color: "coral", note: "", amount: "", category: "Groceries",
  description: "", relation: "", notes: "", status: "open", effort: "medium",
};

const DEFAULT_TASKS: Task[] = [
  { id: 1, title: "Plan the week ahead", area: "Personal", time: "15 min", priority: "high", done: false, dueDate: new Date().toISOString().split("T")[0], nextAction: "Open calendar and block focus time" },
  { id: 2, title: "Review monthly spending", area: "Money", time: "20 min", priority: "medium", done: false },
  { id: 3, title: "Send project follow-up", area: "Work", time: "10 min", priority: "medium", done: true },
  { id: 4, title: "Book annual check-up", area: "Health", time: "5 min", priority: "low", done: false },
];

const DEFAULT_HABITS: Habit[] = [
  { id: 1, name: "Move", detail: "30 min", goal: "Run 5km by August", done: true, color: "coral", streak: 4 },
  { id: 2, name: "Read", detail: "20 pages", goal: "", done: true, color: "blue", streak: 12 },
  { id: 3, name: "Reflect", detail: "5 min", goal: "", done: false, color: "purple", streak: 3 },
  { id: 4, name: "Water", detail: "2 litres", goal: "", done: true, color: "green", streak: 7 },
];

const DEFAULT_MONEY: MoneyData = {
  salary: 31500,
  salaryDay: 25,
  accounts: [
    { id: 1, name: "FNB Cheque", type: "cheque", balance: 42680 },
    { id: 2, name: "FNB Savings", type: "savings", balance: 18200 },
  ],
  expenses: [
    { id: 1, name: "Woolworths", amount: 1240, category: "Groceries", date: new Date().toISOString().split("T")[0], recurring: false },
    { id: 2, name: "Rent", amount: 7800, category: "Rent", date: new Date().toISOString().split("T")[0], recurring: true, frequency: "monthly" },
    { id: 3, name: "Spotify", amount: 119, category: "Subscription", date: new Date().toISOString().split("T")[0], recurring: true, frequency: "monthly" },
  ],
  loans: [],
  goals: [{ id: 1, name: "Emergency fund", target: 50000, saved: 18200, deadline: "2026-12-31", color: "green" }],
};

const DEFAULT_PROJECTS: Project[] = [
  { id: 1, name: "Personal dashboard", description: "Build a calm, useful home for the moving parts of life.", color: "coral", status: "active", tasks: [{ id: 1, title: "Build auth system", done: true }, { id: 2, title: "Add money tracker", done: false }], goals: [{ id: 1, title: "Live on Vercel", done: false }] },
  { id: 2, name: "Winter reset", description: "Return to a sustainable movement and sleep routine.", color: "green", status: "active", tasks: [{ id: 3, title: "30 min walk daily", done: true }, { id: 4, title: "Sleep by 10pm", done: false }], goals: [{ id: 2, title: "8kg weight loss", done: false }] },
];

const DEFAULT_PEOPLE: Person[] = [
  { id: 1, name: "Liam Williams", initials: "LW", relation: "Friend", phone: "", email: "", birthday: "", notes: "Birthday in 3 days", color: "purple", reminders: [] },
  { id: 2, name: "Anele Khumalo", initials: "AK", relation: "Work", phone: "", email: "", birthday: "", notes: "Follow up this week", color: "green", reminders: [] },
];

const navItems: { id: View; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "today", label: "Today", icon: Home },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "habits", label: "Habits", icon: Flame },
  { id: "journal", label: "Journal", icon: BookOpen },
  { id: "money", label: "Money", icon: WalletCards },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "people", label: "People", icon: Users },
];

const sparkline = "0,34 18,31 36,32 54,22 72,25 90,14 108,18 126,8 144,11 162,4";

export default function Dashboard() {
  const { data: session } = useSession();
  const username = (session?.user as { username?: string })?.username ?? "user";
  const sessionName = session?.user?.name ?? "there";

  const ns = (k: string) => `${username}:${k}`;

  const [view, setView] = useState<View>("today");
  const [tasks, setTasks] = useUserData<Task[]>(ns("tasks"), "tasks", DEFAULT_TASKS);
  const [habits, setHabits] = useUserData<Habit[]>(ns("habits"), "habits", DEFAULT_HABITS);
  const [journal, setJournal] = useUserData<JournalEntry[]>(ns("journal"), "journal", []);
  const [money, setMoney] = useUserData<MoneyData>(ns("money"), "money", DEFAULT_MONEY);
  const [projects, setProjects] = useUserData<Project[]>(ns("projects"), "projects", DEFAULT_PROJECTS);
  const [people, setPeople] = useUserData<Person[]>(ns("people"), "people", DEFAULT_PEOPLE);
  const [dark, setDark] = useUserData<boolean>(ns("dark"), "dark", false);
  // Display name stored independently so user can edit it
  const [displayName, setDisplayName] = useUserData<string>(ns("display_name"), "display_name", sessionName);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<QuickAddType>("task");
  const [quickFields, setQuickFields] = useState<QuickFields>(DEFAULT_QUICK_FIELDS);
  const [toast, setToast] = useState("");

  // Keep display name in sync with session name on first load if not yet customised
  useEffect(() => {
    if (displayName === "there" && sessionName !== "there") setDisplayName(sessionName);
  }, [sessionName]);

  const doneTasks = tasks.filter((t) => t.done).length;
  const doneHabits = habits.filter((h) => h.done).length;
  const progress = tasks.length + habits.length
    ? Math.round(((doneTasks + doneHabits) / (tasks.length + habits.length)) * 100)
    : 0;

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const displayDate = useMemo(
    () => new Intl.DateTimeFormat("en-ZA", { weekday: "long", day: "numeric", month: "long" }).format(new Date()),
    []
  );

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(t);
  }, [toast]);

  function selectView(next: View) { setView(next); setSidebarOpen(false); }
  function showToast(msg: string) { setToast(msg); }

  function closeQuickAdd() {
    setQuickAddOpen(false);
    setQuickFields(DEFAULT_QUICK_FIELDS);
    setQuickAddType("task");
  }

  function moveToTomorrow(taskId: number) {
    const d = new Date(); d.setDate(d.getDate() + 1);
    const tStr = d.toISOString().split("T")[0];
    setTasks(tasks.map((t) => t.id === taskId ? { ...t, scheduledDate: tStr } : t));
    showToast("Moved to tomorrow");
  }

  function handleQuickAdd(e: FormEvent) {
    e.preventDefault();
    const today = new Date().toISOString().split("T")[0];
    const qf = quickFields;
    switch (quickAddType) {
      case "task":
        if (!qf.title.trim()) return;
        setTasks([...tasks, { id: Date.now(), title: qf.title.trim(), area: qf.area, time: qf.time, priority: qf.priority, done: false, status: qf.status as "open" | "paused" | "archived", effort: qf.effort as "light" | "medium" | "heavy", dueDate: qf.dueDate || undefined }]);
        showToast("Task added");
        break;
      case "habit":
        if (!qf.title.trim()) return;
        setHabits([...habits, { id: Date.now(), name: qf.title.trim(), detail: qf.detail, goal: "", done: false, color: qf.color, streak: 0 }]);
        showToast("Habit added");
        break;
      case "journal": {
        if (!qf.note.trim()) return;
        const existing = journal.find((e) => e.date === today);
        if (existing) {
          setJournal(journal.map((e) => e.date === today ? { ...e, content: e.content + "\n\n" + qf.note.trim() } : e));
        } else {
          setJournal([...journal, { id: Date.now(), date: today, content: qf.note.trim(), mood: "" }]);
        }
        showToast("Journal note saved");
        break;
      }
      case "money":
        if (!qf.title.trim()) return;
        setMoney({ ...money, expenses: [...money.expenses, { id: Date.now(), name: qf.title.trim(), amount: parseFloat(qf.amount) || 0, category: qf.category, date: today, recurring: false }] });
        showToast("Expense added");
        break;
      case "project":
        if (!qf.title.trim()) return;
        setProjects([...projects, { id: Date.now(), name: qf.title.trim(), description: qf.description, color: "coral", status: "active", tasks: [], goals: [] }]);
        showToast("Project added");
        break;
      case "person": {
        if (!qf.title.trim()) return;
        const initials = qf.title.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
        setPeople([...people, { id: Date.now(), name: qf.title.trim(), initials, relation: qf.relation, phone: "", email: "", birthday: "", notes: qf.notes, color: "blue", reminders: [] }]);
        showToast("Person added");
        break;
      }
    }
    closeQuickAdd();
  }

  function resetAllData() {
    setTasks(DEFAULT_TASKS);
    setHabits(DEFAULT_HABITS);
    setJournal([]);
    setMoney(DEFAULT_MONEY);
    setProjects(DEFAULT_PROJECTS);
    setPeople(DEFAULT_PEOPLE);
  }

  const openTaskCount = tasks.filter((t) => !t.done).length;
  const firstName = displayName.split(" ")[0];

  return (
    <div className={dark ? "app dark" : "app"}>
      <aside className={sidebarOpen ? "sidebar open" : "sidebar"}>
        <div className="brand-row">
          <button className="brand" onClick={() => selectView("today")} aria-label="Go home">
            <MjwLogo size={30} />
            <span style={{ fontSize: 13, letterSpacing: "-.2px", fontWeight: 700 }}>MJW Signal</span>
          </button>
          <button className="icon-btn mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={19} />
          </button>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <p className="nav-label">Your space</p>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={view === id ? "nav-item active" : "nav-item"} onClick={() => selectView(id)}>
              <Icon size={18} />
              <span>{label}</span>
              {id === "tasks" && openTaskCount > 0 && <span className="nav-count">{openTaskCount}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <button onClick={() => selectView("settings")} className={view === "settings" ? "nav-item active" : "nav-item"}>
          <Settings size={18} /><span>Settings</span>
        </button>
        <button className="nav-item" onClick={() => signOut({ callbackUrl: "/login" })} style={{ color: "var(--muted)" }}>
          <LogOut size={18} /><span>Sign out</span>
        </button>
        <div className="profile-card" style={{ paddingTop: 14 }}>
          <span className="profile-copy">
            <strong>{displayName}</strong>
            <small>MJW Signal</small>
          </span>
          <MoreHorizontal size={18} />
        </div>
      </aside>

      {sidebarOpen && <button className="scrim" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}

      <main className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="search-box">
            <Search size={18} />
            <input aria-label="Search" placeholder="Search anything..." />
            <kbd>Ctrl K</kbd>
          </div>
          <div className="top-actions">
            <button className="icon-btn" onClick={() => setDark(!dark)} aria-label="Toggle theme">
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button className="icon-btn notification" onClick={() => showToast("You are all caught up")} aria-label="Notifications">
              <Bell size={19} /><span />
            </button>
            <button className="primary-btn" onClick={() => setQuickAddOpen(true)}>
              <Plus size={17} /><span>Quick add</span>
            </button>
          </div>
        </header>

        <div className="content">
          {view === "today" && (
            <TodayView
              greeting={greeting}
              displayDate={displayDate}
              firstName={firstName}
              tasks={tasks}
              habits={habits}
              journal={journal}
              projects={projects}
              people={people}
              progress={progress}
              doneTasks={doneTasks}
              doneHabits={doneHabits}
              onToggleTask={(id) => setTasks(tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t))}
              onToggleHabit={(id) => setHabits(habits.map((h) => h.id === id ? { ...h, done: !h.done } : h))}
              onNavigate={selectView}
              onAdd={() => setQuickAddOpen(true)}
              onMoveToTomorrow={moveToTomorrow}
              money={money}
            />
          )}
          {view === "tasks" && <TasksSection tasks={tasks} onChange={setTasks} onToast={showToast} />}
          {view === "habits" && <HabitsSection habits={habits} onChange={setHabits} onToast={showToast} />}
          {view === "journal" && <JournalSection entries={journal} onChange={setJournal} onToast={showToast} />}
          {view === "money" && <MoneySection data={money} onChange={setMoney} onToast={showToast} />}
          {view === "projects" && <ProjectsSection projects={projects} onChange={setProjects} onToast={showToast} />}
          {view === "people" && <PeopleSection people={people} onChange={setPeople} onToast={showToast} />}
          {view === "settings" && (
            <SettingsSection
              username={username}
              displayName={displayName}
              onToast={showToast}
              onResetData={resetAllData}
              onDisplayNameChange={setDisplayName}
            />
          )}
        </div>
      </main>

      {quickAddOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeQuickAdd}>
          <form className="modal" onSubmit={handleQuickAdd} onMouseDown={(e) => e.stopPropagation()} style={{ width: "min(580px, 100%)" }}>
            <div className="modal-head">
              <div><span className="eyebrow">Quick capture</span><h2>Add to your day</h2></div>
              <button type="button" className="icon-btn" onClick={closeQuickAdd}><X size={19} /></button>
            </div>

            {/* Type tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 22, flexWrap: "wrap" }}>
              {([
                { type: "task" as const, label: "Task", Icon: ListTodo },
                { type: "habit" as const, label: "Habit", Icon: Flame },
                { type: "journal" as const, label: "Journal", Icon: BookOpen },
                { type: "money" as const, label: "Money", Icon: WalletCards },
                { type: "project" as const, label: "Project", Icon: FolderKanban },
                { type: "person" as const, label: "Person", Icon: Users },
              ]).map(({ type, label, Icon }) => (
                <button key={type} type="button" onClick={() => { setQuickAddType(type); setQuickFields(DEFAULT_QUICK_FIELDS); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 13px", borderRadius: 9, border: "1px solid var(--line)", background: quickAddType === type ? "var(--accent)" : "var(--surface-2)", color: quickAddType === type ? "white" : "var(--muted)", fontSize: 11, fontWeight: 680, cursor: "pointer" }}>
                  <Icon size={13} />{label}
                </button>
              ))}
            </div>

            {/* Task */}
            {quickAddType === "task" && (<>
              <label style={{ display: "block", marginBottom: 6, color: "var(--muted)", fontSize: 10, fontWeight: 700 }}>WHAT NEEDS DOING?</label>
              <input autoFocus value={quickFields.title} onChange={(e) => setQuickFields((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Call the dentist"
                style={{ width: "100%", height: 50, padding: "0 14px", border: "1px solid var(--line)", borderRadius: 12, outline: "none", color: "var(--text)", background: "var(--surface-2)", marginBottom: 14 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                {[
                  { label: "AREA", content: <select value={quickFields.area} onChange={(e) => setQuickFields((f) => ({ ...f, area: e.target.value }))} style={{ width: "100%", height: 40, padding: "0 8px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }}>{["Personal","Work","Health","Money","Home","Learning","Other"].map((a) => <option key={a}>{a}</option>)}</select> },
                  { label: "TIME", content: <input value={quickFields.time} onChange={(e) => setQuickFields((f) => ({ ...f, time: e.target.value }))} placeholder="15 min" style={{ width: "100%", height: 40, padding: "0 8px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }} /> },
                  { label: "PRIORITY", content: <select value={quickFields.priority} onChange={(e) => setQuickFields((f) => ({ ...f, priority: e.target.value as Priority }))} style={{ width: "100%", height: 40, padding: "0 8px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }}>{["critical","high","medium","low"].map((p) => <option key={p}>{p}</option>)}</select> },
                  { label: "DUE DATE", content: <input type="date" value={quickFields.dueDate} onChange={(e) => setQuickFields((f) => ({ ...f, dueDate: e.target.value }))} style={{ width: "100%", height: 40, padding: "0 8px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }} /> },
                ].map(({ label, content }) => (
                  <div key={label}><label style={{ display: "block", marginBottom: 5, color: "var(--muted)", fontSize: 10, fontWeight: 700 }}>{label}</label>{content}</div>
                ))}
              </div>
            </>)}

            {/* Habit */}
            {quickAddType === "habit" && (<>
              <label style={{ display: "block", marginBottom: 6, color: "var(--muted)", fontSize: 10, fontWeight: 700 }}>HABIT NAME</label>
              <input autoFocus value={quickFields.title} onChange={(e) => setQuickFields((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Morning walk"
                style={{ width: "100%", height: 50, padding: "0 14px", border: "1px solid var(--line)", borderRadius: 12, outline: "none", color: "var(--text)", background: "var(--surface-2)", marginBottom: 12 }} />
              <label style={{ display: "block", marginBottom: 6, color: "var(--muted)", fontSize: 10, fontWeight: 700 }}>DETAIL</label>
              <input value={quickFields.detail} onChange={(e) => setQuickFields((f) => ({ ...f, detail: e.target.value }))} placeholder="e.g. 30 min"
                style={{ width: "100%", height: 44, padding: "0 14px", border: "1px solid var(--line)", borderRadius: 12, outline: "none", color: "var(--text)", background: "var(--surface-2)" }} />
            </>)}

            {/* Journal */}
            {quickAddType === "journal" && (<>
              <label style={{ display: "block", marginBottom: 6, color: "var(--muted)", fontSize: 10, fontWeight: 700 }}>WHAT'S ON YOUR MIND?</label>
              <textarea autoFocus value={quickFields.note} onChange={(e) => setQuickFields((f) => ({ ...f, note: e.target.value }))} placeholder="A thought, observation, or reflection..."
                style={{ width: "100%", height: 140, padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 12, outline: "none", color: "var(--text)", background: "var(--surface-2)", resize: "vertical", fontFamily: "inherit", fontSize: 13, lineHeight: 1.6 }} />
              <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--muted)" }}>Appended to today's journal entry.</p>
            </>)}

            {/* Money */}
            {quickAddType === "money" && (<>
              <label style={{ display: "block", marginBottom: 6, color: "var(--muted)", fontSize: 10, fontWeight: 700 }}>DESCRIPTION</label>
              <input autoFocus value={quickFields.title} onChange={(e) => setQuickFields((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Grocery run"
                style={{ width: "100%", height: 50, padding: "0 14px", border: "1px solid var(--line)", borderRadius: 12, outline: "none", color: "var(--text)", background: "var(--surface-2)", marginBottom: 12 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={{ display: "block", marginBottom: 5, color: "var(--muted)", fontSize: 10, fontWeight: 700 }}>AMOUNT (R)</label>
                  <input type="number" min="0" step="0.01" value={quickFields.amount} onChange={(e) => setQuickFields((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00"
                    style={{ width: "100%", height: 40, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }} /></div>
                <div><label style={{ display: "block", marginBottom: 5, color: "var(--muted)", fontSize: 10, fontWeight: 700 }}>CATEGORY</label>
                  <select value={quickFields.category} onChange={(e) => setQuickFields((f) => ({ ...f, category: e.target.value }))} style={{ width: "100%", height: 40, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }}>
                    {["Groceries","Rent","Utilities","Transport","Health","Entertainment","Subscription","Clothing","Other"].map((c) => <option key={c}>{c}</option>)}
                  </select></div>
              </div>
            </>)}

            {/* Project */}
            {quickAddType === "project" && (<>
              <label style={{ display: "block", marginBottom: 6, color: "var(--muted)", fontSize: 10, fontWeight: 700 }}>PROJECT NAME</label>
              <input autoFocus value={quickFields.title} onChange={(e) => setQuickFields((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Home renovation"
                style={{ width: "100%", height: 50, padding: "0 14px", border: "1px solid var(--line)", borderRadius: 12, outline: "none", color: "var(--text)", background: "var(--surface-2)", marginBottom: 12 }} />
              <label style={{ display: "block", marginBottom: 6, color: "var(--muted)", fontSize: 10, fontWeight: 700 }}>DESCRIPTION</label>
              <input value={quickFields.description} onChange={(e) => setQuickFields((f) => ({ ...f, description: e.target.value }))} placeholder="What is this project about?"
                style={{ width: "100%", height: 44, padding: "0 14px", border: "1px solid var(--line)", borderRadius: 12, outline: "none", color: "var(--text)", background: "var(--surface-2)" }} />
            </>)}

            {/* Person */}
            {quickAddType === "person" && (<>
              <label style={{ display: "block", marginBottom: 6, color: "var(--muted)", fontSize: 10, fontWeight: 700 }}>NAME</label>
              <input autoFocus value={quickFields.title} onChange={(e) => setQuickFields((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Sarah Johnson"
                style={{ width: "100%", height: 50, padding: "0 14px", border: "1px solid var(--line)", borderRadius: 12, outline: "none", color: "var(--text)", background: "var(--surface-2)", marginBottom: 12 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={{ display: "block", marginBottom: 5, color: "var(--muted)", fontSize: 10, fontWeight: 700 }}>RELATION</label>
                  <input value={quickFields.relation} onChange={(e) => setQuickFields((f) => ({ ...f, relation: e.target.value }))} placeholder="e.g. Friend, Work"
                    style={{ width: "100%", height: 40, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }} /></div>
                <div><label style={{ display: "block", marginBottom: 5, color: "var(--muted)", fontSize: 10, fontWeight: 700 }}>NOTES</label>
                  <input value={quickFields.notes} onChange={(e) => setQuickFields((f) => ({ ...f, notes: e.target.value }))} placeholder="e.g. Follow up this week"
                    style={{ width: "100%", height: 40, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }} /></div>
              </div>
            </>)}

            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={closeQuickAdd}>Cancel</button>
              <button className="primary-btn" type="submit" style={{ textTransform: "capitalize" }}>Add {quickAddType}</button>
            </div>
          </form>
        </div>
      )}

      {toast && <div className="toast"><CheckCircle2 size={18} />{toast}</div>}
    </div>
  );
}

/* ─── Journal-to-action keyword extraction ───────────────────────── */
function extractJournalActions(entries: JournalEntry[]): string[] {
  if (entries.length === 0) return [];
  const keywords = ["need to", "should", "must", "have to", "follow up", "call", "email", "schedule", "book", "remind", "contact", "check on", "arrange", "sort out"];
  const found: string[] = [];
  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  recent.forEach((entry) => {
    entry.content.split(/[.!?\n]+/).forEach((sentence) => {
      const s = sentence.trim();
      if (s.length > 10 && s.length < 120 && keywords.some((kw) => s.toLowerCase().includes(kw))) {
        found.push(s);
      }
    });
  });
  return [...new Set(found)].slice(0, 3);
}

/* ─── Today / Command View ───────────────────────────────────────── */
function TodayView({ greeting, displayDate, firstName, tasks, habits, journal, projects, people, progress, doneTasks, doneHabits, onToggleTask, onToggleHabit, onNavigate, onAdd, onMoveToTomorrow, money }: {
  greeting: string; displayDate: string; firstName: string;
  tasks: Task[]; habits: Habit[]; journal: JournalEntry[]; projects: Project[]; people: Person[];
  progress: number; doneTasks: number; doneHabits: number; money: MoneyData;
  onToggleTask: (id: number) => void; onToggleHabit: (id: number) => void;
  onNavigate: (v: View) => void; onAdd: () => void; onMoveToTomorrow: (id: number) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const tomorrowStr = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; })();
  const in7DaysStr = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split("T")[0]; })();

  const todayEntry = journal.find((e) => e.date === today);
  const latestEntry = [...journal].sort((a, b) => b.date.localeCompare(a.date))[0];

  const totalBalance = money.accounts.reduce((s, a) => s + a.balance, 0);
  const totalExpenses = money.expenses.reduce((s, e) => s + e.amount, 0);
  const recurringExpenses = money.expenses.filter((e) => e.recurring).reduce((s, e) => s + e.amount, 0);
  const totalDebt = money.loans?.reduce((s, l) => s + l.balance, 0) ?? 0;

  // Three distinct scores
  const momentumScore = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const rhythmScore = habits.length > 0 ? Math.round((doneHabits / habits.length) * 100) : 0;
  const signalScore = Math.min(100, Math.round((momentumScore + rhythmScore) / 2 + (todayEntry ? 5 : 0)));

  // Active tasks only — exclude paused and archived from command view
  const openTasks = tasks.filter((t) => !t.done && t.status !== "paused" && t.status !== "archived");
  const pausedArchived = tasks.filter((t) => t.status === "paused" || t.status === "archived");
  const doneTasks_list = tasks.filter((t) => t.done);
  const doneHabits_list = habits.filter((h) => h.done);
  const missedHabits = habits.filter((h) => !h.done);

  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedOpen = [...openTasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  const top3 = sortedOpen.slice(0, 3);
  const top3Ids = new Set(top3.map((t) => t.id));
  const canWait = sortedOpen.filter((t) => !top3Ids.has(t.id)).slice(0, 5);

  const mainFocus = top3[0];
  const activeProjects = projects.filter((p) => p.status === "active");

  // Calendar-lite: tasks with a scheduledDate
  const scheduledToday = tasks.filter((t) => !t.done && t.scheduledDate === today);
  const scheduledTomorrow = tasks.filter((t) => !t.done && t.scheduledDate === tomorrowStr);
  const scheduledUpcoming = tasks.filter((t) => !t.done && t.scheduledDate && t.scheduledDate > tomorrowStr && t.scheduledDate <= in7DaysStr);
  const hasScheduled = scheduledToday.length + scheduledTomorrow.length + scheduledUpcoming.length > 0;

  // Journal-to-action extraction
  const journalActions = extractJournalActions(journal);

  type AttentionItem = { id: string; label: string; source: string; urgency: "critical" | "warning"; action: () => void };
  const attentionItems: AttentionItem[] = [
    ...openTasks.filter((t) => t.priority === "critical").map((t) => ({
      id: `task-c-${t.id}`, label: t.title, source: "Tasks — Critical", urgency: "critical" as const, action: () => onNavigate("tasks"),
    })),
    ...openTasks.filter((t) => t.priority === "high").map((t) => ({
      id: `task-${t.id}`, label: t.title, source: "Tasks", urgency: "critical" as const, action: () => onNavigate("tasks"),
    })),
    ...openTasks.filter((t) => t.riskFlag).map((t) => ({
      id: `risk-${t.id}`, label: `⚑ ${t.title}`, source: "Risk flagged", urgency: "critical" as const, action: () => onNavigate("tasks"),
    })),
    ...missedHabits.map((h) => ({
      id: `habit-${h.id}`, label: `${h.name} not done today`, source: "Habits", urgency: "warning" as const, action: () => onNavigate("habits"),
    })),
    ...activeProjects.filter((p) => p.tasks.length > 0 && p.tasks.every((t) => t.done)).map((p) => ({
      id: `proj-${p.id}`, label: `${p.name} — needs a next action`, source: "Projects", urgency: "warning" as const, action: () => onNavigate("projects"),
    })),
    ...people.filter((p) => p.notes?.toLowerCase().includes("follow up") || p.notes?.toLowerCase().includes("birthday")).map((p) => ({
      id: `person-${p.id}`, label: `${p.name} — ${p.notes}`, source: "People", urgency: "warning" as const, action: () => onNavigate("people"),
    })),
    ...journalActions.map((action, i) => ({
      id: `jaction-${i}`, label: action, source: "Journal — possible action", urgency: "warning" as const, action: () => onNavigate("journal"),
    })),
  ];

  const ignoreItems = [
    ...doneTasks_list.map((t) => ({ id: `t-${t.id}`, label: t.title, source: "Task complete" })),
    ...doneHabits_list.map((h) => ({ id: `h-${h.id}`, label: h.name, source: "Habit done" })),
    ...pausedArchived.map((t) => ({ id: `pa-${t.id}`, label: t.title, source: t.status === "paused" ? "Paused" : "Archived" })),
  ];

  const rhythmStatus = doneHabits === habits.length && habits.length > 0
    ? "Strong" : doneHabits > habits.length / 2 ? "Building" : habits.length > 0 ? "Needs attention" : "Set habits";
  const rhythmColor = doneHabits === habits.length && habits.length > 0
    ? "#60836b" : doneHabits > habits.length / 2 ? "#b87c3e" : "#c0392b";
  const cashflowWarning = totalExpenses > money.salary * 0.8;

  // Money reality check
  const spendingPressure = money.salary > 0 ? Math.round((totalExpenses / money.salary) * 100) : 0;
  const monthsRunway = money.salary > 0 ? (totalBalance / money.salary).toFixed(1) : "—";
  const realitySignal = spendingPressure > 90
    ? { text: "Spending exceeds 90% of income — review fixed costs now", level: "critical" }
    : spendingPressure > 75
    ? { text: "High spending pressure — review discretionary spend", level: "warning" }
    : totalDebt > 0 && totalDebt > totalBalance
    ? { text: "Debt exceeds liquid balance — prioritise reduction", level: "warning" }
    : money.goals.length === 0
    ? { text: "No savings goal set — consider adding one", level: "info" }
    : { text: "Financial position looks stable. Keep monitoring.", level: "ok" };

  return (
    <>
      {/* 1 — Signal Command Card */}
      <section style={{
        padding: "24px 28px", marginBottom: 16, borderRadius: 20,
        background: "linear-gradient(135deg, #1a1f1b 0%, #242922 100%)",
        border: "1px solid #2f3830", color: "#f3f2ed", position: "relative", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, position: "relative", zIndex: 1 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", color: "var(--gold)", fontSize: 10, fontWeight: 780, letterSpacing: "1.4px", textTransform: "uppercase", marginBottom: 8 }}>{displayDate}</span>
            <h1 style={{ margin: "0 0 4px", fontFamily: "Georgia, serif", fontSize: "clamp(20px, 2.5vw, 30px)", fontWeight: 500, letterSpacing: "-1px", color: "#f3f2ed" }}>
              {greeting}, {firstName}.
            </h1>
            <p style={{ margin: "0 0 18px", color: "#8a9087", fontSize: 13 }}>No Noise. Just Signal.</p>
            {mainFocus ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: mainFocus.nextAction ? 6 : 0 }}>
                  <span style={{ padding: "5px 10px", borderRadius: 8, background: "rgba(201,152,10,.15)", border: "1px solid rgba(201,152,10,.3)", color: "var(--gold-light)", fontSize: 10, fontWeight: 750, textTransform: "uppercase", letterSpacing: 1, flexShrink: 0 }}>Main focus</span>
                  <span style={{ fontSize: 13, color: "#e8e6df" }}>{mainFocus.title}</span>
                </div>
                {mainFocus.nextAction && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, background: "rgba(230,110,82,.15)", color: "var(--accent)", fontWeight: 750, textTransform: "uppercase", letterSpacing: 0.8, flexShrink: 0 }}>Next action</span>
                    <span style={{ fontSize: 11, color: "#a8a69f" }}>{mainFocus.nextAction}</span>
                  </div>
                )}
              </div>
            ) : (
              <span style={{ fontSize: 13, color: "#8a9087" }}>All clear — nothing critical today.</span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, minWidth: 120 }}>
            {([
              { label: "Momentum", score: momentumScore, color: "var(--accent)" },
              { label: "Rhythm", score: rhythmScore, color: "#60836b" },
              { label: "Signal", score: signalScore, color: "var(--gold)" },
            ] as { label: string; score: number; color: string }[]).map(({ label, score, color }) => (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 8, fontWeight: 750, color: "#8a9087", textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
                  <span style={{ fontSize: 9, fontWeight: 800, color }}>{score}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 4, background: "#2f3830", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 4, transition: "width .4s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, borderRadius: "50%", border: "1px solid rgba(201,152,10,.07)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: -80, top: -80, width: 300, height: 300, borderRadius: "50%", border: "1px solid rgba(201,152,10,.04)", pointerEvents: "none" }} />
      </section>

      {/* 2 — Top 3 Focus Items */}
      <section className="panel" style={{ padding: 22, marginBottom: 14 }}>
        <PanelHead title="Top 3 focus" subtitle={`${openTasks.length} open task${openTasks.length !== 1 ? "s" : ""} — showing highest priority`} action="All tasks" onClick={() => onNavigate("tasks")} />
        {top3.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 12, margin: "4px 0 0" }}>No open tasks. Add something to focus on today.</p>
        ) : (
          <div className="signal-focus-grid">
            {top3.map((task, i) => (
              <div key={task.id} style={{ padding: "14px 16px", borderRadius: 14, background: "var(--surface-2)", border: "1px solid var(--line)", position: "relative", opacity: task.done ? 0.5 : 1 }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "14px 14px 0 0", background: task.priority === "critical" ? "#8b1a1a" : task.priority === "high" ? "var(--accent)" : task.priority === "medium" ? "#9c8db2" : "var(--green)" }} />
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 9, fontWeight: 750, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>#{i + 1} · {task.area}</span>
                  <button onClick={() => onToggleTask(task.id)} style={{ width: 20, height: 20, display: "grid", placeItems: "center", padding: 0, border: task.done ? "none" : "1.5px solid #c8cac5", borderRadius: 6, background: task.done ? "var(--green)" : "transparent", color: "white", cursor: "pointer", flexShrink: 0 }}>
                    {task.done ? <Check size={13} /> : null}
                  </button>
                </div>
                <strong style={{ display: "block", fontSize: 12, fontWeight: 650, lineHeight: 1.4, marginBottom: 8, textDecoration: task.done ? "line-through" : "none", color: task.done ? "var(--muted)" : "var(--text)" }}>{task.title}</strong>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <span className={`priority ${task.priority}`}>{task.priority}</span>
                  {task.effort && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 5, background: "var(--line)", color: "var(--muted)", fontWeight: 700 }}>{task.effort}</span>}
                  <span style={{ color: "var(--muted)", fontSize: 9 }}>{task.time}</span>
                  {task.dueDate && <span style={{ fontSize: 9, color: "var(--accent-dark)", fontWeight: 700 }}>Due {new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short" }).format(new Date(task.dueDate + "T00:00:00"))}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        <button className="add-row" onClick={onAdd} style={{ marginTop: 14 }}><Plus size={17} />Quick add</button>
      </section>

      {/* 3 + 4 — Attention Required + What Can Wait */}
      <div className="signal-two-col">
        <section className="panel" style={{ padding: 22 }}>
          <PanelHead title="Attention required" subtitle={attentionItems.length === 0 ? "All clear" : `${attentionItems.length} item${attentionItems.length !== 1 ? "s" : ""} need review`} />
          {attentionItems.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 12, margin: "4px 0 0" }}>Nothing critical right now.</p>
          ) : (
            <div style={{ display: "grid", gap: 8, marginTop: 4 }}>
              {attentionItems.map((item) => (
                <button key={item.id} className="attention-item" onClick={item.action} style={{ borderLeft: `3px solid ${item.urgency === "critical" ? "var(--accent)" : "#d4a844"}`, background: item.urgency === "critical" ? "rgba(230,110,82,.06)" : "rgba(212,168,68,.06)" }}>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <strong style={{ display: "block", fontSize: 11, color: "var(--text)" }}>{item.label}</strong>
                    <span style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.8 }}>{item.source}</span>
                  </div>
                  <ChevronRight size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="panel" style={{ padding: 22 }}>
          <PanelHead title="What can wait" subtitle="Lower priority — no action needed today" />
          {canWait.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 12, margin: "4px 0 0" }}>No deferred items.</p>
          ) : (
            <div style={{ marginTop: 4 }}>
              {canWait.map((task) => {
                const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
                const suggestedDate = task.dueDate
                  ? new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short" }).format(new Date(task.dueDate + "T00:00:00"))
                  : new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short" }).format(tomorrow);
                const reason = task.priority === "low" ? "Low priority — no urgency" : "Not in today's top 3";
                return (
                  <div key={task.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 8, padding: "3px 7px", borderRadius: 6, background: "var(--surface-2)", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, flexShrink: 0 }}>{task.priority}</span>
                      <span style={{ fontSize: 12, color: "var(--text)", flex: 1, fontWeight: 600 }}>{task.title}</span>
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 4, paddingLeft: 2 }}>
                      <span style={{ fontSize: 9, color: "var(--muted)" }}>{reason}</span>
                      <span style={{ fontSize: 9, color: "var(--muted)", marginLeft: "auto" }}>Suggested: {suggestedDate}</span>
                    </div>
                  </div>
                );
              })}
              <button onClick={() => onNavigate("tasks")} style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 12, padding: "5px 0", border: 0, color: "var(--accent-dark)", background: "none", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                View all tasks <ChevronRight size={14} />
              </button>
            </div>
          )}
        </section>
      </div>

      {/* 5 — What Can Be Ignored */}
      {ignoreItems.length > 0 && (
        <section style={{ marginBottom: 14, padding: "14px 18px", borderRadius: 14, background: "var(--surface-2)", border: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 750, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>What can be ignored today</span>
            <span style={{ padding: "2px 8px", borderRadius: 10, background: "var(--line)", fontSize: 9, color: "var(--muted)" }}>{ignoreItems.length}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ignoreItems.slice(0, 8).map((item) => (
              <span key={item.id} className="ignore-pill">{item.label} <span style={{ fontSize: 8, opacity: 0.6 }}>· {item.source}</span></span>
            ))}
          </div>
        </section>
      )}

      {/* 5b — Calendar-lite */}
      {hasScheduled && (
        <section style={{ marginBottom: 14, padding: "16px 18px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <CalendarDays size={14} style={{ color: "var(--accent-dark)", flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 750, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>Scheduled</span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {scheduledToday.length > 0 && (
              <div>
                <span style={{ fontSize: 8, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: 1 }}>Today</span>
                {scheduledToday.map((t) => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
                    <span style={{ fontSize: 11, flex: 1 }}>{t.title}</span>
                    <span style={{ fontSize: 9, color: "var(--muted)" }}>{t.time}</span>
                    <button onClick={() => onMoveToTomorrow(t.id)} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 5, border: "1px solid var(--line)", background: "none", color: "var(--muted)", cursor: "pointer" }}>→ Tomorrow</button>
                  </div>
                ))}
              </div>
            )}
            {scheduledTomorrow.length > 0 && (
              <div>
                <span style={{ fontSize: 8, fontWeight: 800, color: "#b87c3e", textTransform: "uppercase", letterSpacing: 1 }}>Tomorrow</span>
                {scheduledTomorrow.map((t) => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
                    <span style={{ fontSize: 11, flex: 1 }}>{t.title}</span>
                    <span style={{ fontSize: 9, color: "var(--muted)" }}>{t.time}</span>
                  </div>
                ))}
              </div>
            )}
            {scheduledUpcoming.length > 0 && (
              <div>
                <span style={{ fontSize: 8, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>Next 7 days</span>
                {scheduledUpcoming.map((t) => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
                    <span style={{ fontSize: 11, flex: 1 }}>{t.title}</span>
                    <span style={{ fontSize: 9, color: "var(--muted)" }}>{t.scheduledDate}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 6 + 7 — Money Snapshot + Rhythm Snapshot */}
      <div className="signal-two-col">
        <section className="panel" style={{ padding: 22 }}>
          <PanelHead title="Money snapshot" subtitle={new Intl.DateTimeFormat("en-ZA", { month: "long", year: "numeric" }).format(new Date())} action="Details" onClick={() => onNavigate("money")} />
          <div style={{ marginBottom: 14 }}>
            <span style={{ color: "var(--muted)", fontSize: 10 }}>Total balance</span>
            <strong style={{ display: "block", fontFamily: "Georgia,serif", fontSize: 26, letterSpacing: "-.6px", marginTop: 2 }}>R {totalBalance.toLocaleString("en-ZA")}</strong>
          </div>
          <div>
            {[
              { label: "Monthly income", value: `R ${money.salary.toLocaleString("en-ZA")}`, color: "var(--green)" },
              { label: "Monthly spend", value: `R ${totalExpenses.toLocaleString("en-ZA")}`, color: cashflowWarning ? "#c0392b" : "var(--text)" },
              { label: "Recurring", value: `R ${recurringExpenses.toLocaleString("en-ZA")}`, color: "var(--muted)" },
              { label: "Savings goals", value: `${money.goals?.length ?? 0} active`, color: "var(--muted)" },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--line)", fontSize: 11 }}>
                <span style={{ color: "var(--muted)" }}>{row.label}</span>
                <strong style={{ color: row.color }}>{row.value}</strong>
              </div>
            ))}
          </div>
          {/* Money Reality Check */}
          <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 10, background: realitySignal.level === "critical" ? "rgba(192,57,43,.07)" : realitySignal.level === "warning" ? "rgba(212,168,68,.07)" : "var(--surface-2)", border: `1px solid ${realitySignal.level === "critical" ? "rgba(192,57,43,.2)" : realitySignal.level === "warning" ? "rgba(212,168,68,.2)" : "var(--line)"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: realitySignal.level === "critical" ? "#c0392b" : realitySignal.level === "warning" ? "#b87c3e" : "var(--muted)" }}>Reality Check</span>
              <span style={{ fontSize: 9, color: "var(--muted)" }}>Runway: {monthsRunway}mo</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: realitySignal.level === "critical" ? "#c0392b" : realitySignal.level === "warning" ? "#b87c3e" : "var(--muted)" }}>{realitySignal.text}</div>
            {money.salary > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: "var(--muted)" }}>Spending pressure</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: spendingPressure > 90 ? "#c0392b" : spendingPressure > 75 ? "#b87c3e" : "var(--green)" }}>{spendingPressure}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 4, background: "var(--line)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, spendingPressure)}%`, background: spendingPressure > 90 ? "#c0392b" : spendingPressure > 75 ? "#b87c3e" : "var(--green)", borderRadius: 4 }} />
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="panel" style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 500, letterSpacing: "-.35px" }}>Rhythm</h2>
              <p style={{ margin: "5px 0 0", color: "var(--muted)", fontSize: 10 }}>{doneHabits} of {habits.length} habits checked in</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 750, color: rhythmColor }}>{rhythmStatus}</span>
              <button onClick={() => onNavigate("habits")} style={{ display: "flex", alignItems: "center", gap: 2, padding: "5px 0", border: 0, color: "var(--accent-dark)", background: "none", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Habits <ChevronRight size={14} /></button>
            </div>
          </div>
          <div>
            {habits.map((habit) => (
              <button key={habit.id} onClick={() => onToggleHabit(habit.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", border: 0, borderBottom: "1px solid var(--line)", background: "none", textAlign: "left", cursor: "pointer", width: "100%" }}>
                <span className={`habit-dot ${habit.color}`} style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: "grid", placeItems: "center" }}>{habit.done ? <Check size={12} /> : null}</span>
                <span style={{ flex: 1 }}>
                  <strong style={{ display: "block", fontSize: 11 }}>{habit.name}</strong>
                  <small style={{ display: "block", fontSize: 9, color: "var(--muted)", marginTop: 2 }}>{habit.detail}{habit.streak > 0 ? ` · ${habit.streak}d streak` : ""}</small>
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, color: habit.done ? "var(--green)" : "var(--muted)" }}>{habit.done ? "Done" : "Pending"}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* 8 — Journal Insight */}
      <section className="panel insight-panel" style={{ padding: 22, marginBottom: 14 }}>
        <div className="insight-icon"><Sparkles size={20} /></div>
        <div style={{ flex: 1 }}>
          <span className="eyebrow">Journal insight</span>
          <h3>{latestEntry ? `Last entry: ${new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short" }).format(new Date(latestEntry.date))}` : "No journal entries yet."}</h3>
          <p>
            {todayEntry
              ? "Today's thoughts are captured. Reflection builds clarity over time."
              : latestEntry
              ? "You haven't written today. Even 3 sentences builds momentum."
              : "Start your journal to build a record of thoughts, decisions, and patterns."}
          </p>
          <button onClick={() => onNavigate("journal")}>
            {todayEntry ? "Read today's entry" : "Write now"} <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {/* In Motion + People */}
      <div className="signal-bottom-grid">
        <section className="panel" style={{ padding: 22 }}>
          <PanelHead title="In motion" subtitle={`${activeProjects.length} active project${activeProjects.length !== 1 ? "s" : ""}`} action="Projects" onClick={() => onNavigate("projects")} />
          {activeProjects.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 12 }}>No active projects yet.</p>
          ) : (
            activeProjects.slice(0, 4).map((p) => {
              const done = p.tasks.filter((t) => t.done).length;
              const prog = p.tasks.length ? Math.round((done / p.tasks.length) * 100) : 0;
              return (
                <div key={p.id} className="project-row">
                  <span className={`project-mark ${p.color}`}><Target size={17} /></span>
                  <div>
                    <strong>{p.name}</strong>
                    <span>{p.tasks.length} tasks<small style={{ marginLeft: "auto" }}>{prog}%</small></span>
                    <i><b style={{ width: `${prog}%` }} /></i>
                  </div>
                </div>
              );
            })
          )}
        </section>

        <section className="panel" style={{ padding: 22 }}>
          <PanelHead title="People" subtitle="Stay connected" action="People" onClick={() => onNavigate("people")} />
          {people.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 12 }}>No people added yet.</p>
          ) : (
            <div className="people-list">
              {people.slice(0, 4).map((person) => (
                <button key={person.id} className="person-row" onClick={() => onNavigate("people")}>
                  <span className="person-avatar" style={{ background: `${getColorHex(person.color)}33`, color: getColorHex(person.color) }}>
                    {person.initials || person.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span><strong>{person.name}</strong><small>{person.notes || person.relation}</small></span>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function getColorHex(color: string) {
  const map: Record<string, string> = { coral: "#ed927d", blue: "#80a7ba", purple: "#9c8db2", green: "#7fa087", gold: "#c9980a", rose: "#c97db0" };
  return map[color] ?? "#ed927d";
}

function PanelHead({ title, subtitle, action, onClick }: { title: string; subtitle: string; action?: string; onClick?: () => void }) {
  return (
    <div className="panel-head">
      <div><h2>{title}</h2><p>{subtitle}</p></div>
      {action && <button onClick={onClick}>{action}<ChevronRight size={15} /></button>}
    </div>
  );
}

function MiniTrend({ up = false }: { up?: boolean }) {
  return (
    <div className="mini-trend">
      <svg viewBox="0 0 162 40" preserveAspectRatio="none"><polyline points={sparkline} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <span className={up ? "good" : "muted"}>{up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{up ? "on track" : "steady"}</span>
    </div>
  );
}
