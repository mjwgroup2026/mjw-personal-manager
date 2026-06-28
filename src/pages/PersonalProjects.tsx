import { useState } from "react";
import { usePersonalData } from "@/hooks/usePersonalData";
import type { Project, ProjectStatus, ProjectTask } from "@/lib/personal-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, CheckSquare, Square, FolderKanban } from "lucide-react";

const statusColor: Record<ProjectStatus, string> = {
  active: "bg-green-100 text-green-700", paused: "bg-yellow-100 text-yellow-700", done: "bg-muted text-muted-foreground",
};
const blank = (): Partial<Project> => ({ name: "", description: "", color: "#3b82f6", status: "active", tasks: [] });

export default function PersonalProjects() {
  const { projects, setProjects } = usePersonalData();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Project>>(blank());
  const [newTask, setNewTask] = useState("");
  const [filter, setFilter] = useState<ProjectStatus | "all">("all");

  const filtered = projects.filter((p) => filter === "all" || p.status === filter);

  const save = () => {
    if (!form.name?.trim()) return;
    const now = new Date().toISOString();
    if (editId) {
      setProjects((prev) => prev.map((p) => p.id === editId ? { ...p, ...form, updatedAt: now } as Project : p));
    } else {
      setProjects((prev) => [...prev, { ...form, id: crypto.randomUUID(), tasks: form.tasks ?? [], createdAt: now, updatedAt: now } as Project]);
    }
    setOpen(false); setForm(blank()); setEditId(null); setNewTask("");
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setForm((f) => ({ ...f, tasks: [...(f.tasks ?? []), { id: crypto.randomUUID(), title: newTask.trim(), done: false }] }));
    setNewTask("");
  };
  const removeFormTask = (id: string) => setForm((f) => ({ ...f, tasks: (f.tasks ?? []).filter((t) => t.id !== id) }));

  const toggleTask = (projectId: string, taskId: string) => {
    setProjects((prev) => prev.map((p) => {
      if (p.id !== projectId) return p;
      return { ...p, tasks: p.tasks.map((t) => t.id === taskId ? { ...t, done: !t.done } : t) };
    }));
  };

  const remove = (id: string) => setProjects((prev) => prev.filter((p) => p.id !== id));
  const openEdit = (p: Project) => {
    setForm({ name: p.name, description: p.description, color: p.color, status: p.status, tasks: [...p.tasks] });
    setEditId(p.id); setOpen(true);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2"><FolderKanban className="h-6 w-6 text-primary" />Projects</h1>
        <Button size="sm" className="bg-primary text-primary-foreground font-body" onClick={() => { setForm(blank()); setEditId(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> New Project
        </Button>
      </div>
      <div className="flex gap-2 mb-4">
        {(["all","active","paused","done"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-body font-medium transition-colors ${filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-sm text-muted-foreground font-body text-center py-10">No projects yet.</p>}
      <div className="space-y-3">
        {filtered.map((p) => {
          const done = p.tasks.filter((t) => t.done).length;
          const pct = p.tasks.length ? Math.round((done / p.tasks.length) * 100) : 0;
          return (
            <Card key={p.id}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => openEdit(p)}>
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ background: p.color }} />
                    <CardTitle className="text-sm font-body font-bold">{p.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-body font-semibold ${statusColor[p.status]}`}>{p.status}</span>
                    <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                {p.description && <p className="text-xs text-muted-foreground font-body pl-5">{p.description}</p>}
                {p.tasks.length > 0 && (
                  <div className="pl-5 mt-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-body shrink-0">{done}/{p.tasks.length}</span>
                    </div>
                  </div>
                )}
              </CardHeader>
              {p.tasks.length > 0 && (
                <CardContent className="px-4 pb-3 space-y-1">
                  {p.tasks.map((t) => (
                    <button key={t.id} onClick={() => toggleTask(p.id, t.id)}
                      className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded px-1 py-0.5 transition-colors">
                      {t.done ? <CheckSquare className="h-3.5 w-3.5 text-green-500 shrink-0" /> : <Square className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                      <span className={`text-xs font-body ${t.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.title}</span>
                    </button>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">{editId ? "Edit Project" : "New Project"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div><Label className="font-body text-xs mb-1 block">Project Name *</Label><Input value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Project name" className="font-body" /></div>
            <div><Label className="font-body text-xs mb-1 block">Description</Label><Input value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What is this project about?" className="font-body" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-body text-xs mb-1 block">Status</Label>
                <Select value={form.status ?? "active"} onValueChange={(v) => setForm((f) => ({ ...f, status: v as ProjectStatus }))}>
                  <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{(["active","paused","done"] as const).map((s) => <SelectItem key={s} value={s} className="font-body capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="font-body text-xs mb-1 block">Colour</Label><Input type="color" value={form.color ?? "#3b82f6"} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} className="h-10 cursor-pointer" /></div>
            </div>
            <div>
              <Label className="font-body text-xs mb-1 block">Tasks</Label>
              <div className="flex gap-2">
                <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} placeholder="Add a task and press Enter" className="font-body text-sm" />
                <Button variant="outline" size="sm" onClick={addTask} className="font-body shrink-0">Add</Button>
              </div>
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {(form.tasks ?? []).map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-xs font-body bg-muted/50 rounded px-2 py-1">
                    <span className="flex-1">{t.title}</span>
                    <button onClick={() => removeFormTask(t.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={save} className="flex-1 bg-primary text-primary-foreground font-body">{editId ? "Save" : "Create Project"}</Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="font-body">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
