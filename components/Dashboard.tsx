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

import type { Habit, JournalEntry, MoneyData, Person, Project, Task } from "@/lib/types";
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

const DEFAULT_TASKS: Task[] = [
  { id: 1, title: "Plan the week ahead", area: "Personal", time: "15 min", priority: "high", done: false },
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
  const [newTask, setNewTask] = useState("");
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

  function addQuickTask(e: FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), title: newTask.trim(), area: "Personal", time: "10 min", priority: "medium", done: false }]);
    setNewTask(""); setQuickAddOpen(false); showToast("Task added");
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
            <span style={{ fontSize: 13, letterSpacing: "-.2px", fontWeight: 700 }}>MJW Tracker</span>
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
            <small>MJW Tracker</small>
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
              <Plus size={17} /><span>Add task</span>
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
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setQuickAddOpen(false)}>
          <form className="modal" onSubmit={addQuickTask} onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div><span className="eyebrow">Quick capture</span><h2>Add something to your day</h2></div>
              <button type="button" className="icon-btn" onClick={() => setQuickAddOpen(false)}><X size={19} /></button>
            </div>
            <label htmlFor="qt">What needs doing?</label>
            <input id="qt" autoFocus value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="e.g. Call the dentist"
              style={{ width: "100%", height: 50, padding: "0 14px", border: "1px solid var(--line)", borderRadius: 12, outline: "none", color: "var(--text)", background: "var(--surface-2)", marginTop: 8 }} />
            <div className="modal-options">
              <button type="button"><CalendarDays size={16} />Today</button>
              <button type="button"><Target size={16} />Personal</button>
              <button type="button"><Clock3 size={16} />10 min</button>
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={() => setQuickAddOpen(false)}>Cancel</button>
              <button className="primary-btn" type="submit">Add task</button>
            </div>
          </form>
        </div>
      )}

      {toast && <div className="toast"><CheckCircle2 size={18} />{toast}</div>}
    </div>
  );
}

