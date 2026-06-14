"use client";
import { BookOpen, Download, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { JournalEntry } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";

const MOODS = [
  { value: "great", emoji: "🌟", label: "Great" },
  { value: "good", emoji: "😊", label: "Good" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "tough", emoji: "😔", label: "Tough" },
] as const;

function today() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso + "T12:00:00"));
}

export function JournalSection({
  entries,
  onChange,
  onToast,
}: {
  entries: JournalEntry[];
  onChange: (e: JournalEntry[]) => void;
  onToast: (msg: string) => void;
}) {
  const [showNew, setShowNew] = useState(false);
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null);
  const [selected, setSelected] = useState<string>(today());

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const todayEntry = entries.find((e) => e.date === today());

  function saveEntry(content: string, mood: JournalEntry["mood"]) {
    if (todayEntry) {
      onChange(entries.map((e) => (e.date === today() ? { ...e, content, mood } : e)));
      onToast("Journal updated");
    } else {
      onChange([...entries, { id: Date.now(), date: today(), content, mood }]);
      onToast("Journal entry saved");
    }
    setShowNew(false);
  }

  function remove(id: number) {
    onChange(entries.filter((e) => e.id !== id));
    setViewEntry(null);
    onToast("Entry deleted");
  }

  function exportJournal() {
    const text = sorted
      .map((e) => {
        const mood = MOODS.find((m) => m.value === e.mood);
        return `${formatDate(e.date)}${mood ? ` — ${mood.emoji} ${mood.label}` : ""}\n${"─".repeat(40)}\n${e.content}\n`;
      })
      .join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mjw-journal-${today()}.txt`;
    a.click();
    onToast("Journal exported");
  }

  return (
    <div>
      <div className="section-hero">
        <div className="section-icon"><BookOpen size={24} /></div>
        <div>
          <span className="eyebrow">Your space</span>
          <h1>Journal</h1>
          <p>A private place to reflect, process, and capture your thoughts.</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          {entries.length > 0 && (
            <button className="secondary-btn" onClick={exportJournal} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Download size={15} /> Export
            </button>
          )}
          <button className="primary-btn" onClick={() => setShowNew(true)}>
            <Plus size={17} /> {todayEntry ? "Edit today" : "Write today"}
          </button>
        </div>
      </div>

      {/* streak / count */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total entries", value: entries.length },
          { label: "This month", value: entries.filter((e) => e.date.startsWith(today().slice(0, 7))).length },
          { label: "Longest streak", value: calcStreak(entries) + " days" },
        ].map((s) => (
          <div key={s.label} style={{ padding: "18px 20px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16 }}>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 10, fontWeight: 700, letterSpacing: ".8px", textTransform: "uppercase" }}>{s.label}</p>
            <strong style={{ fontSize: 28, letterSpacing: "-.5px" }}>{s.value}</strong>
          </div>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--muted)" }}>
          <BookOpen size={40} style={{ margin: "0 auto 16px", opacity: .4 }} />
          <p>Your journal is empty. Write your first entry today.</p>
          <button className="primary-btn" onClick={() => setShowNew(true)} style={{ marginTop: 12 }}>Start writing</button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {sorted.map((entry) => {
            const mood = MOODS.find((m) => m.value === entry.mood);
            return (
              <button
                key={entry.id}
                onClick={() => setViewEntry(entry)}
                style={{
                  width: "100%",
                  padding: "18px 22px",
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: 16,
                  textAlign: "left",
                  cursor: "pointer",
                  boxShadow: "var(--shadow)",
                  transition: ".15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  {mood && <span style={{ fontSize: 20 }}>{mood.emoji}</span>}
                  <strong style={{ fontSize: 13 }}>{formatDate(entry.date)}</strong>
                  {entry.date === today() && (
                    <span style={{ marginLeft: "auto", padding: "3px 10px", borderRadius: 20, background: "var(--accent)", color: "#fff", fontSize: 10, fontWeight: 700 }}>Today</span>
                  )}
                </div>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 12, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {entry.content}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {showNew && (
        <EntryModal
          initial={todayEntry}
          onSave={saveEntry}
          onClose={() => setShowNew(false)}
        />
      )}

      {viewEntry && (
        <ViewModal
          entry={viewEntry}
          onEdit={() => { setShowNew(true); setViewEntry(null); }}
          onDelete={() => remove(viewEntry.id)}
          onClose={() => setViewEntry(null)}
        />
      )}
    </div>
  );
}

function EntryModal({ initial, onSave, onClose }: { initial?: JournalEntry; onSave: (c: string, m: JournalEntry["mood"]) => void; onClose: () => void }) {
  const [content, setContent] = useState(initial?.content ?? "");
  const [mood, setMood] = useState<JournalEntry["mood"]>(initial?.mood ?? "");

  return (
    <Modal title={initial ? "Edit today's entry" : "Write today's entry"} onClose={onClose} wide>
      <p style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: 12 }}>{formatDate(today())}</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {MOODS.map((m) => (
          <button
            key={m.value}
            onClick={() => setMood(m.value)}
            style={{
              padding: "6px 12px",
              borderRadius: 20,
              border: "1px solid var(--line)",
              background: mood === m.value ? "var(--accent)" : "var(--surface)",
              color: mood === m.value ? "#fff" : "var(--text)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {m.emoji} {m.label}
          </button>
        ))}
      </div>
      <textarea
        autoFocus
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind today? What happened? How are you feeling? What do you want to remember?"
        style={{
          width: "100%",
          minHeight: 240,
          padding: "12px 14px",
          border: "1px solid var(--line)",
          borderRadius: 12,
          outline: "none",
          color: "var(--text)",
          background: "var(--surface-2)",
          fontFamily: "inherit",
          fontSize: 14,
          lineHeight: 1.7,
          resize: "vertical",
        }}
      />
      <div className="modal-actions">
        <button className="secondary-btn" onClick={onClose}>Cancel</button>
        <button className="primary-btn" onClick={() => { if (content.trim()) onSave(content.trim(), mood); }}>
          Save entry
        </button>
      </div>
    </Modal>
  );
}

function ViewModal({ entry, onEdit, onDelete, onClose }: { entry: JournalEntry; onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  const mood = MOODS.find((m) => m.value === entry.mood);
  return (
    <Modal title={formatDate(entry.date)} onClose={onClose} wide>
      {mood && <p style={{ margin: "0 0 16px", fontSize: 18 }}>{mood.emoji} {mood.label}</p>}
      <div style={{ padding: "16px", background: "var(--surface-2)", borderRadius: 12, fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap", maxHeight: 400, overflowY: "auto" }}>
        {entry.content}
      </div>
      <div className="modal-actions">
        <button className="secondary-btn" style={{ color: "#c0392b", borderColor: "#c0392b" }} onClick={onDelete}><Trash2 size={14} /> Delete</button>
        {entry.date === today() && <button className="secondary-btn" onClick={onEdit}>Edit</button>}
        <button className="primary-btn" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

function calcStreak(entries: JournalEntry[]) {
  if (!entries.length) return 0;
  const dates = [...new Set(entries.map((e) => e.date))].sort((a, b) => b.localeCompare(a));
  let streak = 0;
  let current = today();
  for (const d of dates) {
    if (d === current) {
      streak++;
      const prev = new Date(current + "T12:00:00");
      prev.setDate(prev.getDate() - 1);
      current = prev.toISOString().split("T")[0];
    } else break;
  }
  return streak;
}
