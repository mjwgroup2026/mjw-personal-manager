import { usePersonalData } from "@/hooks/usePersonalData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Circle, Flame, BookOpen, FolderKanban, Sparkles, Wallet } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";

const moodEmoji: Record<string, string> = { great: "😄", good: "🙂", okay: "😐", tough: "😔" };
const priorityColor: Record<string, string> = { critical: "text-red-500", high: "text-orange-500", medium: "text-yellow-600", low: "text-muted-foreground" };

export default function Today() {
  const { tasks, habits, journal, projects, money } = usePersonalData();
  const today = format(new Date(), "yyyy-MM-dd");
  const todayLabel = format(new Date(), "EEEE, d MMMM yyyy");

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const monthTxs = (money.transactions ?? []).filter((t) => {
    const d = parseISO(t.date);
    return d >= monthStart && d <= monthEnd;
  });
  const totalSpent = monthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalIncome = monthTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthlyIncome = money.monthlyIncome ?? 0;
  const remaining = monthlyIncome + totalIncome - totalSpent;
  const totalBudget = (money.categories ?? []).reduce((s, c) => s + c.budget, 0);

  const openTasks = tasks.filter((t) => t.status !== "done" && t.status !== "archived")
    .sort((a, b) => { const o = { critical: 0, high: 1, medium: 2, low: 3 }; return o[a.priority] - o[b.priority]; })
    .slice(0, 5);
  const todayHabits = habits.filter((h) => !h.doneToday).slice(0, 5);
  const todayEntry = journal.find((e) => e.date === today);
  const activeProjects = projects.filter((p) => p.status === "active").slice(0, 3);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-accent" />
          <h1 className="text-2xl font-bold font-display text-foreground">Today</h1>
        </div>
        <p className="text-sm text-muted-foreground font-body">{todayLabel}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold font-body flex items-center gap-2">
              <Circle className="h-4 w-4 text-accent" /> Focus — Top Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {openTasks.length === 0 && <p className="text-xs text-muted-foreground font-body">No open tasks</p>}
            {openTasks.map((t) => (
              <div key={t.id} className="flex items-start gap-2">
                <Circle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-body text-foreground truncate">{t.title}</p>
                  <span className={`text-[10px] font-body capitalize ${priorityColor[t.priority]}`}>{t.priority}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold font-body flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" /> Habits — Pending Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {habits.length === 0 && <p className="text-xs text-muted-foreground font-body">No habits tracked yet</p>}
            {todayHabits.length === 0 && habits.length > 0 && <p className="text-xs text-muted-foreground font-body">All habits done for today!</p>}
            {todayHabits.map((h) => (
              <div key={h.id} className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: h.color === "coral" ? "#f87171" : h.color === "blue" ? "#3b82f6" : h.color === "purple" ? "#a855f7" : h.color === "green" ? "#22c55e" : "#f97316" }} />
                <p className="text-xs font-body text-foreground">{h.name}</p>
                {h.detail && <span className="text-[10px] text-muted-foreground font-body">{h.detail}</span>}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold font-body flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-secondary" /> Today's Journal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayEntry ? (
              <div>
                <p className="text-lg mb-2">{moodEmoji[todayEntry.mood ?? "okay"]}</p>
                <p className="text-xs font-body text-foreground line-clamp-4">{todayEntry.content}</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground font-body">No entry yet today. Head to Journal to write one.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold font-body flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-primary" /> Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeProjects.length === 0 && <p className="text-xs text-muted-foreground font-body">No active projects</p>}
            {activeProjects.map((p) => {
              const done = p.tasks.filter((t) => t.done).length;
              const total = p.tasks.length;
              return (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-body font-medium text-foreground truncate">{p.name}</p>
                    <span className="text-[10px] text-muted-foreground font-body ml-2">{done}/{total}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: total ? `${(done / total) * 100}%` : "0%" }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Budget snapshot — full width */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold font-body flex items-center gap-2">
              <Wallet className="h-4 w-4 text-accent" /> Budget — {format(new Date(), "MMMM yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyIncome === 0 && (money.categories ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground font-body">No budget set up yet. Head to <span className="font-semibold text-accent">Budget</span> in the sidebar to get started.</p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">Income</p>
                    <p className="text-base font-bold font-body text-foreground">R {(monthlyIncome + totalIncome).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">Spent</p>
                    <p className="text-base font-bold font-body text-red-500">R {totalSpent.toLocaleString("en-ZA", { minimumFractionDigits: 0 })}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">Left</p>
                    <p className={`text-base font-bold font-body ${remaining >= 0 ? "text-green-600" : "text-red-500"}`}>R {Math.abs(remaining).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}</p>
                  </div>
                </div>
                {totalBudget > 0 && (
                  <div>
                    <div className="flex justify-between text-[10px] font-body text-muted-foreground mb-1">
                      <span>Overall budget usage</span>
                      <span>{totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${totalSpent > totalBudget ? "bg-red-500" : "bg-accent"}`}
                        style={{ width: `${totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0}%` }} />
                    </div>
                  </div>
                )}
                {(money.categories ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(money.categories ?? []).map((cat) => {
                      const spent = monthTxs.filter((t) => t.type === "expense" && t.categoryId === cat.id).reduce((s, t) => s + t.amount, 0);
                      const pct = cat.budget > 0 ? Math.min((spent / cat.budget) * 100, 100) : 0;
                      const over = spent > cat.budget && cat.budget > 0;
                      return (
                        <div key={cat.id} className="flex items-center gap-1.5 bg-muted/50 rounded-full px-3 py-1">
                          <div className="h-2 w-2 rounded-full shrink-0" style={{ background: cat.color }} />
                          <span className="text-[10px] font-body text-foreground">{cat.name}</span>
                          <span className={`text-[10px] font-body font-semibold ${over ? "text-red-500" : "text-muted-foreground"}`}>{Math.round(pct)}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