/* ─── Today View ─────────────────────────────────────────────────── */
function TodayView({ greeting, displayDate, firstName, tasks, habits, journal, projects, people, progress, doneTasks, doneHabits, onToggleTask, onToggleHabit, onNavigate, onAdd, money }: {
  greeting: string; displayDate: string; firstName: string;
  tasks: Task[]; habits: Habit[]; journal: JournalEntry[]; projects: Project[]; people: Person[];
  progress: number; doneTasks: number; doneHabits: number; money: MoneyData;
  onToggleTask: (id: number) => void; onToggleHabit: (id: number) => void;
  onNavigate: (v: View) => void; onAdd: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const todayEntry = journal.find((e) => e.date === today);
  const totalBalance = money.accounts.reduce((s, a) => s + a.balance, 0);
  const activeProjects = projects.filter((p) => p.status === "active");

  return (
    <>
      {/* Welcome row */}
      <section className="welcome-row">
        <div>
          <span className="eyebrow">{displayDate}</span>
          <h1>{greeting}, {firstName}.</h1>
          <p>Here's the shape of your day. Keep it light and move one thing forward.</p>
        </div>
        <div className="day-score">
          <div className="score-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}>
            <span>{progress}%</span>
          </div>
          <div><strong>Day score</strong><small>{progress > 70 ? "A strong day" : "Plenty of room"}</small></div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="stat-grid" style={{ marginBottom: 16 }}>
        <article className="stat-card peach" style={{ cursor: "pointer" }} onClick={() => onNavigate("tasks")}>
          <div className="stat-icon"><ListTodo size={20} /></div>
          <div><span>Tasks today</span><strong>{tasks.length - doneTasks}<small> remaining</small></strong><p>{doneTasks} complete</p></div>
          <MiniTrend up />
        </article>
        <article className="stat-card lilac" style={{ cursor: "pointer" }} onClick={() => onNavigate("habits")}>
          <div className="stat-icon"><Flame size={20} /></div>
          <div><span>Habit rhythm</span><strong>{doneHabits}<small> of {habits.length}</small></strong><p>Keep the streak alive</p></div>
          <MiniTrend up />
        </article>
        <article className="stat-card mint" style={{ cursor: "pointer" }} onClick={() => onNavigate("money")}>
          <div className="stat-icon"><CircleDollarSign size={20} /></div>
          <div><span>Total balance</span><strong>R {Math.round(totalBalance / 1000)}k</strong><p>{money.accounts.length} accounts</p></div>
          <MiniTrend />
        </article>
        <article className="stat-card sky" style={{ cursor: "pointer" }} onClick={() => onNavigate("journal")}>
          <div className="stat-icon"><BookOpen size={20} /></div>
          <div><span>Journal</span><strong>{journal.length}<small> entries</small></strong><p>{todayEntry ? "Written today ✓" : "Not written yet"}</p></div>
          <MiniTrend up />
        </article>
      </section>

      {/* ── Main grid: 2 equal columns ─────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>

        {/* LEFT col: Today's Focus */}
        <section className="panel" style={{ padding: 22 }}>
          <PanelHead title="Today's focus" subtitle={`${doneTasks} of ${tasks.length} tasks done`} action="View all" onClick={() => onNavigate("tasks")} />
          <div className="task-list">
            {tasks.slice(0, 6).map((task) => (
              <div key={task.id} className={task.done ? "task-row done" : "task-row"}>
                <button className="check-btn" onClick={() => onToggleTask(task.id)}>{task.done ? <Check size={15} /> : null}</button>
                <div className="task-copy"><strong>{task.title}</strong><span>{task.area}<i />{task.time}</span></div>
                <span className={`priority ${task.priority}`}>{task.priority}</span>
              </div>
            ))}
          </div>
          <button className="add-row" onClick={onAdd}><Plus size={17} />Add a task</button>
        </section>

        {/* RIGHT col: Daily Insight (top) + Daily Rhythm (half height, bottom) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Daily Insight */}
          <section className="panel insight-panel" style={{ flex: "0 0 auto" }}>
            <div className="insight-icon"><Sparkles size={20} /></div>
            <div>
              <span className="eyebrow">Daily insight</span>
              <h3>{todayEntry ? "Journal entry complete." : "Haven't journaled today."}</h3>
              <p>{todayEntry ? "Your thoughts are captured. Come back to reflect anytime." : "Writing just 5 minutes builds clarity and reduces stress."}</p>
              <button onClick={() => onNavigate("journal")}>
                {todayEntry ? "Read entry" : "Start writing"} <ChevronRight size={16} />
              </button>
            </div>
          </section>

          {/* Daily Rhythm — compact / half height */}
          <section className="panel" style={{ padding: "16px 20px", flex: "1 1 auto" }}>
            <PanelHead title="Daily rhythm" subtitle={`${doneHabits} of ${habits.length} checked in`} action="Habits" onClick={() => onNavigate("habits")} />
            <div style={{ display: "grid", gap: 4 }}>
              {habits.map((habit) => (
                <button key={habit.id} className="habit-row" onClick={() => onToggleHabit(habit.id)} style={{ minHeight: 44 }}>
                  <span className={`habit-dot ${habit.color}`} style={{ width: 24, height: 24, borderRadius: 7 }}>{habit.done ? <Check size={12} /> : null}</span>
                  <span style={{ flex: 1, textAlign: "left" }}><strong style={{ fontSize: 11 }}>{habit.name}</strong><small style={{ display: "block", fontSize: 9 }}>{habit.detail}</small></span>
                  <span className={habit.done ? "habit-check checked" : "habit-check"} style={{ width: 18, height: 18 }}>{habit.done ? <Check size={12} /> : null}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Money at a Glance — full width */}
      <section className="panel" style={{ padding: 22, marginBottom: 14 }}>
        <PanelHead title="Money at a glance" subtitle={new Intl.DateTimeFormat("en-ZA", { month: "long", year: "numeric" }).format(new Date())} action="Details" onClick={() => onNavigate("money")} />
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 24, alignItems: "center" }}>
          <div>
            <span style={{ color: "var(--muted)", fontSize: 10 }}>Total balance</span>
            <strong style={{ display: "block", fontFamily: "Georgia,serif", fontSize: 28, letterSpacing: "-.6px" }}>R {totalBalance.toLocaleString("en-ZA")}</strong>
          </div>
          <div className="chart-wrap" style={{ height: 60, margin: 0 }}>
            <svg viewBox="0 0 520 80" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
              <defs><linearGradient id="area3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#769a80" stopOpacity=".3" /><stop offset="1" stopColor="#769a80" stopOpacity="0" /></linearGradient></defs>
              <path d="M0 68 C60 56 70 62 110 46 S175 54 215 34 S280 44 325 22 S395 34 430 12 S490 16 520 4 L520 80 L0 80 Z" fill="url(#area3)" />
              <path d="M0 68 C60 56 70 62 110 46 S175 54 215 34 S280 44 325 22 S395 34 430 12 S490 16 520 4" fill="none" stroke="#6f9379" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="money-summary" style={{ gridTemplateColumns: "1fr", gap: 8, padding: 0, border: 0 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 11 }}><span className="dot income" />Income <strong>R {money.salary.toLocaleString("en-ZA")}</strong></div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 11 }}><span className="dot expense" />Expenses <strong>R {money.expenses.reduce((s, e) => s + e.amount, 0).toLocaleString("en-ZA")}</strong></div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 11 }}><span className="dot saved" />Goals <strong>{money.goals.length} active</strong></div>
          </div>
        </div>
      </section>

      {/* ── Bottom 50/50 grid ──────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* In Motion */}
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

        {/* People to remember */}
        <section className="panel" style={{ padding: 22 }}>
          <PanelHead title="People to remember" subtitle="Small gestures, right on time" action="People" onClick={() => onNavigate("people")} />
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
