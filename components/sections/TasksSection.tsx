"use client";
import { Check, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Priority, Task } from "@/lib/types";
import { Field, Modal, inputStyle, selectStyle } from "@/components/ui/Modal";

const AREAS = ["Personal", "Work", "Health", "Money", "Home", "Learning", "Other"];
const PRIORITIES: Priority[] = ["critical", "high", "medium", "low"];

export function TasksSection({
  tasks,
  onChange,
  onToast,
}: {
  tasks: Task[];
  onChange: (t: Task[]) => void;
  onToast: (msg: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");

  const filtered = tasks.filter((t) =>
    filter === "all" ? true : filter === "open" ? !t.done : t.done
  );

  function toggle(id: number) {
    onChange(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function remove(id: number) {
    onChange(tasks.filter((t) => t.id !== id));
    onToast("Task removed");
    setMenuId(null);
  }

  function save(data: Omit<Task, "id" | "done">) {
    if (editTask) {
      onChange(tasks.map((t) => (t.id === editTask.id ? { ...t, ...data } : t)));
      onToast("Task updated");
      setEditTask(null);
    } else {
      onChange([...tasks, { id: Date.now(), done: false, ...data }]);
      onToast("Task added");
      setShowAdd(false);
    }
  }

  return (
    <div>
      <div className="section-hero">
        <div className="section-icon">
          <Check size={24} />
        </div>
        <div>
          <span className="eyebrow">Your space</span>
          <h1>Tasks</h1>
          <p>Capture, clarify, and finish what matters.</p>
        </div>
        <button className="primary-btn" style={{ marginLeft: "auto" }} onClick={() => setShowAdd(true)}>
          <Plus size={17} /> Add task
        </button>
      </div>

      {/* filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["all", "open", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              border: "1px solid var(--line)",
              background: filter === f ? "var(--accent)" : "var(--surface)",
              color: filter === f ? "#fff" : "var(--text)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {f === "all" ? `All (${tasks.length})` : f === "open" ? `Open (${tasks.filter((t) => !t.done).length})` : `Done (${tasks.filter((t) => t.done).length})`}
          </button>
        ))}
      </div>

      <section className="panel wide-panel">
        <div className="task-list">
          {filtered.length === 0 && (
            <p style={{ padding: "24px 0", color: "var(--muted)", fontSize: 13, textAlign: "center" }}>
              No tasks here yet.
            </p>
          )}
          {filtered.map((task) => (
            <div key={task.id} className={task.done ? "task-row done" : "task-row"} style={{ position: "relative" }}>
              <button className="check-btn" onClick={() => toggle(task.id)} aria-label="Toggle">
                {task.done ? <Check size={15} /> : null}
              </button>
              <div className="task-copy">
                <strong>{task.title}</strong>
                <span>{task.area}<i />{task.time}{task.dueDate && <><i />Due {new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short" }).format(new Date(task.dueDate + "T00:00:00"))}</>}</span>
              </div>
              <span className={`priority ${task.priority}`}>{task.priority}</span>
              <button
                className="row-menu"
                onClick={() => setMenuId(menuId === task.id ? null : task.id)}
                aria-label="Options"
              >
                <MoreHorizontal size={18} />
              </button>
              {menuId === task.id && (
                <div
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "100%",
                    zIndex: 50,
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    borderRadius: 11,
                    boxShadow: "var(--shadow)",
                    minWidth: 130,
                    overflow: "hidden",
                  }}
                  onMouseLeave={() => setMenuId(null)}
                >
                  <button
                    onClick={() => { setEditTask(task); setMenuId(null); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", border: 0, background: "none", cursor: "pointer", fontSize: 12 }}
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    onClick={() => remove(task.id)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", border: 0, background: "none", cursor: "pointer", fontSize: 12, color: "#c0392b" }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <button className="add-row" onClick={() => setShowAdd(true)}>
          <Plus size={17} /> Add a task
        </button>
      </section>

      {(showAdd || editTask) && (
        <TaskModal
          initial={editTask ?? undefined}
          onSave={save}
          onClose={() => { setShowAdd(false); setEditTask(null); }}
        />
      )}
    </div>
  );
}

function TaskModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Task;
  onSave: (data: Omit<Task, "id" | "done">) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [area, setArea] = useState(initial?.area ?? "Personal");
  const [time, setTime] = useState(initial?.time ?? "15 min");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [nextAction, setNextAction] = useState(initial?.nextAction ?? "");

  return (
    <Modal title={initial ? "Edit task" : "Add task"} onClose={onClose}>
      <Field label="What needs doing?">
        <input style={inputStyle} autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Call the dentist" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        <Field label="Area">
          <select style={selectStyle} value={area} onChange={(e) => setArea(e.target.value)}>
            {AREAS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Time estimate">
          <input style={inputStyle} value={time} onChange={(e) => setTime(e.target.value)} placeholder="15 min" />
        </Field>
        <Field label="Priority">
          <select style={selectStyle} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Due date">
          <input style={inputStyle} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
      </div>
      <Field label="Next action (optional)">
        <input style={inputStyle} value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="e.g. Email Sarah with the draft" />
      </Field>
      <div className="modal-actions">
        <button className="secondary-btn" onClick={onClose}>Cancel</button>
        <button
          className="primary-btn"
          onClick={() => { if (title.trim()) onSave({ title: title.trim(), area, time, priority, dueDate: dueDate || undefined, nextAction: nextAction || undefined }); }}
        >
          {initial ? "Save changes" : "Add task"}
        </button>
      </div>
    </Modal>
  );
}
