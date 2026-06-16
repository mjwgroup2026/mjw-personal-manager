"use client";
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Field, Modal, inputStyle, selectStyle, textareaStyle } from "@/components/ui/Modal";
import type { CalendarEvent, Task } from "@/lib/types";

const EVENT_COLORS: Record<CalendarEvent["type"], string> = {
  appointment: "#e66e52",
  deadline:    "#c0392b",
  reminder:    "#b87c3e",
  birthday:    "#7c5cbf",
  other:       "#4a7c8a",
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const iconBtn: React.CSSProperties = {
  padding: 6, border: "1px solid var(--line)", borderRadius: 8, background: "none",
  color: "var(--text)", cursor: "pointer", display: "flex", alignItems: "center",
};

function fmtDate(d: string) {
  try { return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short" }).format(new Date(d + "T00:00:00")); }
  catch { return d; }
}

function fmtTime(t: string) {
  try {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "pm" : "am";
    return `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${String(m).padStart(2, "0")}${ampm}`;
  } catch { return t; }
}

export function CalendarSection({
  events,
  onChange,
  onToast,
  onAddTask,
}: {
  events: CalendarEvent[];
  onChange: (e: CalendarEvent[]) => void;
  onToast: (msg: string) => void;
  onAddTask: (t: Omit<Task, "id">) => void;
}) {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const [year, setYear]     = useState(now.getFullYear());
  const [month, setMonth]   = useState(now.getMonth());
  const [showAdd, setShowAdd]   = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [addDate, setAddDate]   = useState(todayStr);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1);
  }

  const firstDow  = new Date(year, month, 1).getDay();
  const daysCount = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function ds(d: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  const byDate = new Map<string, CalendarEvent[]>();
  events.forEach((e) => { byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]); });

  const upcoming = [...events]
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 15);

  const selectedEvents = selectedDate ? (byDate.get(selectedDate) ?? []) : [];

  function save(evtData: Omit<CalendarEvent, "id">) {
    const event: CalendarEvent = { ...evtData, id: Date.now() };
    onChange([...events, event]);
    onAddTask({
      title: evtData.title,
      area: "Personal",
      time: evtData.time ? fmtTime(evtData.time) : "TBD",
      priority: "high",
      done: false,
      scheduledDate: evtData.date,
      dueDate: evtData.date,
      status: "open",
      riskFlag: true,
      nextAction: evtData.description || undefined,
    });
    onToast("Event added — also queued as high-priority task");
    setShowAdd(false);
  }

  function saveEdit(evtData: Omit<CalendarEvent, "id">) {
    if (!editEvent) return;
    onChange(events.map((e) => e.id === editEvent.id ? { ...evtData, id: editEvent.id } : e));
    onToast("Event updated");
    setEditEvent(null);
    // if date changed, update selectedDate so the panel stays open on new date
    if (evtData.date !== selectedDate) {
      const [y, m] = evtData.date.split("-").map(Number);
      setYear(y); setMonth(m - 1); setSelectedDate(evtData.date);
    }
  }

  function remove(id: number) {
    onChange(events.filter((e) => e.id !== id));
    onToast("Event removed");
  }

  function openDay(d: number) {
    const dateKey = ds(d);
    setSelectedDate((prev) => (prev === dateKey ? null : dateKey));
    setAddDate(dateKey);
  }

  return (
    <div>
      <div className="section-hero">
        <div className="section-icon"><CalendarDays size={24} /></div>
        <div>
          <span className="eyebrow">Your space</span>
          <h1>Calendar</h1>
          <p>Appointments, deadlines, and dates that matter.</p>
        </div>
        <button className="primary-btn" style={{ marginLeft: "auto" }} onClick={() => { setAddDate(todayStr); setShowAdd(true); }}>
          <Plus size={17} /> Add event
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 270px", gap: 14, alignItems: "start" }}>

        {/* ── Calendar grid ── */}
        <section className="panel" style={{ padding: 22 }}>

          {/* Month navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <button style={iconBtn} onClick={prevMonth} aria-label="Previous month"><ChevronLeft size={18} /></button>
            <h2 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 500, letterSpacing: "-.4px", flex: 1, textAlign: "center" }}>
              {MONTHS[month]} {year}
            </h2>
            <button style={iconBtn} onClick={nextMonth} aria-label="Next month"><ChevronRight size={18} /></button>
            <button
              onClick={() => { setMonth(now.getMonth()); setYear(now.getFullYear()); }}
              style={{ fontSize: 11, padding: "5px 12px", borderRadius: 8, border: "1px solid var(--line)", background: "none", color: "var(--muted)", cursor: "pointer", fontWeight: 700 }}
            >Today</button>
          </div>

          {/* Day-of-week headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
            {DAYS_SHORT.map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 9, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, padding: "4px 0" }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} style={{ minHeight: 72 }} />;
              const dateKey = ds(day);
              const dayEvts = byDate.get(dateKey) ?? [];
              const isToday    = dateKey === todayStr;
              const isSelected = dateKey === selectedDate;
              return (
                <div
                  key={i}
                  onClick={() => openDay(day)}
                  title={`${fmtDate(dateKey)} — click to view or add`}
                  style={{
                    minHeight: 72, padding: "5px 5px 3px", borderRadius: 9, cursor: "pointer",
                    border: isSelected ? "2px solid var(--accent)" : isToday ? "2px solid var(--gold)" : "1px solid transparent",
                    background: isSelected ? "rgba(230,110,82,.06)" : isToday ? "rgba(201,152,10,.07)" : "var(--surface-2)",
                    transition: "background .12s",
                  }}
                >
                  <div style={{
                    display: "inline-flex", width: 22, height: 22, alignItems: "center", justifyContent: "center",
                    borderRadius: "50%", fontSize: 11, fontWeight: isToday ? 800 : 500,
                    background: isToday ? "var(--gold)" : "transparent",
                    color: isToday ? "#fff" : "var(--text)", marginBottom: 3,
                  }}>{day}</div>
                  {dayEvts.slice(0, 2).map((e) => (
                    <div key={e.id} style={{
                      fontSize: 9, fontWeight: 700, padding: "2px 4px", borderRadius: 3, marginBottom: 2,
                      background: EVENT_COLORS[e.type] + "22", color: EVENT_COLORS[e.type],
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.3,
                    }}>{e.title}</div>
                  ))}
                  {dayEvts.length > 2 && (
                    <div style={{ fontSize: 8, color: "var(--muted)", paddingLeft: 2 }}>+{dayEvts.length - 2} more</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected day detail */}
          {selectedDate && (
            <div style={{ marginTop: 18, padding: "16px 18px", borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--line)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <strong style={{ fontSize: 13 }}>
                  {fmtDate(selectedDate)}
                  {selectedEvents.length > 0 ? ` — ${selectedEvents.length} event${selectedEvents.length !== 1 ? "s" : ""}` : " — no events"}
                </strong>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setShowAdd(true); }} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 7, border: "1px solid var(--line)", background: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 700 }}>+ Add</button>
                  <button onClick={() => setSelectedDate(null)} style={{ padding: 4, border: 0, background: "none", color: "var(--muted)", cursor: "pointer" }}><X size={14} /></button>
                </div>
              </div>
              {selectedEvents.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 12, margin: 0 }}>Click + Add to schedule something for this day.</p>
              ) : (
                selectedEvents.map((e) => (
                  <div key={e.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                    <div style={{ width: 3, alignSelf: "stretch", borderRadius: 4, background: EVENT_COLORS[e.type], flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: "block", fontSize: 12 }}>{e.title}</strong>
                      <div style={{ display: "flex", gap: 10, marginTop: 3, flexWrap: "wrap" }}>
                        {e.time && <span style={{ fontSize: 10, color: "var(--muted)" }}>{fmtTime(e.time)}</span>}
                        <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8, color: EVENT_COLORS[e.type] }}>{e.type}</span>
                        <span style={{ fontSize: 9, color: "var(--muted)" }}>Synced to tasks as high priority</span>
                      </div>
                      {e.description && <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>{e.description}</p>}
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => setEditEvent(e)} style={{ padding: 4, border: 0, background: "none", color: "var(--muted)", cursor: "pointer" }}><Pencil size={13} /></button>
                      <button onClick={() => remove(e.id)} style={{ padding: 4, border: 0, background: "none", color: "var(--muted)", cursor: "pointer" }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {/* ── Upcoming events sidebar ── */}
        <div style={{ position: "sticky", top: 16, display: "grid", gap: 14 }}>
          <section className="panel" style={{ padding: 22 }}>
            <h3 style={{ margin: "0 0 14px", fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 500 }}>Upcoming</h3>
            {upcoming.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 12, margin: "0 0 14px" }}>No upcoming events. Add one to start.</p>
            ) : (
              <div style={{ display: "grid", gap: 6 }}>
                {upcoming.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => {
                      const [y, m] = e.date.split("-").map(Number);
                      setYear(y); setMonth(m - 1); setSelectedDate(e.date);
                    }}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 10,
                      borderLeft: `3px solid ${EVENT_COLORS[e.type]}`, background: EVENT_COLORS[e.type] + "0d",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: "block", fontSize: 11, fontWeight: 650, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</strong>
                      <span style={{ fontSize: 9, color: "var(--muted)" }}>
                        {fmtDate(e.date)}{e.time ? ` · ${fmtTime(e.time)}` : ""}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 2 }}>
                      <button onClick={(ev) => { ev.stopPropagation(); setEditEvent(e); }} style={{ padding: 2, border: 0, background: "none", color: "var(--muted)", cursor: "pointer" }}><Pencil size={12} /></button>
                      <button onClick={(ev) => { ev.stopPropagation(); remove(e.id); }} style={{ padding: 2, border: 0, background: "none", color: "var(--muted)", cursor: "pointer" }}><X size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="add-row" style={{ marginTop: 12 }} onClick={() => { setAddDate(todayStr); setShowAdd(true); }}>
              <Plus size={17} /> Add event
            </button>
          </section>

          {/* Event type legend */}
          <section className="panel" style={{ padding: 18 }}>
            <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 750, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)" }}>Event types</p>
            {(Object.entries(EVENT_COLORS) as [CalendarEvent["type"], string][]).map(([type, color]) => (
              <div key={type} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, textTransform: "capitalize", color: "var(--text)" }}>{type}</span>
              </div>
            ))}
          </section>
        </div>
      </div>

      {showAdd && (
        <EventModal
          initial={{ date: addDate, type: "appointment", title: "", time: "", description: "", allDay: true }}
          onSave={save}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editEvent && (
        <EventModal
          initial={editEvent}
          isEdit
          onSave={saveEdit}
          onClose={() => setEditEvent(null)}
        />
      )}
    </div>
  );
}

