"use client";

import { Check, ChevronRight, Clock3, Plus, Pill, RefreshCw, SkipForward, X } from "lucide-react";
import { useState } from "react";
import type { Medication, MedicationLog } from "@/lib/types";

interface Props {
  medications: Medication[];
  logs: MedicationLog[];
  onChange: (meds: Medication[]) => void;
  onLogChange: (logs: MedicationLog[]) => void;
  onToast: (msg: string) => void;
}

const COLORS = ["coral", "blue", "purple", "green"];
const COLOR_MAP: Record<string, string> = {
  coral: "#ed927d", blue: "#80a7ba", purple: "#9c8db2", green: "#7fa087",
};

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function nowMinutes() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

function isDueNow(time: string) {
  const diff = timeToMinutes(time) - nowMinutes();
  return diff >= -30 && diff <= 60;
}

function isOverdue(time: string) {
  return timeToMinutes(time) < nowMinutes() - 30;
}

const EMPTY_MED: Omit<Medication, "id"> = {
  name: "", dosage: "", instructions: "", scheduleTimes: ["08:00"],
  startDate: new Date().toISOString().split("T")[0], active: true, color: "coral",
};

export function MedicationSection({ medications, logs, onChange, onLogChange, onToast }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [addOpen, setAddOpen] = useState(false);
  const [editMed, setEditMed] = useState<Medication | null>(null);
  const [draft, setDraft] = useState<Omit<Medication, "id">>(EMPTY_MED);
  const [newTime, setNewTime] = useState("08:00");
  const [tab, setTab] = useState<"today" | "all">("today");

  const activeMeds = medications.filter((m) => m.active);

  // Build today's schedule: for each active med × each scheduled time
  type ScheduleItem = { med: Medication; time: string; log: MedicationLog | undefined };
  const schedule: ScheduleItem[] = activeMeds
    .flatMap((med) =>
      med.scheduleTimes.map((time) => ({
        med,
        time,
        log: logs.find((l) => l.medicationId === med.id && l.date === today && l.scheduledTime === time),
      }))
    )
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  function logAction(med: Medication, time: string, status: MedicationLog["status"]) {
    const existing = logs.find((l) => l.medicationId === med.id && l.date === today && l.scheduledTime === time);
    const entry: MedicationLog = {
      id: existing?.id ?? Date.now(),
      medicationId: med.id,
      scheduledTime: time,
      date: today,
      status,
      takenAt: status === "taken" ? new Date().toISOString() : undefined,
    };
    if (existing) {
      onLogChange(logs.map((l) => l.id === existing.id ? entry : l));
    } else {
      onLogChange([...logs, entry]);
    }
    onToast(status === "taken" ? `${med.name} marked as taken` : status === "skipped" ? `${med.name} skipped` : `${med.name} snoozed`);
  }

  function openAdd() { setDraft(EMPTY_MED); setAddOpen(true); setEditMed(null); }
  function openEdit(med: Medication) { setDraft({ ...med }); setEditMed(med); setAddOpen(true); }

  function saveMed() {
    if (!draft.name.trim()) return;
    if (editMed) {
      onChange(medications.map((m) => m.id === editMed.id ? { ...draft, id: editMed.id } : m));
      onToast("Medication updated");
    } else {
      onChange([...medications, { ...draft, id: Date.now() }]);
      onToast("Medication added");
    }
    setAddOpen(false);
  }

  function deleteMed(id: number) {
    onChange(medications.filter((m) => m.id !== id));
    onLogChange(logs.filter((l) => l.medicationId !== id));
    onToast("Medication removed");
  }

  const refillSoon = activeMeds.filter((m) => {
    if (!m.refillDate) return false;
    const days = (new Date(m.refillDate).getTime() - Date.now()) / 86400000;
    return days <= 7;
  });

  return (
    <div>
      {/* Hero */}
      <div className="section-hero">
        <div className="section-icon"><Pill size={24} /></div>
        <div>
          <span className="eyebrow">Health</span>
          <h1>Medication</h1>
          <p>Log your doses. Speak to your doctor or pharmacist for advice.</p>
        </div>
        <button className="primary-btn" style={{ marginLeft: "auto" }} onClick={openAdd}>
          <Plus size={16} /> Add medication
        </button>
      </div>

      {/* Refill alerts */}
      {refillSoon.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {refillSoon.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, background: "rgba(212,160,52,.1)", border: "1px solid rgba(212,160,52,.25)", fontSize: 11 }}>
              <RefreshCw size={13} style={{ color: "#b87c3e" }} />
              <span><strong>{m.name}</strong> refill due {m.refillDate}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {(["today", "all"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 14px", borderRadius: 9, border: "1px solid var(--line)", background: tab === t ? "var(--accent)" : "var(--surface-2)", color: tab === t ? "#fff" : "var(--muted)", fontSize: 11, fontWeight: 680, cursor: "pointer", textTransform: "capitalize" }}>{t === "today" ? "Today's schedule" : "All medications"}</button>
        ))}
      </div>

      {/* Today schedule */}
      {tab === "today" && (
        <div className="panel wide-panel" style={{ padding: 0, overflow: "hidden" }}>
          {schedule.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>
              <Pill size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: 13 }}>No medications scheduled. Add one above.</p>
            </div>
          ) : (
            schedule.map(({ med, time, log }, i) => {
              const taken = log?.status === "taken";
              const skipped = log?.status === "skipped";
              const snoozed = log?.status === "snoozed";
              const dueNow = !log && isDueNow(time);
              const overdue = !log && isOverdue(time);
              return (
                <div key={`${med.id}-${time}`} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "16px 20px",
                  borderBottom: i < schedule.length - 1 ? "1px solid var(--line)" : "none",
                  opacity: taken ? 0.55 : 1,
                  background: dueNow ? "rgba(230,110,82,.04)" : "transparent",
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, background: COLOR_MAP[med.color] ?? "#888" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 13, textDecoration: taken ? "line-through" : "none" }}>{med.name}</strong>
                      <span style={{ fontSize: 10, color: "var(--muted)" }}>{med.dosage}</span>
                      {dueNow && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 6, background: "rgba(230,110,82,.15)", color: "var(--accent)", fontWeight: 750, textTransform: "uppercase", letterSpacing: 0.5 }}>Due now</span>}
                      {overdue && !log && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 6, background: "rgba(192,57,43,.1)", color: "#c0392b", fontWeight: 750, textTransform: "uppercase", letterSpacing: 0.5 }}>Overdue</span>}
                      {snoozed && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 6, background: "rgba(212,168,68,.1)", color: "#b87c3e", fontWeight: 750 }}>Snoozed</span>}
                    </div>
                    {med.instructions && <p style={{ margin: "3px 0 0", fontSize: 10, color: "var(--muted)" }}>{med.instructions}</p>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--muted)", minWidth: 44 }}>
                      <Clock3 size={12} />{time}
                    </span>
                    {!taken && !skipped && (
                      <>
                        <button onClick={() => logAction(med, time, "taken")} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, border: "none", background: "#60836b", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                          <Check size={12} /> Take
                        </button>
                        <button onClick={() => logAction(med, time, "snoozed")} title="Snooze" style={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface-2)", cursor: "pointer", color: "var(--muted)" }}>
                          <Clock3 size={13} />
                        </button>
                        <button onClick={() => logAction(med, time, "skipped")} title="Skip" style={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface-2)", cursor: "pointer", color: "var(--muted)" }}>
                          <SkipForward size={13} />
                        </button>
                      </>
                    )}
                    {taken && <span style={{ fontSize: 10, fontWeight: 700, color: "#60836b" }}>Taken ✓</span>}
                    {skipped && (
                      <button onClick={() => logAction(med, time, "taken")} style={{ fontSize: 10, padding: "4px 8px", borderRadius: 7, border: "1px solid var(--line)", background: "none", color: "var(--muted)", cursor: "pointer" }}>
                        Undo skip
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* All medications list */}
      {tab === "all" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {medications.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>No medications added yet.</p>
          ) : (
            medications.map((med) => (
              <div key={med.id} className="panel" style={{ padding: 18, opacity: med.active ? 1 : 0.5 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: COLOR_MAP[med.color] ?? "#888", flexShrink: 0, display: "grid", placeItems: "center" }}>
                    <Pill size={18} color="#fff" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: 13 }}>{med.name}</strong>
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--muted)" }}>{med.dosage}{med.instructions ? ` · ${med.instructions}` : ""}</p>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => openEdit(med)} style={{ width: 28, height: 28, display: "grid", placeItems: "center", border: "1px solid var(--line)", borderRadius: 7, background: "var(--surface-2)", cursor: "pointer", fontSize: 10, color: "var(--muted)" }}>✏</button>
                    <button onClick={() => deleteMed(med.id)} style={{ width: 28, height: 28, display: "grid", placeItems: "center", border: "1px solid var(--line)", borderRadius: 7, background: "var(--surface-2)", cursor: "pointer", color: "#c0392b" }}><X size={13} /></button>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {med.scheduleTimes.map((t) => (
                    <span key={t} style={{ padding: "3px 8px", borderRadius: 6, background: "var(--surface-2)", fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}><Clock3 size={10} />{t}</span>
                  ))}
                  {med.refillDate && (
                    <span style={{ padding: "3px 8px", borderRadius: 6, background: "rgba(212,160,52,.1)", fontSize: 10, color: "#b87c3e" }}>Refill: {med.refillDate}</span>
                  )}
                </div>
                {med.prescribingDoctor && (
                  <p style={{ margin: "8px 0 0", fontSize: 10, color: "var(--muted)" }}>Dr {med.prescribingDoctor}{med.pharmacy ? ` · ${med.pharmacy}` : ""}</p>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--line)" }}>
                  <span style={{ fontSize: 9, color: "var(--muted)" }}>Since {med.startDate}</span>
                  <button onClick={() => { onChange(medications.map((m) => m.id === med.id ? { ...m, active: !m.active } : m)); onToast(med.active ? "Paused" : "Reactivated"); }}
                    style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, border: "1px solid var(--line)", background: "none", color: "var(--muted)", cursor: "pointer" }}>
                    {med.active ? "Pause" : "Reactivate"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add / Edit modal */}
      {addOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setAddOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()} style={{ width: "min(520px, 100%)" }}>
            <div className="modal-head">
              <div><span className="eyebrow">Medication</span><h2>{editMed ? "Edit" : "Add"} medication</h2></div>
              <button className="icon-btn" onClick={() => setAddOpen(false)}><X size={19} /></button>
            </div>
            <p style={{ margin: "-8px 0 16px", fontSize: 11, color: "var(--muted)" }}>Speak to your doctor or pharmacist for medical guidance.</p>

            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5 }}>MEDICATION NAME *</label>
                  <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Vitamin D" autoFocus
                    style={{ width: "100%", height: 42, padding: "0 12px", border: "1px solid var(--line)", borderRadius: 10, outline: "none", color: "var(--text)", background: "var(--surface-2)", fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5 }}>DOSAGE</label>
                  <input value={draft.dosage} onChange={(e) => setDraft((d) => ({ ...d, dosage: e.target.value }))} placeholder="e.g. 1000mg"
                    style={{ width: "100%", height: 42, padding: "0 12px", border: "1px solid var(--line)", borderRadius: 10, outline: "none", color: "var(--text)", background: "var(--surface-2)", fontSize: 13 }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5 }}>INSTRUCTIONS</label>
                <input value={draft.instructions} onChange={(e) => setDraft((d) => ({ ...d, instructions: e.target.value }))} placeholder="e.g. Take with food"
                  style={{ width: "100%", height: 42, padding: "0 12px", border: "1px solid var(--line)", borderRadius: 10, outline: "none", color: "var(--text)", background: "var(--surface-2)", fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5 }}>SCHEDULE TIMES</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {draft.scheduleTimes.map((t, i) => (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 11 }}>
                      <Clock3 size={11} />{t}
                      <button onClick={() => setDraft((d) => ({ ...d, scheduleTimes: d.scheduleTimes.filter((_, j) => j !== i) }))}
                        style={{ padding: 0, border: 0, background: "none", color: "var(--muted)", cursor: "pointer", lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)}
                    style={{ height: 36, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 9, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }} />
                  <button type="button" onClick={() => { if (newTime && !draft.scheduleTimes.includes(newTime)) setDraft((d) => ({ ...d, scheduleTimes: [...d.scheduleTimes, newTime].sort() })); }}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 12px", height: 36, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--muted)", fontSize: 11, cursor: "pointer" }}>
                    <Plus size={13} /> Add time
                  </button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5 }}>START DATE</label>
                  <input type="date" value={draft.startDate} onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                    style={{ width: "100%", height: 38, padding: "0 8px", border: "1px solid var(--line)", borderRadius: 9, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5 }}>REFILL DATE</label>
                  <input type="date" value={draft.refillDate ?? ""} onChange={(e) => setDraft((d) => ({ ...d, refillDate: e.target.value || undefined }))}
                    style={{ width: "100%", height: 38, padding: "0 8px", border: "1px solid var(--line)", borderRadius: 9, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5 }}>COLOUR</label>
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    {COLORS.map((c) => (
                      <button key={c} onClick={() => setDraft((d) => ({ ...d, color: c }))}
                        style={{ width: 28, height: 28, borderRadius: "50%", border: draft.color === c ? "3px solid var(--text)" : "2px solid transparent", background: COLOR_MAP[c], cursor: "pointer" }} />
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5 }}>PRESCRIBING DOCTOR</label>
                  <input value={draft.prescribingDoctor ?? ""} onChange={(e) => setDraft((d) => ({ ...d, prescribingDoctor: e.target.value || undefined }))} placeholder="Optional"
                    style={{ width: "100%", height: 38, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 9, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5 }}>PHARMACY</label>
                  <input value={draft.pharmacy ?? ""} onChange={(e) => setDraft((d) => ({ ...d, pharmacy: e.target.value || undefined }))} placeholder="Optional"
                    style={{ width: "100%", height: 38, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 9, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }} />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setAddOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={saveMed} disabled={!draft.name.trim()}>{editMed ? "Save changes" : "Add medication"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
