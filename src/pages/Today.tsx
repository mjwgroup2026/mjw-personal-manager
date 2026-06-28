import { useState } from "react";
import { usePersonalData } from "@/hooks/usePersonalData";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Zap, Activity, DollarSign, BookOpen, FolderKanban, AlertTriangle } from "lucide-react";
import type { Task } from "@/lib/personal-types";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-ZA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const;

const priorityColor: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-400",
  medium: "bg-yellow-400",
  low: "bg-slate-400",
};

const HABIT_COLORS: Record<string, string> = {
  coral: "#e66e52",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  green: "#22c55e",
  orange: "#f97316",
};

const Today = () => {
  const { tasks, setTasks, habits, setHabits, journal, money, projects } = usePersonalData();
  const { user } = useAuth();

  const [quickTaskOpen, setQuickTaskOpen] = useState(false);
  const [quickTaskText, setQuickTaskText] = useState("");

  const today = todayStr();
  const openTasks = tasks
    .filter((t) => t.status === "open")
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  const top3 = openTasks.slice(0, 3);
  const canWait = openTasks.slice(3, 6);
  const doneTasks = tasks.filter((t) => t.status === "done");
  const momentumPct = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  const habitsDoneToday = habits.filter((h) => h.doneToday).length;
  const rhythmPct = habits.length > 0 ? Math.round((habitsDoneToday / habits.length) * 100) : 0;
  const signalAvg = Math.round((momentumPct + rhythmPct) / 2);

  const habitsNotDone = habits.filter((h) => !h.doneToday);
  const highPriorityTasks = tasks.filter((t) => t.priority === "critical" && t.status === "open");

  const todayJournal = journal.find((j) => j.date === today);
  const lastJournal = [...journal].sort((a, b) => b.date.localeCompare(a.date))[0];

  const activeProjects = projects.filter((p) => p.status === "active");

  const totalBalance = money.accounts.reduce((sum, a) => sum + a.balance, 0);

  function toggleTaskDone(task: Task) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, status: t.status === "done" ? "open" : "done", updatedAt: new Date().toISOString() }
          : t
      )
    );
  }

  function toggleHabit(id: string) {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, doneToday: !h.doneToday } : h)));
  }

  function addQuickTask() {
    if (!quickTaskText.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: quickTaskText.trim(),
      area: "Personal",
      priority: "medium",
      status: "open",
      effort: "light",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    setQuickTaskText("");
    setQuickTaskOpen(false);
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}{user?.email ? `, ${user.email.split("@")[0]}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">{formatDate(new Date())}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-blue-500 text-white px-3 py-1">
            <Zap className="mr-1 h-3 w-3" /> Momentum {momentumPct}%
          </Badge>
          <Badge className="bg-purple-500 text-white px-3 py-1">
            <Activity className="mr-1 h-3 w-3" /> Rhythm {rhythmPct}%
          </Badge>
          <Badge className="bg-emerald-500 text-white px-3 py-1">
            Signal {signalAvg}%
          </Badge>
          <Dialog open={quickTaskOpen} onOpenChange={setQuickTaskOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="ml-2">
                <Plus className="mr-1 h-4 w-4" /> Quick add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Quick Add Task</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 pt-2">
                <Label htmlFor="quick-task">What needs doing?</Label>
                <Textarea
                  id="quick-task"
                  placeholder="e.g. Call the bank, Buy groceries..."
                  value={quickTaskText}
                  onChange={(e) => setQuickTaskText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addQuickTask(); } }}
                  rows={3}
                />
                <Button onClick={addQuickTask} disabled={!quickTaskText.trim()}>
                  Add Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Col 1: Focus */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" /> Top 3 Focus
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {top3.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open tasks. Great job!</p>
              ) : (
                top3.map((t) => (
                  <div key={t.id} className="flex items-start gap-2">
                    <Checkbox
                      checked={t.status === "done"}
                      onCheckedChange={() => toggleTaskDone(t)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                        {t.title}
                      </p>
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        <span className={`inline-block h-2 w-2 rounded-full mt-1 ${priorityColor[t.priority]}`} />
                        <span className="text-xs text-muted-foreground">{t.area}</span>
                        {t.dueDate && <span className="text-xs text-muted-foreground">· {t.dueDate}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-muted-foreground">Can Wait</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {canWait.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing else pending.</p>
              ) : (
                canWait.map((t) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <Checkbox checked={t.status === "done"} onCheckedChange={() => toggleTaskDone(t)} />
                    <p className="text-sm truncate">{t.title}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Col 2: Attention + Rhythm */}
        <div className="flex flex-col gap-4">
          <Card className="border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" /> Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {habitsNotDone.length === 0 && highPriorityTasks.length === 0 ? (
                <p className="text-sm text-green-600 font-medium">All clear!</p>
              ) : (
                <>
                  {highPriorityTasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 rounded bg-red-50 px-2 py-1">
                      <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                      <p className="text-sm font-medium text-red-700 truncate">{t.title}</p>
                      <Badge variant="destructive" className="ml-auto text-xs">critical</Badge>
                    </div>
                  ))}
                  {habitsNotDone.slice(0, 3).map((h) => (
                    <div key={h.id} className="flex items-center gap-2 rounded bg-orange-50 px-2 py-1">
                      <span className="h-2 w-2 rounded-full bg-orange-400 shrink-0" />
                      <p className="text-sm text-orange-700 truncate">{h.name} not done</p>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500" /> Rhythm
                <span className="ml-auto text-xs text-muted-foreground">{habitsDoneToday}/{habits.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {habits.length === 0 ? (
                <p className="text-sm text-muted-foreground">No habits set up yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {habits.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => toggleHabit(h.id)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-all ${
                        h.doneToday
                          ? "text-white border-transparent"
                          : "bg-background text-foreground border-border"
                      }`}
                      style={h.doneToday ? { backgroundColor: HABIT_COLORS[h.color] ?? "#6b7280", borderColor: HABIT_COLORS[h.color] ?? "#6b7280" } : {}}
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: HABIT_COLORS[h.color] ?? "#6b7280" }}
                      />
                      {h.name}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Col 3: Money + Journal + Projects */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" /> Money Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total balance</span>
                <span className="font-semibold">R {totalBalance.toLocaleString("en-ZA")}</span>
              </div>
              {money.salary ? (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly income</span>
                  <span>R {money.salary.toLocaleString("en-ZA")}</span>
                </div>
              ) : null}
              {money.spendingPressure !== undefined && money.spendingPressure > 0 ? (
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Spending pressure</span>
                    <span>{money.spendingPressure}%</span>
                  </div>
                  <Progress value={money.spendingPressure} className="h-1.5" />
                </div>
              ) : null}
              {money.accounts.length === 0 && (
                <p className="text-xs text-muted-foreground">No accounts configured.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" /> Journal
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayJournal ? (
                <div>
                  <p className="text-sm font-medium text-green-600">Today's entry written ✓</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{todayJournal.content}</p>
                </div>
              ) : lastJournal ? (
                <div>
                  <p className="text-sm text-muted-foreground">No entry today.</p>
                  <p className="text-xs text-muted-foreground">Last entry: {lastJournal.date}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No journal entries yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-violet-500" /> Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {activeProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active projects.</p>
              ) : (
                activeProjects.map((p) => {
                  const total = p.tasks.length;
                  const done = p.tasks.filter((t) => t.done).length;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <div key={p.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium truncate">{p.name}</span>
                        <span className="text-muted-foreground text-xs">{done}/{total}</span>
                      </div>
                      <Progress value={pct} className="h-1.5" style={{ "--progress-color": p.color } as React.CSSProperties} />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Today;
