import { useState } from "react";
import { usePersonalData } from "@/hooks/usePersonalData";
import type { Task, TaskStatus, TaskPriority, TaskArea } from "@/lib/personal-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, CheckCircle2, Circle, Clock } from "lucide-react";
import { format } from "date-fns";

const statusIcons: Record<TaskStatus, React.ReactNode> = {
  open: <Circle className="h-4 w-4 text-muted-foreground" />,
  in_progress: <Clock className="h-4 w-4 text-blue-500" />,
  done: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  archived: <Circle className="h-4 w-4 text-muted-foreground/40" />,
};
const priorityBadge: Record<TaskPriority, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-muted text-muted-foreground",
};
const blank = (): Omit<Task, "id" | "createdAt" | "updatedAt"> => ({ title: "", area: "Personal", priority: "medium", status: "open" });

export default function PersonalTasks() {
  const { tasks, setTasks } = usePersonalData();
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank());
  const [editId, setEditId] = useState<string | null>(null);

  const filtered = tasks
    .filter((t) => filter === "all" || t.status === filter)
    .sort((a, b) => { const p = { critical: 0, high: 1, medium: 2, low: 3 }; return p[a.priority] - p[b.priority]; });

  const save = () => {
    if (!form.title.trim()) return;
    const now = new Date().toISOString();
    if (editId) {
      setTasks((prev) => prev.map((t) => t.id === editId ? { ...t, ...form, updatedAt: now } : t));
    } else {
      setTasks((prev) => [...prev, { ...form, id: crypto.randomUUID(), createdAt: now, updatedAt: now }]);
    }
    setOpen(false); setForm(blank()); setEditId(null);
  };

  const cycleStatus = (id: string) => {
    const cycle: TaskStatus[] = ["open", "in_progress", "done"];
    setTasks((prev) => prev.map((t) => {
      if (t.id !== id) return t;
      const next = cycle[(cycle.indexOf(t.status as any) + 1) % cycle.length] as TaskStatus;
      return { ...t, status: next, updatedAt: new Date().toISOString() };
    }));
  };

  const remove = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const openEdit = (t: Task) => {
    setForm({ title: t.title, area: t.area, priority: t.priority, status: t.status, dueDate: t.dueDate, nextAction: t.nextAction });
    setEditId(t.id); setOpen(true);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold font-display">Tasks</h1>
        <Button size="sm" className="bg-primary text-primary-foreground font-body" onClick={() => { setForm(blank()); setEditId(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> New Task
        </Button>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", "open", "in_progress", "done"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-body font-medium transition-colors ${filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {s === "all" ? "All" : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground font-body py-8 text-center">No tasks yet. Add your first task.</p>}
        {filtered.map((t) => (
          <Card key={t.id} className={t.status === "done" ? "opacity-60" : ""}>
            <CardContent className="py-3 px-4 flex items-start gap-3">
              <button onClick={() => cycleStatus(t.id)} className="mt-0.5 shrink-0">{statusIcons[t.status]}</button>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEdit(t)}>
                <p className={`text-sm font-body font-medium ${t.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.title}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-body font-semibold ${priorityBadge[t.priority]}`}>{t.priority}</span>
                  <span className="text-[10px] text-muted-foreground font-body">{t.area}</span>
                  {t.dueDate && <span className="text-[10px] text-muted-foreground font-body">Due {format(new Date(t.dueDate), "d MMM")}</span>}
                </div>
              </div>
              <button onClick={() => remove(t.id)} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{editId ? "Edit Task" : "New Task"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="font-body text-xs mb-1 block">Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Task title" className="font-body" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-body text-xs mb-1 block">Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as TaskPriority }))}>
                  <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{(["critical","high","medium","low"] as const).map((p) => <SelectItem key={p} value={p} className="font-body capitalize">{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Area</Label>
                <Select value={form.area} onValueChange={(v) => setForm((f) => ({ ...f, area: v as TaskArea }))}>
                  <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{(["Personal","Work","Health","Money","Home","Learning","Other"] as const).map((a) => <SelectItem key={a} value={a} className="font-body">{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="font-body text-xs mb-1 block">Due Date (optional)</Label>
              <Input type="date" value={form.dueDate ?? ""} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value || undefined }))} className="font-body" />
            </div>
            <div>
              <Label className="font-body text-xs mb-1 block">Next Action (optional)</Label>
              <Input value={form.nextAction ?? ""} onChange={(e) => setForm((f) => ({ ...f, nextAction: e.target.value || undefined }))} placeholder="What is the next step?" className="font-body" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={save} className="flex-1 bg-primary text-primary-foreground font-body">{editId ? "Save" : "Add Task"}</Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="font-body">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