function EventModal({
  initial,
  isEdit,
  onSave,
  onClose,
}: {
  initial: Partial<Omit<CalendarEvent, "id">>;
  isEdit?: boolean;
  onSave: (d: Omit<CalendarEvent, "id">) => void;
  onClose: () => void;
}) {
  const [title, setTitle]       = useState(initial.title ?? "");
  const [date, setDate]         = useState(initial.date ?? "");
  const [time, setTime]         = useState(initial.time ?? "");
  const [type, setType]         = useState<CalendarEvent["type"]>(initial.type ?? "appointment");
  const [description, setDesc]  = useState(initial.description ?? "");

  return (
    <Modal title={isEdit ? "Edit event" : "Add calendar event"} onClose={onClose}>
      <Field label="Event title">
        <input
          style={inputStyle}
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Doctor appointment, SARS deadline"
          onKeyDown={(e) => e.key === "Enter" && title.trim() && date && onSave({ title: title.trim(), date, time, type, description, allDay: !time })}
        />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Date">
          <input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Type">
          <select style={selectStyle} value={type} onChange={(e) => setType(e.target.value as CalendarEvent["type"])}>
            {(["appointment", "deadline", "reminder", "birthday", "other"] as const).map((t) => (
              <option key={t} value={t} style={{ textTransform: "capitalize" }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </Field>
        <Field label="Time (optional)">
          <input style={inputStyle} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
      <Field label="Notes (optional)">
        <textarea
          style={textareaStyle}
          value={description}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Any details, preparation notes, or context…"
        />
      </Field>
      {!isEdit && (
        <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(230,110,82,.06)", border: "1px solid rgba(230,110,82,.15)", fontSize: 11, color: "var(--accent)", marginBottom: 16 }}>
          This event will also be added to your Tasks as a high-priority, risk-flagged item on the same date.
        </div>
      )}
      <div className="modal-actions">
        <button className="secondary-btn" onClick={onClose}>Cancel</button>
        <button
          className="primary-btn"
          onClick={() => { if (title.trim() && date) onSave({ title: title.trim(), date, time, type, description, allDay: !time }); }}
        >
          {isEdit ? "Save changes" : "Add event"}
        </button>
      </div>
    </Modal>
  );
}
