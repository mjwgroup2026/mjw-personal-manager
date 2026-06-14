"use client";
import { Check, ChevronLeft, FolderKanban, Pencil, Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Project, ProjectGoal, ProjectTask } from "@/lib/types";
import { Field, Modal, inputStyle, selectStyle, textareaStyle } from "@/components/ui/Modal";

const COLORS = ["coral", "blue", "purple", "green", "gold", "rose"];
const COLOR_HEX: Record<string, string> = { coral: "#ed927d", blue: "#80a7ba", purple: "#9c8db2", green: "#7fa087", gold: "#c9980a", rose: "#c97db0" };
const STATUSES = ["active", "paused", "done"] as const;

export function ProjectsSection({
  projects,
  onChange,
  onToast,
}: {
  projects: Project[];
  onChange: (p: Project[]) => void;
  onToast: (msg: string) => void;
}) {
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<Project | null>(null);
  const [open, setOpen] = useState<Project | null>(null);

  // Keep open in sync with latest data
  const openProject = open ? projects.find((p) => p.id === open.id) ?? null : null;

  function saveProject(data: Omit<Project, "id" | "tasks" | "goals">) {
    if (edit) {
      onChange(projects.map((p) => p.id === edit.id ? { ...p, ...data } : p));
      onToast("Project updated"); setEdit(null);
    } else {
      onChange([...projects, { id: Date.now(), tasks: [], goals: [], ...data }]);
      onToast("Project created"); setShow(false);
    }
  }

  function remove(id: number) {
    onChange(projects.filter((p) => p.id !== id));
    if (openProject?.id === id) setOpen(null);
    onToast("Project removed");
  }

  function updateProject(updated: Project) {
    onChange(projects.map((p) => p.id === updated.id ? updated : p));
    setOpen(updated);
  }

  if (openProject) {
    return <ProjectDetail project={openProject} onBack={() => setOpen(null)} onUpdate={updateProject} onDelete={() => { remove(openProject.id); }} onToast={onToast} />;
  }

  return (
    <div>
      <div className="section-hero">
        <div className="section-icon"><FolderKanban size={24} /></div>
        <div>
          <span className="eyebrow">Your space</span>
          <h1>Projects</h1>
          <p>Keep outcomes visible and next steps small.</p>
        </div>
        <button className="primary-btn" style={{ marginLeft: "auto" }} onClick={() => setShow(true)}>
          <Plus size={17} /> New project
        </button>
      </div>

      {/* summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Active", value: projects.filter((p) => p.status === "active").length, color: "#e3eee5" },
          { label: "Paused", value: projects.filter((p) => p.status === "paused").length, color: "#ece8f4" },
          { label: "Done", value: projects.filter((p) => p.status === "done").length, color: "#e2edf1" },
        ].map((s) => (
          <div key={s.label} style={{ padding: "16px 20px", borderRadius: 16, background: s.color }}>
            <p style={{ margin: 0, fontSize: 10, color: "#696d67", fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase" }}>{s.label}</p>
            <strong style={{ fontSize: 28 }}>{s.value}</strong>
          </div>
        ))}
      </div>

      <div className="project-cards">
        {projects.map((p) => {
          const doneTasks = p.tasks.filter((t) => t.done).length;
          const progress = p.tasks.length ? Math.round((doneTasks / p.tasks.length) * 100) : 0;
          return (
            <article key={p.id} className="project-card" style={{ cursor: "default" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <div className="project-big-icon" style={{ background: COLOR_HEX[p.color] ?? COLOR_HEX.coral, marginBottom: 0 }}>
                  <Target size={23} />
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setEdit(p)} style={iconBtnStyle}><Pencil size={13} /></button>
                  <button onClick={() => remove(p.id)} style={{ ...iconBtnStyle, color: "#c0392b" }}><Trash2 size={13} /></button>
                </div>
              </div>
              <span className="eyebrow" style={{ textTransform: "capitalize" }}>{p.status}</span>
              <h2 style={{ margin: "6px 0 8px" }}>{p.name}</h2>
              <p style={{ margin: 0, minHeight: 0 }}>{p.description}</p>
              <div className="project-progress" style={{ marginTop: 16 }}>
                <span><strong>{progress}%</strong> complete · {doneTasks}/{p.tasks.length} tasks</span>
                <i style={{ marginTop: 8 }}><b style={{ width: `${progress}%`, background: COLOR_HEX[p.color] ?? COLOR_HEX.coral }} /></i>
              </div>
              <button onClick={() => setOpen(p)} style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 20, padding: 0, border: 0, color: "var(--accent-dark)", background: "none", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                Open project <ChevronLeft size={16} style={{ transform: "rotate(180deg)" }} />
              </button>
            </article>
          );
        })}
        <button onClick={() => setShow(true)} style={addCardStyle}>
          <Plus size={32} />New project
        </button>
      </div>

      {(show || edit) && (
        <ProjectModal initial={edit ?? undefined} onSave={saveProject} onClose={() => { setShow(false); setEdit(null); }} />
      )}
    </div>
  );
}

function ProjectDetail({ project, onBack, onUpdate, onDelete, onToast }: {
  project: Project;
  onBack: () => void;
  onUpdate: (p: Project) => void;
  onDelete: () => void;
  onToast: (msg: string) => void;
}) {
  const [newTask, setNewTask] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [editTask, setEditTask] = useState<ProjectTask | null>(null);
  const [editTaskText, setEditTaskText] = useState("");

  function addTask() {
    if (!newTask.trim()) return;
    onUpdate({ ...project, tasks: [...project.tasks, { id: Date.now(), title: newTask.trim(), done: false }] });
    setNewTask(""); onToast("Task added");
  }

  function toggleTask(id: number) {
    onUpdate({ ...project, tasks: project.tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t) });
  }

  function saveEditTask() {
    if (!editTask || !editTaskText.trim()) return;
    onUpdate({ ...project, tasks: project.tasks.map((t) => t.id === editTask.id ? { ...t, title: editTaskText.trim() } : t) });
    setEditTask(null); setEditTaskText("");
  }

  function removeTask(id: number) { onUpdate({ ...project, tasks: project.tasks.filter((t) => t.id !== id) }); }

  function addGoal() {
    if (!newGoal.trim()) return;
    onUpdate({ ...project, goals: [...project.goals, { id: Date.now(), title: newGoal.trim(), done: false }] });
    setNewGoal(""); onToast("Goal added");
  }

  function toggleGoal(id: number) {
    onUpdate({ ...project, goals: project.goals.map((g) => g.id === id ? { ...g, done: !g.done } : g) });
  }

  function removeGoal(id: number) { onUpdate({ ...project, goals: project.goals.filter((g) => g.id !== id) }); }

  const doneTasks = project.tasks.filter((t) => t.done).length;
  const progress = project.tasks.length ? Math.round((doneTasks / project.tasks.length) * 100) : 0;

  return (
    <div>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, padding: "8px 0", border: 0, background: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer" }}>
        <ChevronLeft size={16} /> Back to projects
      </button>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 24 }}>
        <div style={{ width: 54, height: 54, display: "grid", placeItems: "center", borderRadius: 16, background: COLOR_HEX[project.color] ?? COLOR_HEX.coral }}>
          <Target size={26} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <span className="eyebrow" style={{ textTransform: "capitalize" }}>{project.status}</span>
          <h1 style={{ margin: "4px 0 4px", fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 500, letterSpacing: "-.8px" }}>{project.name}</h1>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>{project.description}</p>
        </div>
        <button onClick={onDelete} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid #fcc", background: "#fff5f5", color: "#c0392b", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          <Trash2 size={14} /> Delete project
        </button>
      </div>

      {/* progress bar */}
      <div style={{ padding: "16px 20px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
          <span style={{ color: "var(--muted)" }}>Overall progress</span>
          <strong>{progress}% · {doneTasks}/{project.tasks.length} tasks done</strong>
        </div>
        <div style={{ height: 8, borderRadius: 8, background: "var(--line)" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: COLOR_HEX[project.color] ?? COLOR_HEX.coral, borderRadius: 8, transition: "width .3s" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
        {/* Tasks */}
        <section className="panel" style={{ padding: 22 }}>
          <div className="panel-head"><div><h2>Tasks</h2><p>{doneTasks} of {project.tasks.length} done</p></div></div>
          <div className="task-list">
            {project.tasks.map((t) => (
              <div key={t.id} className={t.done ? "task-row done" : "task-row"}>
                <button className="check-btn" onClick={() => toggleTask(t.id)}>{t.done ? <Check size={15} /> : null}</button>
                {editTask?.id === t.id ? (
                  <input style={{ ...inputStyle, height: 32, flex: 1, fontSize: 12 }} value={editTaskText} onChange={(e) => setEditTaskText(e.target.value)} onBlur={saveEditTask} onKeyDown={(e) => e.key === "Enter" && saveEditTask()} autoFocus />
                ) : (
                  <div className="task-copy"><strong>{t.title}</strong></div>
                )}
                <button onClick={() => { setEditTask(t); setEditTaskText(t.title); }} style={iconBtnSmall}><Pencil size={12} /></button>
                <button onClick={() => removeTask(t.id)} style={{ ...iconBtnSmall, color: "#c0392b" }}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input style={{ ...inputStyle, height: 38, flex: 1 }} value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a task..." onKeyDown={(e) => e.key === "Enter" && addTask()} />
            <button className="primary-btn" style={{ height: 38, padding: "0 14px" }} onClick={addTask}><Plus size={15} /></button>
          </div>
        </section>

        {/* Goals */}
        <section className="panel" style={{ padding: 22 }}>
          <div className="panel-head"><div><h2>Goals</h2><p>{project.goals.filter((g) => g.done).length} of {project.goals.length} achieved</p></div></div>
          <div style={{ display: "grid", gap: 10 }}>
            {project.goals.map((g) => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: g.done ? "#e3eee5" : "var(--surface-2)", borderRadius: 12 }}>
                <button onClick={() => toggleGoal(g.id)} style={{ width: 22, height: 22, borderRadius: 7, border: g.done ? "0" : "1.5px solid var(--line)", background: g.done ? "#7fa087" : "transparent", display: "grid", placeItems: "center", cursor: "pointer", color: "#fff" }}>
                  {g.done ? <Check size={14} /> : null}
                </button>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, textDecoration: g.done ? "line-through" : "none", color: g.done ? "var(--muted)" : "var(--text)" }}>{g.title}</span>
                <button onClick={() => removeGoal(g.id)} style={{ ...iconBtnSmall, color: "#c0392b" }}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <input style={{ ...inputStyle, height: 38, flex: 1 }} value={newGoal} onChange={(e) => setNewGoal(e.target.value)} placeholder="Add a goal..." onKeyDown={(e) => e.key === "Enter" && addGoal()} />
            <button className="primary-btn" style={{ height: 38, padding: "0 14px" }} onClick={addGoal}><Plus size={15} /></button>
          </div>
        </section>
      </div>
    </div>
  );
}

function ProjectModal({ initial, onSave, onClose }: { initial?: Project; onSave: (d: Omit<Project, "id" | "tasks" | "goals">) => void; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [color, setColor] = useState(initial?.color ?? "coral");
  const [status, setStatus] = useState<Project["status"]>(initial?.status ?? "active");
  return (
    <Modal title={initial ? "Edit project" : "New project"} onClose={onClose}>
      <Field label="Project name"><input style={inputStyle} autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Launch website" /></Field>
      <Field label="Description"><textarea style={textareaStyle} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does success look like?" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Status"><select style={selectStyle} value={status} onChange={(e) => setStatus(e.target.value as Project["status"])}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Colour">
          <div style={{ display: "flex", gap: 8, paddingTop: 6 }}>
            {COLORS.map((c) => <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: "50%", background: COLOR_HEX[c], border: color === c ? "3px solid var(--text)" : "3px solid transparent", cursor: "pointer" }} />)}
          </div>
        </Field>
      </div>
      <div className="modal-actions">
        <button className="secondary-btn" onClick={onClose}>Cancel</button>
        <button className="primary-btn" onClick={() => { if (name.trim()) onSave({ name: name.trim(), description, color, status }); }}>{initial ? "Save" : "Create project"}</button>
      </div>
    </Modal>
  );
}

const iconBtnStyle: React.CSSProperties = { width: 28, height: 28, display: "grid", placeItems: "center", borderRadius: 7, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer", padding: 0 };
const iconBtnSmall: React.CSSProperties = { width: 24, height: 24, display: "grid", placeItems: "center", borderRadius: 6, border: 0, background: "transparent", cursor: "pointer", padding: 0 };
const addCardStyle: React.CSSProperties = { minHeight: 330, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 25, border: "2px dashed var(--line)", borderRadius: 19, background: "transparent", cursor: "pointer", color: "var(--muted)", fontSize: 13 };
