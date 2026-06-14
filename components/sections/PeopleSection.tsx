"use client";
import { Bell, CalendarDays, ChevronLeft, HeartHandshake, Mail, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Person, Reminder } from "@/lib/types";
import { Field, Modal, inputStyle, selectStyle, textareaStyle } from "@/components/ui/Modal";

const COLORS = ["coral", "blue", "purple", "green", "gold", "rose"];
const COLOR_HEX: Record<string, string> = { coral: "#ed927d", blue: "#80a7ba", purple: "#9c8db2", green: "#7fa087", gold: "#c9980a", rose: "#c97db0" };
const RELATIONS = ["Friend", "Family", "Work", "Partner", "Mentor", "Client", "Neighbour", "Other"];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function PeopleSection({
  people,
  onChange,
  onToast,
}: {
  people: Person[];
  onChange: (p: Person[]) => void;
  onToast: (msg: string) => void;
}) {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState<Person | null>(null);

  const openPerson = open ? people.find((p) => p.id === open.id) ?? null : null;

  function save(data: Omit<Person, "id" | "reminders">) {
    onChange([...people, { id: Date.now(), reminders: [], ...data }]);
    onToast("Person added"); setShow(false);
  }

  function remove(id: number) {
    onChange(people.filter((p) => p.id !== id));
    setOpen(null); onToast("Person removed");
  }

  function updatePerson(updated: Person) {
    onChange(people.map((p) => p.id === updated.id ? updated : p));
  }

  if (openPerson) {
    return <PersonDetail person={openPerson} onBack={() => setOpen(null)} onUpdate={updatePerson} onDelete={() => remove(openPerson.id)} onToast={onToast} />;
  }

  return (
    <div>
      <div className="section-hero">
        <div className="section-icon"><HeartHandshake size={24} /></div>
        <div>
          <span className="eyebrow">Your space</span>
          <h1>People</h1>
          <p>Make remembering the thoughtful things easier.</p>
        </div>
        <button className="primary-btn" style={{ marginLeft: "auto" }} onClick={() => setShow(true)}>
          <Plus size={17} /> Add person
        </button>
      </div>

      {people.length === 0 ? (
        <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--muted)" }}>
          <HeartHandshake size={40} style={{ margin: "0 auto 16px", opacity: .4 }} />
          <p>No people added yet. Add someone to remember what matters to them.</p>
          <button className="primary-btn" onClick={() => setShow(true)} style={{ marginTop: 12 }}>Add first person</button>
        </div>
      ) : (
        <div className="people-cards">
          {people.map((person) => (
            <article key={person.id} className="people-card" style={{ cursor: "default" }}>
              <span className="large-avatar" style={{ background: `${COLOR_HEX[person.color] ?? COLOR_HEX.coral}33`, color: COLOR_HEX[person.color] ?? COLOR_HEX.coral }}>
                {initials(person.name)}
              </span>
              <h2>{person.name}</h2>
              <p>{person.relation}</p>
              {person.birthday && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 12px", borderRadius: 10, background: "var(--surface-2)", fontSize: 10, marginBottom: 8 }}>
                  <CalendarDays size={14} /> Birthday: {person.birthday}
                </div>
              )}
              {person.reminders.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 12px", borderRadius: 10, background: "var(--surface-2)", fontSize: 10, marginBottom: 8 }}>
                  <Bell size={14} /> {person.reminders.length} reminder{person.reminders.length > 1 ? "s" : ""}
                </div>
              )}
              <button onClick={() => setOpen(person)} style={{ display: "flex", alignItems: "center", gap: 3, margin: "16px auto 0", padding: 0, border: 0, color: "var(--accent-dark)", background: "none", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                View & edit
              </button>
            </article>
          ))}
          <button onClick={() => setShow(true)} style={addCardStyle}><Plus size={32} />Add person</button>
        </div>
      )}

      {show && <PersonModal onSave={save} onClose={() => setShow(false)} />}
    </div>
  );
}

