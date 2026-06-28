import { useState } from "react";
import { usePersonalData } from "@/hooks/usePersonalData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Plus, FolderKanban, ChevronDown, ChevronUp, CheckCircle2, Archive } from "lucide-react";
import type { Project, ProjectStatus } from "@/lib/personal-types";

const COLOR_OPTIONS = [
  { value: "#e66e52", label: "Coral" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#22c55e", label: "Green" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#f97316", label: "Orange" },
];

const STATUS_OPTIONS: { value: ProjectStatus; label: string; badge: string }[] = [
  { value: "active", label: "Active", badge: "bg-green-100 text-green-700 border-green-200" },
  { value: "paused", label: "Paused", badge: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "done", label: "Done", badge: "bg-slate-100 text-slate-600 border-slate-200" },
];

interface ProjectForm {
  name: string;
  description: string;
  color: string;
  status: ProjectStatus;
}

const defaultForm: ProjectForm = {
  name: "",
  description: "",
  color: "#3b82f6",
  status: "active",
};

const PersonalProjects = () => {
  const { projects, setProjects } = usePersonalData();

  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState<ProjectForm>(defaultForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addTaskText, setAddTaskText] = useState<Record<string, string>>({});
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [editForm, setEditForm] = useState<ProjectForm>(defaultForm);

  function addProject() {
    if (!form.name.trim()) return;
    const p: Project = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      description: form.description || undefined,
      color: form.color,
      status: form.status,
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => [p, ...prev]);
    setForm(defaultForm);
    setNewOpen(false);
  }

  function openEditProject(p: Project) {
    setEditProject(p);
    setEditForm({ name: p.name, description: p.description ?? "", color: p.color, status: p.status });
  }

  function saveEdit() {
    if (!editProject) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === editProject.id
          ? { ...p, name: editForm.name, description: editForm.description || undefined, color: editForm.color, status: editForm.status, updatedAt: new Date().toISOString() }
          : p
      )
    );
    setEditProject(null);
  }

  function deleteProject(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setEditProject(null);
  }

  function toggleTask(projectId: string, taskId: string) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)), updatedAt: new Date().toISOString() }
          : p
      )
    );
  }

  function addTaskToProject(projectId: string) {
    const text = addTaskText[projectId]?.trim();
    if (!text) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, tasks: [...p.tasks, { id: crypto.randomUUID(), title: text, done: false }], updatedAt: new Date().toISOString() }
          : p
      )
    );
    setAddTaskText((prev) => ({ ...prev, [projectId]: "" }));
  }

  function archiveProject(id: string) {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "done", updatedAt: new Date().toISOString() } : p))
    );
  }

  const active = projects.filter((p) => p.status !== "done");
  const done = projects.filter((p) => p.status === "done");

  function ProjectCard({ p }: { p: Project }) {
    const expanded = expandedId === p.id;
    const total = p.tasks.length;
    const doneCount = p.tasks.filter((t) => t.done).length;
    const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    const statusInfo = STATUS_OPTIONS.find((s) => s.value === p.status)!;

    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start gap-2">
            <span className="h-3 w-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: p.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">{p.name}</CardTitle>
                <Badge variant="outline" className={`text-xs ${statusInfo.badge}`}>{p.status}</Badge>
              </div>
              {p.description && <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditProject(p)}>
                ✎
              </Button>
              {p.status !== "done" && (
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Mark done" onClick={() => archiveProject(p.id)}>
                  <Archive className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedId(expanded ? null : p.id)}>
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {total > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{doneCount}/{total} tasks</span>
                <span>{pct}%</span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          )}
        </CardHeader>
        {expanded && (
          <CardContent>
            <div className="flex flex-col gap-2 mb-3">
              {p.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks yet.</p>
              ) : (
                p.tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={t.done}
                      onCheckedChange={() => toggleTask(p.id, t.id)}
                    />
                    <span className={`text-sm ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={addTaskText[p.id] ?? ""}
                onChange={(e) => setAddTaskText((prev) => ({ ...prev, [p.id]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") addTaskToProject(p.id); }}
                placeholder="Add task..."
                className="h-8 text-sm"
              />
              <Button size="sm" variant="outline" onClick={() => addTaskToProject(p.id)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Projects</h1>
          <Badge variant="secondary">{active.length} active</Badge>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" /> New Project</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
            <ProjectFormContent form={form} setForm={setForm} onSave={addProject} />
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <FolderKanban className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">No projects yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {active.map((p) => <ProjectCard key={p.id} p={p} />)}
          {done.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-4">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Completed</span>
              </div>
              {done.map((p) => <ProjectCard key={p.id} p={p} />)}
            </>
          )}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editProject} onOpenChange={(o) => !o && setEditProject(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>
          <ProjectFormContent
            form={editForm}
            setForm={setEditForm}
            onSave={saveEdit}
            onDelete={() => editProject && deleteProject(editProject.id)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface ProjectFormContentProps {
  form: ProjectForm;
  setForm: (f: ProjectForm) => void;
  onSave: () => void;
  onDelete?: () => void;
}

function ProjectFormContent({ form, setForm, onSave, onDelete }: ProjectFormContentProps) {
  return (
    <div className="flex flex-col gap-3 pt-1">
      <div>
        <Label>Name *</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Project name" className="mt-1" autoFocus />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Color</Label>
          <Select value={form.color} onValueChange={(v) => setForm({ ...form, color: v })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {COLOR_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full inline-block" style={{ backgroundColor: c.value }} />
                    {c.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProjectStatus })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button onClick={onSave} disabled={!form.name.trim()} className="flex-1">Save</Button>
        {onDelete && <Button variant="destructive" onClick={onDelete}>Delete</Button>}
      </div>
    </div>
  );
}

export default PersonalProjects;
