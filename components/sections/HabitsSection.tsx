"use client";
import { Check, Circle, Flame, Pencil, Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Habit } from "@/lib/types";
import { Field, Modal, inputStyle, selectStyle } from "@/components/ui/Modal";

const COLORS = ["coral", "blue", "purple", "green", "gold", "rose"];
const COLOR_HEX: Record<string, string> = {
  coral: "#ed927d", blue: "#80a7ba", purple: "#9c8db2", green: "#7fa087", gold: "#c9980a", rose: "#c97db0",
};

export function HabitsSection({
  habits,
  onChange,
  onToast,
}: {
  habits: Habit[];
  onChange: (h: Habit[]) => void;
  onToast: (msg: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);

  function toggle(id: number) {
    onChange(
      habits.map((h) =>
        h.id === id ? { ...h, done: !h.done, streak: h.done ? Math.max(0, h.streak - 1) : h.streak + 1 } : h
      )
    );
  }

  function remove(id: number) {
    onChange(habits.filter((h) => h.id !== id));
    onToast("Habit removed");
  }

  function save(data: Omit<Habit, "id" | "done" | "streak">) {
    if (editHabit) {
      onChange(habits.map((h) => (h.id === editHabit.id ? { ...h, ...data } : h)));
      onToast("Habit updated");
      setEditHabit(null);
    } else {
      onChange([...habits, { id: Date.now(), done: false, streak: 0, ...data }]);
      onToast("Habit added");
      setShowAdd(false);
    }
  }

  const done = habits.filter((h) => h.done).length;

  return (
    <div>
      <div className="section-hero">
        <div className="section-icon"><Flame size={24} /></div>
        <div>
          <span className="eyebrow">Your space</span>
          <h1>Habits</h1>
          <p>Build a healthy rhythm you can actually live with.</p>
        </div>
        <button className="primary-btn" style={{ marginLeft: "auto" }} onClick={() => setShowAdd(true)}>
          <Plus size={17} /> Add habit
        </button>
      </div>

      {/* progress bar */}
      <div style={{ marginBottom: 24, padding: "16px 20px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
          <span style={{ color: "var(--muted)" }}>Today's progress</span>
          <strong>{done} / {habits.length} checked in</strong>
        </div>
        <div style={{ height: 8, borderRadius: 8, background: "var(--line)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: habits.length ? `${(done / habits.length) * 100}%` : "0%", background: "var(--accent)", borderRadius: 8, transition: "width .3s" }} />
        </div>
      </div>

      <div className="habit-cards">
        {habits.map((habit) => (
          <div key={habit.id} style={{ position: "relative" }}>
            <button
              className={`habit-card ${habit.done ? "done" : ""}`}
              onClick={() => toggle(habit.id)}
              style={{ width: "100%" }}
            >
              <span className="habit-orb" style={{ background: COLOR_HEX[habit.color] ?? COLOR_HEX.coral }}>
                {habit.done ? <Check size={22} /> : <Circle size={22} />}
              </span>
              <strong>{habit.name}</strong>
              <small style={{ color: "var(--muted)" }}>{habit.detail}</small>
              {habit.goal && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, fontSize: 10, color: "var(--muted)" }}>
                  <Target size={12} /> Goal: {habit.goal}
                </div>
              )}
              <span className="streak"><Flame size={14} />{habit.done ? `${habit.streak} day streak` : "Check in"}</span>
            </button>
            {/* edit / delete controls */}
            <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setEditHabit(habit)}
                style={{ width: 26, height: 26, display: "grid", placeItems: "center", borderRadius: 7, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer" }}
                aria-label="Edit"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={() => remove(habit.id)}
                style={{ width: 26, height: 26, display: "grid", placeItems: "center", borderRadius: 7, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer", color: "#c0392b" }}
                aria-label="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}

        {/* add card */}
        <button
          onClick={() => setShowAdd(true)}
          style={{
            minHeight: 220,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: 22,
            border: "2px dashed var(--line)",
            borderRadius: 18,
            background: "transparent",
            cursor: "pointer",
            color: "var(--muted)",
            fontSize: 12,
          }}
        >
          <Plus size={28} />
          Add a habit
        </button>
      </div>

      {(showAdd || editHabit) && (
        <HabitModal
          initial={editHabit ?? undefined}
          onSave={save}
          onClose={() => { setShowAdd(false); setEditHabit(null); }}
        />
      )}
    </div>
  );
}

function HabitModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Habit;
  onSave: (data: Omit<Habit, "id" | "done" | "streak">) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [detail, setDetail] = useState(initial?.detail ?? "");
  const [goal, setGoal] = useState(initial?.goal ?? "");
  const [color, setColor] = useState(initial?.color ?? "coral");

  return (
    <Modal title={initial ? "Edit habit" : "Add habit"} onClose={onClose}>
      <Field label="Habit name">
        <input style={inputStyle} autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Morning run" />
      </Field>
      <Field label="Daily target">
        <input style={inputStyle} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="e.g. 30 min" />
      </Field>
      <Field label="Long-term goal (optional)">
        <input style={inputStyle} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Run 5km by August" />
      </Field>
      <Field label="Colour">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: COLOR_HEX[c],
                border: color === c ? "3px solid var(--text)" : "3px solid transparent",
                cursor: "pointer",
              }}
              aria-label={c}
            />
          ))}
        </div>
      </Field>
      <div className="modal-actions">
        <button className="secondary-btn" onClick={onClose}>Cancel</button>
        <button
          className="primary-btn"
          onClick={() => { if (name.trim()) onSave({ name: name.trim(), detail, goal, color }); }}
        >
          {initial ? "Save changes" : "Add habit"}
        </button>
      </div>
    </Modal>
  );
}
