import { useState } from "react";
import { usePersonalData } from "@/hooks/usePersonalData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ClipboardList, Calendar, Clock } from "lucide-react";
import type { Task, TaskArea, TaskPriority, TaskStatus, TaskEffort } from "@/lib/personal-types";

type FilterTab = "all" | "open" | "paused" | "done" | "archived";

const PRIORITIES: TaskPriority[] = ["critical", "high", "medium", "low"];
const AREAS: TaskArea[] = ["Personal", "Work", "Health", "Money", "Home", "Learning", "Other"];
const EFFORTS: TaskEffort[] = ["light", "medium", "heavy"];
const STATUSES: TaskStatus[] = ["open", "paused", "done", "archived"];

const priorityBadge: Record<TaskPriority, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

const effortBadge: Record<TaskEffort, string> = {
  light: "bg-green-100 text-green-700",
  medium: "bg-blue-100 text-blue-700",
  heavy: "bg-purple-100 text-purple-700",
};

const filterLabels: Record<FilterTab, string> = {
  all: "All",
  open: "Open",
  paused: "Paused",
  done: "Done",
  archived: "Archived",
};

interface TaskFormState {
  title: string;
  area: TaskArea;
  priority: TaskPriority;
  timeEstimate: string;
  dueDate: string;
  effort: TaskEffort;
  status: TaskStatus;
  nextAction: string;
}

const defaultForm: TaskFormState = {
  title: "",
  area: "Personal",
  priority: "medium",
  timeEstimate: "",
  dueDate: "",
  effort: "light",
  status: "open",
  nextAction: "",
};

const PersonalTasks = () => {
  const { tasks, setTasks } = usePersonalData();

  const [filter, setFilter] = useState<FilterTab>("open");
  const [newOpen, setNewOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskFormState>(defaultForm);
  const [editForm, setEditForm] = useState<TaskFormState>(defaultForm);

  function openEdit(t: Task) {
    setEditTask(t);
    setEditForm({
      title: t.title,
      area: t.area,
      priority: t.priority,
      timeEstimate: t.timeEstimate ? String(t.timeEstimate) : "",
      dueDate: t.dueDate ?? "",
      effort: t.effort ?? "light",
      status: t.status,
      nextAction: t.nextAction ?? "",
    });
  }

  function saveNew() {
    if (!form.title.trim()) return;
    const t: Task = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      area: form.area,
      priority: form.priority,
      status: form.status,
      timeEstimate: form.timeEstimate ? Number(form.timeEstimate) : undefined,
      dueDate: form.dueDate || undefined,
      effort: form.effort,
      nextAction: form.nextAction || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [t, ...prev]);
    setForm(defaultForm);
    setNewOpen(false);
  }

  function saveEdit() {
    if (!editTask || !editForm.title.trim()) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === editTask.id
          ? {
              ...t,
              title: editForm.title.trim(),
              area: editForm.area,
              priority: editForm.priority,
              status: editForm.status,
              timeEstimate: editForm.timeEstimate ? Number(editForm.timeEstimate) : undefined,
              dueDate: editForm.dueDate || undefined,
              effort: editForm.effort,
              nextAction: editForm.nextAction || undefined,
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
    setEditTask(null);
  }

  function toggleDone(t: Task) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === t.id
          ? { ...task, status: task.status === "done" ? "open" : "done", updatedAt: new Date().toISOString() }
          : task
      )
    );
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setEditTask(null);
  }

  const filtered = tasks.filter((t) => filter === "all" || t.status === filter);

  const grouped = PRIORITIES.map((p) => ({
    priority: p,
    items: filtered.filter((t) => t.priority === p),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Tasks</h1>
          <Badge variant="secondary">{tasks.filter((t) => t.status === "open").length} open</Badge>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New Task</DialogTitle>
            </DialogHeader>
            <TaskForm form={form} setForm={setForm} onSave={saveNew} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1 border-b pb-2 overflow-x-auto">
        {(Object.keys(filterLabels) as FilterTab[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-t text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {filterLabels[f]}
            <span className="ml-1 text-xs opacity-70">
              ({tasks.filter((t) => f === "all" || t.status === f).length})
            </span>
          </button>
        ))}
      </div>

      {/* Grouped list */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ClipboardList className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">No tasks here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(({ priority, items }) => (
            <div key={priority}>
              <div className="mb-2 flex items-center gap-2">
                <span className={`inline-block h-2 w-2 rounded-full ${
                  priority === "critical" ? "bg-red-500" :
                  priority === "high" ? "bg-orange-400" :
                  priority === "medium" ? "bg-yellow-400" : "bg-slate-400"
                }`} />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {priority}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((t) => (
                  <Card
                    key={t.id}
                    className="cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => openEdit(t)}
                  >
                    <CardContent className="flex items-start gap-3 p-3">
                      <Checkbox
                        checked={t.status === "done"}
                        onCheckedChange={(e) => { e.stopPropagation?.(); toggleDone(t); }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                          {t.title}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                          <Badge variant="outline" className={`text-xs ${priorityBadge[t.priority]}`}>
                            {t.priority}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">{t.area}</Badge>
                          {t.effort && (
                            <Badge variant="outline" className={`text-xs ${effortBadge[t.effort]}`}>
                              {t.effort}
                            </Badge>
                          )}
                          {t.dueDate && (
                            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" /> {t.dueDate}
                            </span>
                          )}
                          {t.timeEstimate && (
                            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" /> {t.timeEstimate}m
                            </span>
                          )}
                        </div>
                        {t.nextAction && (
                          <p className="mt-1 text-xs text-muted-foreground">→ {t.nextAction}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editTask} onOpenChange={(o) => !o && setEditTask(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <TaskForm
            form={editForm}
            setForm={setEditForm}
            onSave={saveEdit}
            showStatus
            onDelete={() => editTask && deleteTask(editTask.id)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface TaskFormProps {
  form: TaskFormState;
  setForm: (f: TaskFormState) => void;
  onSave: () => void;
  showStatus?: boolean;
  onDelete?: () => void;
}

function TaskForm({ form, setForm, onSave, showStatus, onDelete }: TaskFormProps) {
  const set = (k: keyof TaskFormState, v: string) => setForm({ ...form, [k]: v });

  return (
    <div className="flex flex-col gap-3 pt-1">
      <div>
        <Label>Title *</Label>
        <Input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Task title"
          className="mt-1"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Area</Label>
          <Select value={form.area} onValueChange={(v) => set("area", v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Priority</Label>
          <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Effort</Label>
          <Select value={form.effort} onValueChange={(v) => set("effort", v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {EFFORTS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Time (min)</Label>
          <Input
            type="number"
            value={form.timeEstimate}
            onChange={(e) => set("timeEstimate", e.target.value)}
            placeholder="e.g. 30"
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label>Due Date</Label>
        <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} className="mt-1" />
      </div>
      {showStatus && (
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label>Next Action</Label>
        <Input
          value={form.nextAction}
          onChange={(e) => set("nextAction", e.target.value)}
          placeholder="What's the very next step?"
          className="mt-1"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button onClick={onSave} disabled={!form.title.trim()} className="flex-1">
          Save
        </Button>
        {onDelete && (
          <Button variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

export default PersonalTasks;