function PersonDetail({ person, onBack, onUpdate, onDelete, onToast }: {
  person: Person;
  onBack: () => void;
  onUpdate: (p: Person) => void;
  onDelete: () => void;
  onToast: (msg: string) => void;
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [newReminder, setNewReminder] = useState("");
  const [reminderDate, setReminderDate] = useState("");

  function addReminder() {
    if (!newReminder.trim()) return;
    const reminder: Reminder = { id: Date.now(), text: newReminder.trim(), date: reminderDate };
    onUpdate({ ...person, reminders: [...person.reminders, reminder] });
    setNewReminder(""); setReminderDate(""); onToast("Reminder added");
  }

  function removeReminder(id: number) {
    onUpdate({ ...person, reminders: person.reminders.filter((r) => r.id !== id) });
  }

  function saveEdit(data: Omit<Person, "id" | "reminders">) {
    onUpdate({ ...person, ...data }); setShowEdit(false); onToast("Profile updated");
  }

  return (
    <div>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, padding: "8px 0", border: 0, background: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer" }}>
        <ChevronLeft size={16} /> Back to people
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "start" }}>
        {/* Profile card */}
        <section className="panel" style={{ padding: 28, textAlign: "center" }}>
          <span style={{ width: 72, height: 72, borderRadius: "50%", display: "grid", placeItems: "center", background: `${COLOR_HEX[person.color] ?? COLOR_HEX.coral}22`, color: COLOR_HEX[person.color] ?? COLOR_HEX.coral, fontFamily: "Georgia,serif", fontSize: 24, margin: "0 auto 16px" }}>
            {initials(person.name)}
          </span>
          <h2 style={{ margin: "0 0 4px", fontFamily: "Georgia,serif", fontSize: 20 }}>{person.name}</h2>
          <p style={{ margin: "0 0 20px", color: "var(--muted)", fontSize: 12 }}>{person.relation}</p>
          {person.phone && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderTop: "1px solid var(--line)", fontSize: 12 }}><Phone size={14} style={{ color: "var(--muted)" }} />{person.phone}</div>}
          {person.email && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderTop: "1px solid var(--line)", fontSize: 12 }}><Mail size={14} style={{ color: "var(--muted)" }} />{person.email}</div>}
          {person.birthday && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderTop: "1px solid var(--line)", fontSize: 12 }}><CalendarDays size={14} style={{ color: "var(--muted)" }} />{person.birthday}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center" }}>
            <button onClick={() => setShowEdit(true)} style={iconBtnStyle}><Pencil size={14} /></button>
            <button onClick={onDelete} style={{ ...iconBtnStyle, color: "#c0392b", borderColor: "#fcc" }}><Trash2 size={14} /></button>
          </div>
        </section>

        <div style={{ display: "grid", gap: 16 }}>
          {/* Notes */}
          {person.notes && (
            <section className="panel" style={{ padding: 22 }}>
              <div className="panel-head"><div><h2>Notes</h2></div><button onClick={() => setShowEdit(true)} style={{ display: "flex", alignItems: "center", gap: 4, padding: 0, border: 0, background: "none", color: "var(--accent-dark)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}><Pencil size={12} /> Edit</button></div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", color: "var(--text)" }}>{person.notes}</p>
            </section>
          )}

          {/* Reminders */}
          <section className="panel" style={{ padding: 22 }}>
            <div className="panel-head"><div><h2>Reminders</h2><p>{person.reminders.length} saved</p></div></div>
            <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
              {person.reminders.length === 0 && <p style={{ color: "var(--muted)", fontSize: 12 }}>No reminders yet.</p>}
              {person.reminders.map((r) => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--surface-2)", borderRadius: 11 }}>
                  <Bell size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12 }}>{r.text}</span>
                  {r.date && <span style={{ fontSize: 10, color: "var(--muted)" }}>{r.date}</span>}
                  <button onClick={() => removeReminder(r.id)} style={{ ...iconBtnSmall, color: "#c0392b" }}><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8 }}>
              <input style={{ ...inputStyle, height: 38 }} value={newReminder} onChange={(e) => setNewReminder(e.target.value)} placeholder="Reminder text..." onKeyDown={(e) => e.key === "Enter" && addReminder()} />
              <input style={{ ...inputStyle, height: 38, width: 140 }} type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} />
              <button className="primary-btn" style={{ height: 38, padding: "0 14px" }} onClick={addReminder}><Plus size={15} /></button>
            </div>
          </section>
        </div>
      </div>

      {showEdit && <PersonModal initial={person} onSave={saveEdit} onClose={() => setShowEdit(false)} />}
    </div>
  );
}

function PersonModal({ initial, onSave, onClose }: { initial?: Person; onSave: (d: Omit<Person, "id" | "reminders">) => void; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [relation, setRelation] = useState(initial?.relation ?? "Friend");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [birthday, setBirthday] = useState(initial?.birthday ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [color, setColor] = useState(initial?.color ?? "coral");

  return (
    <Modal title={initial ? "Edit person" : "Add person"} onClose={onClose} wide>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Full name"><input style={inputStyle} autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" /></Field>
        <Field label="Relationship"><select style={selectStyle} value={relation} onChange={(e) => setRelation(e.target.value)}>{RELATIONS.map((r) => <option key={r}>{r}</option>)}</select></Field>
        <Field label="Phone"><input style={inputStyle} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+27 82 000 0000" /></Field>
        <Field label="Email"><input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" /></Field>
        <Field label="Birthday"><input style={inputStyle} type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} /></Field>
        <Field label="Colour">
          <div style={{ display: "flex", gap: 8, paddingTop: 6 }}>
            {COLORS.map((c) => <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: "50%", background: COLOR_HEX[c], border: color === c ? "3px solid var(--text)" : "3px solid transparent", cursor: "pointer" }} />)}
          </div>
        </Field>
      </div>
      <Field label="Notes"><textarea style={textareaStyle} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything you want to remember about them..." /></Field>
      <div className="modal-actions">
        <button className="secondary-btn" onClick={onClose}>Cancel</button>
        <button className="primary-btn" onClick={() => { if (name.trim()) onSave({ name: name.trim(), initials: initials(name.trim()), relation, phone, email, birthday, notes, color }); }}>{initial ? "Save changes" : "Add person"}</button>
      </div>
    </Modal>
  );
}

const iconBtnStyle: React.CSSProperties = { width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer", padding: 0 };
const iconBtnSmall: React.CSSProperties = { width: 24, height: 24, display: "grid", placeItems: "center", borderRadius: 6, border: 0, background: "transparent", cursor: "pointer", padding: 0 };
const addCardStyle: React.CSSProperties = { minHeight: 250, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24, border: "2px dashed var(--line)", borderRadius: 18, background: "transparent", cursor: "pointer", color: "var(--muted)", fontSize: 13 };
