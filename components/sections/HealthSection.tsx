"use client";

import {
  Activity, AlertTriangle, BookHeart, Check, ChevronRight,
  ClipboardList, FileText, Heart, KeyRound, Plus,
  Printer, ShieldCheck, Stethoscope, Trash2, X,
} from "lucide-react";
import { useState } from "react";
import type {
  HealthData, HealthDoctor, HealthEmergencyContact, HealthReading,
  LegacyPolicy, LegacyWish, LegacyWishSection, Medication,
  Prescription, ReadingType,
} from "@/lib/types";

const BLOOD_TYPES = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const WISH_SECTIONS: { key: LegacyWishSection; label: string }[] = [
  { key: "funeral",           label: "Funeral Wishes" },
  { key: "medical_directive", label: "Medical Directives" },
  { key: "will_location",     label: "Will & Location" },
  { key: "executor",          label: "Executor Details" },
  { key: "digital_assets",    label: "Digital Assets" },
  { key: "personal_message",  label: "Personal Message" },
  { key: "other",             label: "Other" },
];
const POLICY_TYPES = ["life","medical","funeral","vehicle","home","disability","investment","other"] as const;
const READING_META: Record<ReadingType, { label: string; unit: string; unit2?: string; normalRange: string; color: string }> = {
  blood_sugar: { label: "Blood Sugar",   unit: "mmol/L",  normalRange: "4.0–7.0",  color: "#e66e52" },
  bp:          { label: "Blood Pressure",unit: "mmHg",    normalRange: "< 120/80", color: "#9c8db2" },
  weight:      { label: "Weight",        unit: "kg",      normalRange: "—",        color: "#80a7ba" },
  hba1c:       { label: "HbA1c",         unit: "%",       normalRange: "< 5.7%",   color: "#d4a017" },
  cholesterol: { label: "Cholesterol",   unit: "mmol/L",  normalRange: "< 5.2",    color: "#ed927d" },
  heart_rate:  { label: "Heart Rate",    unit: "bpm",     normalRange: "60–100",   color: "#60836b" },
  sleep:       { label: "Sleep",         unit: "hrs",     normalRange: "7–9",      color: "#3b82f6" },
  mood:        { label: "Mood",          unit: "/10",     normalRange: "7+",       color: "#8b5cf6" },
  peak_flow:   { label: "Peak Flow",     unit: "L/min",   normalRange: "—",        color: "#10b981" },
};

type Tab = "profile" | "medical_aid" | "readings" | "scripts" | "emergency" | "legacy";

interface Props {
  health: HealthData;
  medications: Medication[];
  onChange: (h: HealthData) => void;
  onToast: (msg: string) => void;
  displayName: string;
}

export function HealthSection({ health, medications, onChange, onToast, displayName }: Props) {
  const [tab, setTab] = useState<Tab>("profile");

  const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: "profile",     label: "Medical Profile", icon: Heart },
    { id: "medical_aid", label: "Medical Aid",      icon: ShieldCheck },
    { id: "readings",    label: "Readings",         icon: Activity },
    { id: "scripts",     label: "Scripts",          icon: ClipboardList },
    { id: "emergency",   label: "Emergency Card",   icon: AlertTriangle },
    { id: "legacy",      label: "Legacy & Wishes",  icon: BookHeart },
  ];

  return (
    <div>
      <div className="section-hero">
        <div className="section-icon"><Heart size={24} /></div>
        <div>
          <span className="eyebrow">Health</span>
          <h1>Health Centre</h1>
          <p>Your complete medical record, emergency card, and legacy vault — all in one place.</p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
            borderRadius: 10, border: "1px solid var(--line)", cursor: "pointer",
            background: tab === id ? "var(--accent)" : "var(--surface-2)",
            color: tab === id ? "#fff" : "var(--muted)", fontSize: 12, fontWeight: 680,
          }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {tab === "profile"     && <ProfileTab     health={health} onChange={onChange} onToast={onToast} />}
      {tab === "medical_aid" && <MedicalAidTab  health={health} onChange={onChange} onToast={onToast} />}
      {tab === "readings"    && <ReadingsTab    health={health} onChange={onChange} onToast={onToast} />}
      {tab === "scripts"     && <ScriptsTab     health={health} onChange={onChange} onToast={onToast} />}
      {tab === "emergency"   && <EmergencyCardTab health={health} medications={medications} displayName={displayName} />}
      {tab === "legacy"      && <LegacyTab      health={health} onChange={onChange} onToast={onToast} />}
    </div>
  );
}

/* ─── Profile Tab ────────────────────────────────────────────────── */
function ProfileTab({ health, onChange, onToast }: { health: HealthData; onChange: (h: HealthData) => void; onToast: (m: string) => void }) {
  const p = health.profile;
  const up = (partial: Partial<typeof p>) => { onChange({ ...health, profile: { ...p, ...partial } }); onToast("Profile saved"); };

  const [condInput, setCondInput] = useState("");
  const [allergyInput, setAllergyInput] = useState("");
  const [editContact, setEditContact] = useState<HealthEmergencyContact | null>(null);
  const [editDoctor, setEditDoctor] = useState<HealthDoctor | null>(null);
  const [contactDraft, setContactDraft] = useState({ name: "", relationship: "", phone: "", email: "" });
  const [doctorDraft, setDoctorDraft] = useState({ name: "", specialty: "", phone: "", practiceNumber: "", hospital: "" });

  function saveContact() {
    if (!contactDraft.name.trim()) return;
    if (editContact) {
      up({ emergencyContacts: p.emergencyContacts.map((c) => c.id === editContact.id ? { ...editContact, ...contactDraft } : c) });
    } else {
      up({ emergencyContacts: [...p.emergencyContacts, { id: Date.now(), ...contactDraft }] });
    }
    setEditContact(null); setContactDraft({ name: "", relationship: "", phone: "", email: "" });
  }

  function saveDoctor() {
    if (!doctorDraft.name.trim()) return;
    if (editDoctor) {
      up({ doctors: p.doctors.map((d) => d.id === editDoctor.id ? { ...editDoctor, ...doctorDraft } : d) });
    } else {
      up({ doctors: [...p.doctors, { id: Date.now(), ...doctorDraft }] });
    }
    setEditDoctor(null); setDoctorDraft({ name: "", specialty: "", phone: "", practiceNumber: "", hospital: "" });
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Personal medical details */}
      <div className="panel" style={{ padding: 22 }}>
        <h3 style={{ margin: "0 0 16px", fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 500 }}>Personal Medical Details</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {([
            { label: "Full Name",    key: "fullName",     type: "text",   placeholder: "As on ID" },
            { label: "Date of Birth",key: "dateOfBirth",  type: "date",   placeholder: "" },
            { label: "ID Number",    key: "idNumber",     type: "text",   placeholder: "SA ID number" },
          ] as { label: string; key: keyof typeof p; type: string; placeholder: string }[]).map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</label>
              <input type={type} value={p[key] as string ?? ""} placeholder={placeholder}
                onChange={(e) => onChange({ ...health, profile: { ...p, [key]: e.target.value } })}
                onBlur={() => onToast("Profile saved")}
                style={{ width: "100%", height: 40, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 10, outline: "none", color: "var(--text)", background: "var(--surface-2)", fontSize: 13 }} />
            </div>
          ))}
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.6 }}>Gender</label>
            <select value={p.gender} onChange={(e) => up({ gender: e.target.value as typeof p.gender })}
              style={{ width: "100%", height: 40, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface-2)", color: "var(--text)", fontSize: 13 }}>
              <option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.6 }}>Blood Type</label>
            <select value={p.bloodType} onChange={(e) => up({ bloodType: e.target.value as typeof p.bloodType })}
              style={{ width: "100%", height: 40, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface-2)", color: "var(--text)", fontSize: 13 }}>
              {BLOOD_TYPES.map((b) => <option key={b} value={b}>{b || "Select"}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 20 }}>
            <input type="checkbox" id="organ-donor" checked={p.organDonor} onChange={(e) => up({ organDonor: e.target.checked })} style={{ width: 16, height: 16, cursor: "pointer" }} />
            <label htmlFor="organ-donor" style={{ fontSize: 13, cursor: "pointer" }}>Organ Donor</label>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.6 }}>Clinical Summary</label>
          <textarea value={p.clinicalSummary} onChange={(e) => onChange({ ...health, profile: { ...p, clinicalSummary: e.target.value } })} onBlur={() => onToast("Profile saved")}
            placeholder="Brief clinical summary for emergency responders — conditions, critical risks, important notes..."
            style={{ width: "100%", height: 90, padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, outline: "none", color: "var(--text)", background: "var(--surface-2)", fontSize: 13, fontFamily: "inherit", resize: "vertical", lineHeight: 1.5 }} />
        </div>
        <div style={{ marginTop: 6, padding: "8px 12px", borderRadius: 8, background: "rgba(212,168,68,.08)", border: "1px solid rgba(212,168,68,.2)", fontSize: 10, color: "#b87c3e" }}>
          ⚠ This summary will appear on your Emergency Card. Do not include sensitive personal information beyond what is medically necessary.
        </div>
      </div>

      {/* Conditions */}
      <div className="panel" style={{ padding: 22 }}>
        <h3 style={{ margin: "0 0 14px", fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 500 }}>Chronic Conditions</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {p.conditions.map((c, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: "rgba(230,110,82,.1)", border: "1px solid rgba(230,110,82,.25)", fontSize: 11, color: "var(--accent-dark)" }}>
              {c}
              <button onClick={() => up({ conditions: p.conditions.filter((_, j) => j !== i) })} style={{ padding: 0, border: 0, background: "none", cursor: "pointer", color: "var(--muted)", lineHeight: 1 }}>×</button>
            </span>
          ))}
          {p.conditions.length === 0 && <span style={{ fontSize: 12, color: "var(--muted)" }}>No conditions added.</span>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={condInput} onChange={(e) => setCondInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && condInput.trim()) { up({ conditions: [...p.conditions, condInput.trim()] }); setCondInput(""); } }}
            placeholder="Type a condition and press Enter (e.g. Hypertension)"
            style={{ flex: 1, height: 38, padding: "0 12px", border: "1px solid var(--line)", borderRadius: 10, outline: "none", color: "var(--text)", background: "var(--surface-2)", fontSize: 13 }} />
          <button onClick={() => { if (condInput.trim()) { up({ conditions: [...p.conditions, condInput.trim()] }); setCondInput(""); } }}
            style={{ padding: "0 14px", height: 38, borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Add</button>
        </div>
      </div>

      {/* Allergies */}
      <div className="panel" style={{ padding: 22 }}>
        <h3 style={{ margin: "0 0 14px", fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 500 }}>Known Allergies</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {p.allergies.map((a, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: "rgba(192,57,43,.1)", border: "1px solid rgba(192,57,43,.25)", fontSize: 11, color: "#c0392b" }}>
              {a}
              <button onClick={() => up({ allergies: p.allergies.filter((_, j) => j !== i) })} style={{ padding: 0, border: 0, background: "none", cursor: "pointer", color: "#c0392b", lineHeight: 1 }}>×</button>
            </span>
          ))}
          {p.allergies.length === 0 && <span style={{ fontSize: 12, color: "#60836b", fontWeight: 600 }}>✓ No known allergies recorded</span>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={allergyInput} onChange={(e) => setAllergyInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && allergyInput.trim()) { up({ allergies: [...p.allergies, allergyInput.trim()] }); setAllergyInput(""); } }}
            placeholder="Type an allergy and press Enter (e.g. Penicillin)"
            style={{ flex: 1, height: 38, padding: "0 12px", border: "1px solid var(--line)", borderRadius: 10, outline: "none", color: "var(--text)", background: "var(--surface-2)", fontSize: 13 }} />
          <button onClick={() => { if (allergyInput.trim()) { up({ allergies: [...p.allergies, allergyInput.trim()] }); setAllergyInput(""); } }}
            style={{ padding: "0 14px", height: 38, borderRadius: 10, border: "none", background: "#c0392b", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Add</button>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="panel" style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 500 }}>Emergency Contacts</h3>
          <button onClick={() => { setContactDraft({ name: "", relationship: "", phone: "", email: "" }); setEditContact({ id: -1, name: "", relationship: "", phone: "" }); }}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--muted)", fontSize: 11, fontWeight: 680, cursor: "pointer" }}>
            <Plus size={13} /> Add contact
          </button>
        </div>
        {p.emergencyContacts.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--line)" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(230,110,82,.12)", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 13, fontWeight: 750, color: "var(--accent-dark)" }}>
              {c.name.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: 13 }}>{c.name}</strong>
              <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--muted)" }}>{c.relationship} · {c.phone}{c.email ? ` · ${c.email}` : ""}</p>
            </div>
            <button onClick={() => { setEditContact(c); setContactDraft({ name: c.name, relationship: c.relationship, phone: c.phone, email: c.email ?? "" }); }}
              style={{ width: 28, height: 28, display: "grid", placeItems: "center", border: "1px solid var(--line)", borderRadius: 7, background: "var(--surface-2)", cursor: "pointer", fontSize: 10, color: "var(--muted)" }}>✏</button>
            <button onClick={() => up({ emergencyContacts: p.emergencyContacts.filter((x) => x.id !== c.id) })}
              style={{ width: 28, height: 28, display: "grid", placeItems: "center", border: "1px solid var(--line)", borderRadius: 7, background: "var(--surface-2)", cursor: "pointer", color: "#c0392b" }}><Trash2 size={12} /></button>
          </div>
        ))}
        {editContact && (
          <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--line)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[["Name *", "name", "text"], ["Relationship", "relationship", "text"], ["Phone *", "phone", "tel"], ["Email", "email", "email"]].map(([label, key, type]) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
                  <input type={type} value={contactDraft[key as keyof typeof contactDraft]} onChange={(e) => setContactDraft((d) => ({ ...d, [key]: e.target.value }))}
                    style={{ width: "100%", height: 36, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 8, outline: "none", color: "var(--text)", background: "var(--surface)", fontSize: 12 }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setEditContact(null)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--line)", background: "none", color: "var(--muted)", fontSize: 11, cursor: "pointer" }}>Cancel</button>
              <button onClick={saveContact} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Save</button>
            </div>
          </div>
        )}
      </div>

      {/* Doctors */}
      <div className="panel" style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 500 }}>Treating Doctors</h3>
          <button onClick={() => { setDoctorDraft({ name: "", specialty: "", phone: "", practiceNumber: "", hospital: "" }); setEditDoctor({ id: -1, name: "", specialty: "", phone: "" }); }}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--muted)", fontSize: 11, fontWeight: 680, cursor: "pointer" }}>
            <Plus size={13} /> Add doctor
          </button>
        </div>
        {p.doctors.map((d) => (
          <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--line)" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(128,167,186,.15)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Stethoscope size={16} style={{ color: "#80a7ba" }} />
            </div>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: 13 }}>Dr {d.name}</strong>
              <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--muted)" }}>{d.specialty}{d.phone ? ` · ${d.phone}` : ""}{d.hospital ? ` · ${d.hospital}` : ""}</p>
            </div>
            <button onClick={() => { setEditDoctor(d); setDoctorDraft({ name: d.name, specialty: d.specialty, phone: d.phone, practiceNumber: d.practiceNumber ?? "", hospital: d.hospital ?? "" }); }}
              style={{ width: 28, height: 28, display: "grid", placeItems: "center", border: "1px solid var(--line)", borderRadius: 7, background: "var(--surface-2)", cursor: "pointer", fontSize: 10, color: "var(--muted)" }}>✏</button>
            <button onClick={() => up({ doctors: p.doctors.filter((x) => x.id !== d.id) })}
              style={{ width: 28, height: 28, display: "grid", placeItems: "center", border: "1px solid var(--line)", borderRadius: 7, background: "var(--surface-2)", cursor: "pointer", color: "#c0392b" }}><Trash2 size={12} /></button>
          </div>
        ))}
        {editDoctor && (
          <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--line)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[["Name *", "name", "text"], ["Specialty", "specialty", "text"], ["Phone *", "phone", "tel"], ["Practice No.", "practiceNumber", "text"], ["Hospital", "hospital", "text"]].map(([label, key, type]) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
                  <input type={type} value={doctorDraft[key as keyof typeof doctorDraft]} onChange={(e) => setDoctorDraft((d) => ({ ...d, [key]: e.target.value }))}
                    style={{ width: "100%", height: 36, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 8, outline: "none", color: "var(--text)", background: "var(--surface)", fontSize: 12 }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setEditDoctor(null)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--line)", background: "none", color: "var(--muted)", fontSize: 11, cursor: "pointer" }}>Cancel</button>
              <button onClick={saveDoctor} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Save</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Medical Aid Tab ────────────────────────────────────────────── */
function MedicalAidTab({ health, onChange, onToast }: { health: HealthData; onChange: (h: HealthData) => void; onToast: (m: string) => void }) {
  const ma = health.medicalAid;
  const up = (partial: Partial<typeof ma>) => { onChange({ ...health, medicalAid: { ...ma, ...partial } }); onToast("Medical aid saved"); };

  const fields: { label: string; key: keyof typeof ma; placeholder: string }[] = [
    { label: "Scheme Name",      key: "scheme",         placeholder: "e.g. Discovery Health" },
    { label: "Plan / Option",    key: "plan",           placeholder: "e.g. Classic Smart" },
    { label: "Member Number",    key: "memberNumber",   placeholder: "e.g. 12345678" },
    { label: "Principal Member", key: "principalMember",placeholder: "Name on account" },
    { label: "Dependant Code",   key: "dependantCode",  placeholder: "e.g. 00, 01" },
    { label: "Pre-Auth Line",    key: "authLine",       placeholder: "Pre-authorisation number" },
    { label: "Emergency Line",   key: "emergencyLine",  placeholder: "24hr emergency line" },
    { label: "Hospital Network", key: "hospitalNetwork",placeholder: "e.g. Netcare, Life" },
  ];

  return (
    <div className="panel" style={{ padding: 24, maxWidth: 700 }}>
      <h3 style={{ margin: "0 0 18px", fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 500 }}>Medical Aid Details</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {fields.map(({ label, key, placeholder }) => (
          <div key={key}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
            <input value={ma[key] ?? ""} onChange={(e) => onChange({ ...health, medicalAid: { ...ma, [key]: e.target.value } })} onBlur={() => onToast("Medical aid saved")}
              placeholder={placeholder}
              style={{ width: "100%", height: 42, padding: "0 12px", border: "1px solid var(--line)", borderRadius: 10, outline: "none", color: "var(--text)", background: "var(--surface-2)", fontSize: 13 }} />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--text)" }}>Security note:</strong> Medical aid details are stored locally and in your personal Supabase account. They are never shared publicly.
      </div>
    </div>
  );
}

/* ─── Readings Tab ───────────────────────────────────────────────── */
function ReadingsTab({ health, onChange, onToast }: { health: HealthData; onChange: (h: HealthData) => void; onToast: (m: string) => void }) {
  const [addOpen, setAddOpen] = useState(false);
  const [filterType, setFilterType] = useState<ReadingType | "all">("all");
  const [draft, setDraft] = useState({ type: "blood_sugar" as ReadingType, value: "", value2: "", unit: "mmol/L", date: new Date().toISOString().split("T")[0], time: `${String(new Date().getHours()).padStart(2,"0")}:${String(new Date().getMinutes()).padStart(2,"0")}`, notes: "" });

  function saveReading() {
    if (!draft.value) return;
    const meta = READING_META[draft.type];
    const entry: HealthReading = {
      id: Date.now(), type: draft.type,
      value: parseFloat(draft.value), value2: draft.value2 ? parseFloat(draft.value2) : undefined,
      unit: meta.unit, date: draft.date, time: draft.time, notes: draft.notes || undefined,
    };
    onChange({ ...health, readings: [...health.readings, entry] });
    onToast("Reading saved"); setAddOpen(false);
  }

  const filtered = [...health.readings]
    .filter((r) => filterType === "all" || r.type === filterType)
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));

  // Latest reading per type for summary cards
  const latestByType = Object.fromEntries(
    (Object.keys(READING_META) as ReadingType[]).map((t) => {
      const latest = health.readings.filter((r) => r.type === t).sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))[0];
      return [t, latest];
    })
  );

  return (
    <div>
      {/* Quick summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 20 }}>
        {(Object.keys(READING_META) as ReadingType[]).map((type) => {
          const meta = READING_META[type];
          const latest = latestByType[type];
          return (
            <div key={type} className="panel" style={{ padding: "14px 16px", borderTop: `3px solid ${meta.color}` }}>
              <span style={{ fontSize: 9, fontWeight: 750, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.8 }}>{meta.label}</span>
              <strong style={{ display: "block", fontSize: 20, color: meta.color, letterSpacing: "-0.5px", margin: "4px 0 2px" }}>
                {latest ? (type === "bp" ? `${latest.value}/${latest.value2 ?? "—"}` : latest.value) : "—"}
                <span style={{ fontSize: 9, fontWeight: 500, color: "var(--muted)", marginLeft: 3 }}>{meta.unit}</span>
              </strong>
              <span style={{ fontSize: 9, color: "var(--muted)" }}>{latest ? latest.date : "No readings"}</span>
              <div style={{ marginTop: 4, fontSize: 8, color: "var(--muted)" }}>Normal: {meta.normalRange}</div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => setAddOpen(true)} className="primary-btn"><Plus size={15} /> Log reading</button>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as typeof filterType)}
          style={{ height: 42, padding: "0 12px", border: "1px solid var(--line)", borderRadius: 11, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }}>
          <option value="all">All readings</option>
          {(Object.keys(READING_META) as ReadingType[]).map((t) => <option key={t} value={t}>{READING_META[t].label}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        {filtered.length === 0
          ? <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}><Activity size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }} /><p style={{ margin: 0 }}>No readings yet. Log your first one above.</p></div>
          : filtered.map((r, i) => {
            const meta = READING_META[r.type];
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < filtered.length - 1 ? "1px solid var(--line)" : "none" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong style={{ fontSize: 13 }}>{r.type === "bp" ? `${r.value}/${r.value2 ?? "—"}` : r.value} <span style={{ fontSize: 10, fontWeight: 400, color: "var(--muted)" }}>{meta.unit}</span></strong>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, background: "var(--surface-2)", color: "var(--muted)" }}>{meta.label}</span>
                  </div>
                  {r.notes && <p style={{ margin: "3px 0 0", fontSize: 10, color: "var(--muted)" }}>{r.notes}</p>}
                </div>
                <span style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0 }}>{r.date} {r.time}</span>
                <button onClick={() => { onChange({ ...health, readings: health.readings.filter((x) => x.id !== r.id) }); onToast("Reading deleted"); }}
                  style={{ width: 28, height: 28, display: "grid", placeItems: "center", border: "1px solid var(--line)", borderRadius: 7, background: "none", cursor: "pointer", color: "var(--muted)" }}><Trash2 size={12} /></button>
              </div>
            );
          })
        }
      </div>

      {/* Add modal */}
      {addOpen && (
        <div className="modal-backdrop" onMouseDown={() => setAddOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div><span className="eyebrow">Health</span><h2>Log a reading</h2></div>
              <button className="icon-btn" onClick={() => setAddOpen(false)}><X size={19} /></button>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>Reading Type</label>
                <select value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as ReadingType, unit: READING_META[e.target.value as ReadingType].unit }))}
                  style={{ width: "100%", height: 42, padding: "0 12px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface-2)", color: "var(--text)", fontSize: 13 }}>
                  {(Object.keys(READING_META) as ReadingType[]).map((t) => <option key={t} value={t}>{READING_META[t].label}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: draft.type === "bp" ? "1fr 1fr" : "1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>{draft.type === "bp" ? "Systolic" : "Value"} ({READING_META[draft.type].unit})</label>
                  <input type="number" autoFocus value={draft.value} onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
                    style={{ width: "100%", height: 42, padding: "0 12px", border: "1px solid var(--line)", borderRadius: 10, outline: "none", color: "var(--text)", background: "var(--surface-2)", fontSize: 16 }} />
                </div>
                {draft.type === "bp" && (
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>Diastolic (mmHg)</label>
                    <input type="number" value={draft.value2} onChange={(e) => setDraft((d) => ({ ...d, value2: e.target.value }))}
                      style={{ width: "100%", height: 42, padding: "0 12px", border: "1px solid var(--line)", borderRadius: 10, outline: "none", color: "var(--text)", background: "var(--surface-2)", fontSize: 16 }} />
                  </div>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>Date</label>
                  <input type="date" value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                    style={{ width: "100%", height: 38, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 9, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>Time</label>
                  <input type="time" value={draft.time} onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
                    style={{ width: "100%", height: 38, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 9, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>Notes (optional)</label>
                <input value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} placeholder="e.g. After meal, fasting..."
                  style={{ width: "100%", height: 38, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 9, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setAddOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={saveReading} disabled={!draft.value}>Save reading</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Scripts Tab ────────────────────────────────────────────────── */
function ScriptsTab({ health, onChange, onToast }: { health: HealthData; onChange: (h: HealthData) => void; onToast: (m: string) => void }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editScript, setEditScript] = useState<Prescription | null>(null);
  const [draft, setDraft] = useState<Omit<Prescription, "id">>({ medicationName: "", dosage: "", doctor: "", issuedDate: new Date().toISOString().split("T")[0] });

  function save() {
    if (!draft.medicationName.trim()) return;
    if (editScript) {
      onChange({ ...health, prescriptions: health.prescriptions.map((p) => p.id === editScript.id ? { ...draft, id: editScript.id } : p) });
    } else {
      onChange({ ...health, prescriptions: [...health.prescriptions, { ...draft, id: Date.now() }] });
    }
    onToast("Script saved"); setAddOpen(false); setEditScript(null);
    setDraft({ medicationName: "", dosage: "", doctor: "", issuedDate: new Date().toISOString().split("T")[0] });
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button className="primary-btn" onClick={() => { setDraft({ medicationName: "", dosage: "", doctor: "", issuedDate: today }); setEditScript(null); setAddOpen(true); }}><Plus size={15} /> Add script</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {health.prescriptions.length === 0
          ? <p style={{ color: "var(--muted)", fontSize: 13 }}>No prescriptions stored yet.</p>
          : health.prescriptions.map((s) => {
            const expiringSoon = s.validUntil && s.validUntil <= new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
            const expired = s.validUntil && s.validUntil < today;
            return (
              <div key={s.id} className="panel" style={{ padding: 18 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: 13 }}>{s.medicationName}</strong>
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--muted)" }}>{s.dosage}{s.doctor ? ` · Dr ${s.doctor}` : ""}</p>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button onClick={() => { setEditScript(s); setDraft({ ...s }); setAddOpen(true); }}
                      style={{ width: 28, height: 28, display: "grid", placeItems: "center", border: "1px solid var(--line)", borderRadius: 7, background: "var(--surface-2)", cursor: "pointer", fontSize: 10 }}>✏</button>
                    <button onClick={() => { onChange({ ...health, prescriptions: health.prescriptions.filter((x) => x.id !== s.id) }); onToast("Script removed"); }}
                      style={{ width: 28, height: 28, display: "grid", placeItems: "center", border: "1px solid var(--line)", borderRadius: 7, background: "var(--surface-2)", cursor: "pointer", color: "#c0392b" }}><Trash2 size={12} /></button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 5, background: "var(--surface-2)", color: "var(--muted)" }}>Issued: {s.issuedDate}</span>
                  {s.validUntil && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 5, background: expired ? "rgba(192,57,43,.1)" : expiringSoon ? "rgba(212,168,68,.1)" : "var(--surface-2)", color: expired ? "#c0392b" : expiringSoon ? "#b87c3e" : "var(--muted)" }}>
                    {expired ? "⚠ Expired" : expiringSoon ? "⚠ Expires soon" : "Expires"}: {s.validUntil}
                  </span>}
                  {s.repeats !== undefined && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 5, background: "var(--surface-2)", color: "var(--muted)" }}>{(s.repeatsUsed ?? 0)}/{s.repeats} repeats</span>}
                  {s.pharmacy && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 5, background: "var(--surface-2)", color: "var(--muted)" }}>{s.pharmacy}</span>}
                </div>
                {s.notes && <p style={{ margin: "8px 0 0", fontSize: 10, color: "var(--muted)" }}>{s.notes}</p>}
              </div>
            );
          })
        }
      </div>

      {addOpen && (
        <div className="modal-backdrop" onMouseDown={() => setAddOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div><span className="eyebrow">Scripts</span><h2>{editScript ? "Edit" : "Add"} prescription</h2></div>
              <button className="icon-btn" onClick={() => setAddOpen(false)}><X size={19} /></button>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {[
                ["MEDICATION NAME *", "medicationName", "text", "e.g. Metformin"],
                ["DOSAGE",            "dosage",         "text", "e.g. 500mg twice daily"],
                ["PRESCRIBING DOCTOR","doctor",         "text", "Dr Surname"],
                ["PHARMACY",         "pharmacy",        "text", "Optional"],
              ].map(([label, key, type, ph]) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>{label}</label>
                  <input type={type} value={(draft as unknown as Record<string, string>)[key] ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))} placeholder={ph}
                    style={{ width: "100%", height: 42, padding: "0 12px", border: "1px solid var(--line)", borderRadius: 10, outline: "none", color: "var(--text)", background: "var(--surface-2)", fontSize: 13 }} />
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[["ISSUED DATE","issuedDate","date"],["VALID UNTIL","validUntil","date"]].map(([label, key, type]) => (
                  <div key={key}>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>{label}</label>
                    <input type={type} value={(draft as unknown as Record<string, string | undefined>)[key] ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value || undefined }))}
                      style={{ width: "100%", height: 38, padding: "0 8px", border: "1px solid var(--line)", borderRadius: 9, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }} />
                  </div>
                ))}
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>REPEATS</label>
                  <input type="number" min="0" value={draft.repeats ?? ""} onChange={(e) => setDraft((d) => ({ ...d, repeats: e.target.value ? parseInt(e.target.value) : undefined }))}
                    style={{ width: "100%", height: 38, padding: "0 8px", border: "1px solid var(--line)", borderRadius: 9, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>NOTES</label>
                <input value={draft.notes ?? ""} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value || undefined }))} placeholder="Optional notes"
                  style={{ width: "100%", height: 38, padding: "0 12px", border: "1px solid var(--line)", borderRadius: 9, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setAddOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={save} disabled={!draft.medicationName.trim()}>Save script</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Emergency Card Tab ─────────────────────────────────────────── */
function EmergencyCardTab({ health, medications, displayName }: { health: HealthData; medications: Medication[]; displayName: string }) {
  const p = health.profile;
  const ma = health.medicalAid;
  const activeMeds = medications.filter((m) => m.active);
  const criticalMeds = activeMeds.filter((m) => m.scheduleTimes.length > 0);
  const now = new Date();
  const generated = now.toLocaleString("en-ZA");

  function printCard() { window.print(); }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <button onClick={printCard} className="primary-btn"><Printer size={16} /> Print / Export PDF</button>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>Opens your browser print dialog — save as PDF or print directly.</span>
      </div>

      {/* The printable card */}
      <div id="mjw-emergency-card" className="panel" style={{ padding: 32, maxWidth: 800, lineHeight: 1.5 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <AlertTriangle size={22} style={{ color: "#c0392b", flexShrink: 0 }} />
          <h1 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#c0392b" }}>Emergency Handover Summary</h1>
        </div>
        <p style={{ margin: "0 0 20px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--line)", paddingBottom: 12 }}>Generated: {generated} · MJW Signal</p>

        {/* Personal block */}
        <div style={{ padding: "16px 20px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface-2)", marginBottom: 20 }}>
          <h2 style={{ margin: "0 0 8px", fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700 }}>{p.fullName || displayName}</h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: p.clinicalSummary ? 12 : 0 }}>
            {p.dateOfBirth && <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: "var(--surface)", border: "1px solid var(--line)" }}>DOB: {p.dateOfBirth}</span>}
            {p.gender && <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: "var(--surface)", border: "1px solid var(--line)", textTransform: "capitalize" }}>{p.gender}</span>}
            {p.bloodType && <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: "rgba(192,57,43,.1)", border: "1px solid rgba(192,57,43,.25)", color: "#c0392b", fontWeight: 700 }}>🩸 {p.bloodType}</span>}
            {p.idNumber && <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: "var(--surface)", border: "1px solid var(--line)" }}>ID: {p.idNumber}</span>}
            {p.organDonor && <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: "rgba(96,131,107,.12)", border: "1px solid rgba(96,131,107,.3)", color: "#60836b", fontWeight: 700 }}>♥ Organ Donor</span>}
          </div>
          {p.clinicalSummary && (
            <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--line)", fontSize: 12, lineHeight: 1.6 }}>
              <strong>Clinical Summary:</strong> {p.clinicalSummary}
              {p.lastVerified && <div style={{ marginTop: 4, fontSize: 10, color: "var(--muted)" }}>Updated: {p.lastVerified}</div>}
            </div>
          )}
        </div>

        {/* Allergies */}
        <CardSection title="Known Allergies" color="#c0392b">
          {p.allergies.length === 0
            ? <span style={{ fontSize: 12, color: "#60836b", fontWeight: 600 }}>None recorded</span>
            : p.allergies.map((a, i) => <span key={i} style={{ display: "inline-block", marginRight: 6, marginBottom: 4, padding: "3px 10px", borderRadius: 6, background: "rgba(192,57,43,.1)", border: "1px solid rgba(192,57,43,.25)", fontSize: 12, color: "#c0392b", fontWeight: 700 }}>{a}</span>)
          }
        </CardSection>

        {/* Conditions */}
        {p.conditions.length > 0 && (
          <CardSection title="Immediate Risks & Chronic Conditions" color="#b87c3e">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {p.conditions.map((c, i) => <span key={i} style={{ padding: "3px 10px", borderRadius: 6, background: "rgba(212,168,68,.1)", border: "1px solid rgba(212,168,68,.25)", fontSize: 12, color: "#b87c3e" }}>{c}</span>)}
            </div>
          </CardSection>
        )}

        {/* Time-critical medications */}
        {criticalMeds.length > 0 && (
          <CardSection title="Time-Critical Medications" color="#6366f1">
            {criticalMeds.map((m) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                <strong style={{ fontSize: 13, minWidth: 120 }}>{m.name}</strong>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{m.dosage}</span>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{m.scheduleTimes.join(", ")}</span>
                {m.instructions && <span style={{ fontSize: 10, color: "var(--muted)" }}>{m.instructions}</span>}
              </div>
            ))}
          </CardSection>
        )}

        {/* All active medications */}
        {activeMeds.length > 0 && (
          <CardSection title="All Active Medications" color="var(--muted)">
            {activeMeds.map((m) => (
              <div key={m.id} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: "1px solid var(--line)", fontSize: 12 }}>
                <strong style={{ minWidth: 140 }}>{m.name}</strong>
                <span style={{ color: "var(--muted)", fontStyle: "italic" }}>({m.name})</span>
                <span style={{ color: "var(--muted)", marginLeft: "auto" }}>{m.dosage}{m.scheduleTimes.length ? ` · ${m.scheduleTimes.join("/")}` : ""}</span>
              </div>
            ))}
          </CardSection>
        )}

        {/* Emergency contacts */}
        {p.emergencyContacts.length > 0 && (
          <CardSection title="Emergency Contact" color="#60836b">
            {p.emergencyContacts.map((c) => (
              <div key={c.id} style={{ fontSize: 13, marginBottom: 4 }}>
                <strong>{c.name}</strong> ({c.relationship}) — {c.phone}{c.email ? ` · ${c.email}` : ""}
              </div>
            ))}
          </CardSection>
        )}

        {/* Treating doctors */}
        {p.doctors.length > 0 && (
          <CardSection title="Treating Doctor" color="#80a7ba">
            {p.doctors.map((d) => (
              <div key={d.id} style={{ fontSize: 13, marginBottom: 4 }}>
                <strong>Dr {d.name}</strong>{d.specialty ? ` — ${d.specialty}` : ""}{d.phone ? ` — ${d.phone}` : ""}
              </div>
            ))}
          </CardSection>
        )}

        {/* Medical aid */}
        {ma.scheme && (
          <CardSection title="Medical Aid" color="var(--muted)">
            <span style={{ fontSize: 13 }}>{ma.scheme}{ma.plan ? ` · ${ma.plan}` : ""}{ma.memberNumber ? ` · #${ma.memberNumber}` : ""}</span>
            {ma.emergencyLine && <div style={{ marginTop: 4, fontSize: 11, color: "var(--muted)" }}>Emergency: {ma.emergencyLine}</div>}
          </CardSection>
        )}

        {/* Disclaimer */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)", fontSize: 10, color: "var(--muted)", lineHeight: 1.6 }}>
          <strong>Disclaimer:</strong> This is a user-generated emergency handover summary from MJW Signal. It does not replace professional medical assessment. Medication information may be unverified. Always consult a qualified healthcare professional regarding medical decisions.
          <div style={{ marginTop: 4 }}>Generated: {generated} · MJW Signal | Personal Health Vault</div>
        </div>
      </div>
    </div>
  );
}

function CardSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color, letterSpacing: 0.3, borderBottom: `1px solid var(--line)`, paddingBottom: 6 }}>{title}</h3>
      {children}
    </div>
  );
}

/* ─── Legacy & Wishes Tab ────────────────────────────────────────── */
function LegacyTab({ health, onChange, onToast }: { health: HealthData; onChange: (h: HealthData) => void; onToast: (m: string) => void }) {
  const [legacyTab, setLegacyTab] = useState<"policies" | "wishes" | "access">("policies");
  const [editWish, setEditWish] = useState<LegacyWish | null>(null);
  const [wishDraft, setWishDraft] = useState({ section: "funeral" as LegacyWishSection, title: "", content: "" });
  const [editPolicy, setEditPolicy] = useState<LegacyPolicy | null>(null);
  const [policyDraft, setPolicyDraft] = useState<Omit<LegacyPolicy, "id">>({ name: "", type: "life", insurer: "", policyNumber: "" });
  const [pinVisible, setPinVisible] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const acc = health.legacyAccess ?? { pin: "", trustedName: "", trustedPhone: "", trustedEmail: "", grantedSections: ["emergency_card", "medications"], message: "" };
  const upAccess = (partial: Partial<typeof acc>) => onChange({ ...health, legacyAccess: { ...acc, ...partial } });

  function saveWish() {
    if (!wishDraft.content.trim()) return;
    if (editWish) {
      onChange({ ...health, wishes: health.wishes.map((w) => w.id === editWish.id ? { ...editWish, ...wishDraft, updatedAt: new Date().toISOString().split("T")[0] } : w) });
    } else {
      onChange({ ...health, wishes: [...health.wishes, { id: Date.now(), ...wishDraft, updatedAt: new Date().toISOString().split("T")[0] }] });
    }
    onToast("Wish saved"); setEditWish(null); setWishDraft({ section: "funeral", title: "", content: "" });
  }

  function savePolicy() {
    if (!policyDraft.name.trim()) return;
    if (editPolicy) {
      onChange({ ...health, policies: health.policies.map((p) => p.id === editPolicy.id ? { ...policyDraft, id: editPolicy.id } : p) });
    } else {
      onChange({ ...health, policies: [...health.policies, { ...policyDraft, id: Date.now() }] });
    }
    onToast("Policy saved"); setEditPolicy(null); setPolicyDraft({ name: "", type: "life", insurer: "", policyNumber: "" });
  }

  const legacyUrl = typeof window !== "undefined" ? `${window.location.origin}/legacy?pin=${acc.pin}` : `/legacy?pin=${acc.pin}`;

  function copyLink() {
    navigator.clipboard.writeText(legacyUrl);
    setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000);
    onToast("Link copied");
  }

  const LEGACY_TABS = [
    { id: "policies" as const, label: "Policies & Insurance" },
    { id: "wishes"   as const, label: "Wishes & Directives" },
    { id: "access"   as const, label: "Legacy Access PIN" },
  ];

  return (
    <div>
      <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.2)", marginBottom: 20, fontSize: 12, lineHeight: 1.6 }}>
        <strong style={{ color: "#6366f1" }}>Your Legacy Vault</strong> — Store your end-of-life wishes, policies, and important documents in one secure place.
        Give a trusted person a PIN to access your emergency information if something happens to you.
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {LEGACY_TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setLegacyTab(id)} style={{ padding: "7px 14px", borderRadius: 9, border: "1px solid var(--line)", background: legacyTab === id ? "#6366f1" : "var(--surface-2)", color: legacyTab === id ? "#fff" : "var(--muted)", fontSize: 12, fontWeight: 680, cursor: "pointer" }}>{label}</button>
        ))}
      </div>

      {/* Policies */}
      {legacyTab === "policies" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="primary-btn" onClick={() => { setPolicyDraft({ name: "", type: "life", insurer: "", policyNumber: "" }); setEditPolicy({ id: -1, name: "", type: "life", insurer: "", policyNumber: "" }); }}><Plus size={15} /> Add policy</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {health.policies.length === 0
              ? <p style={{ color: "var(--muted)", fontSize: 13 }}>No policies added. Add your life, medical, funeral, and other policies here.</p>
              : health.policies.map((pol) => (
                <div key={pol.id} className="panel" style={{ padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 8, padding: "2px 7px", borderRadius: 5, background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.2)", color: "#6366f1", fontWeight: 750, textTransform: "uppercase", letterSpacing: 0.6 }}>{pol.type}</span>
                      <strong style={{ display: "block", fontSize: 14, marginTop: 6 }}>{pol.name}</strong>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => { setEditPolicy(pol); setPolicyDraft({ ...pol }); }} style={{ width: 28, height: 28, display: "grid", placeItems: "center", border: "1px solid var(--line)", borderRadius: 7, background: "var(--surface-2)", cursor: "pointer", fontSize: 10 }}>✏</button>
                      <button onClick={() => { onChange({ ...health, policies: health.policies.filter((x) => x.id !== pol.id) }); onToast("Policy removed"); }} style={{ width: 28, height: 28, display: "grid", placeItems: "center", border: "1px solid var(--line)", borderRadius: 7, background: "var(--surface-2)", cursor: "pointer", color: "#c0392b" }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.7 }}>
                    <div><strong style={{ color: "var(--text)" }}>Insurer:</strong> {pol.insurer}</div>
                    <div><strong style={{ color: "var(--text)" }}>Policy #:</strong> {pol.policyNumber}</div>
                    {pol.beneficiary && <div><strong style={{ color: "var(--text)" }}>Beneficiary:</strong> {pol.beneficiary}</div>}
                    {pol.contact && <div><strong style={{ color: "var(--text)" }}>Contact:</strong> {pol.contact}</div>}
                    {pol.premiumAmount && <div><strong style={{ color: "var(--text)" }}>Premium:</strong> R {pol.premiumAmount.toLocaleString("en-ZA")}/mo</div>}
                    {pol.notes && <div style={{ marginTop: 4, fontSize: 10 }}>{pol.notes}</div>}
                  </div>
                </div>
              ))
            }
          </div>

          {editPolicy && (
            <div className="modal-backdrop" onMouseDown={() => setEditPolicy(null)}>
              <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
                <div className="modal-head"><div><span className="eyebrow">Legacy</span><h2>{editPolicy.id === -1 ? "Add" : "Edit"} policy</h2></div><button className="icon-btn" onClick={() => setEditPolicy(null)}><X size={19} /></button></div>
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>POLICY NAME *</label>
                      <input value={policyDraft.name} onChange={(e) => setPolicyDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. FNB Life Cover" autoFocus style={{ width: "100%", height: 42, padding: "0 12px", border: "1px solid var(--line)", borderRadius: 10, outline: "none", color: "var(--text)", background: "var(--surface-2)", fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>TYPE</label>
                      <select value={policyDraft.type} onChange={(e) => setPolicyDraft((d) => ({ ...d, type: e.target.value as typeof d.type }))} style={{ width: "100%", height: 42, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface-2)", color: "var(--text)", fontSize: 13 }}>
                        {POLICY_TYPES.map((t) => <option key={t} value={t} style={{ textTransform: "capitalize" }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>INSURER *</label>
                      <input value={policyDraft.insurer} onChange={(e) => setPolicyDraft((d) => ({ ...d, insurer: e.target.value }))} placeholder="e.g. Old Mutual" style={{ width: "100%", height: 42, padding: "0 12px", border: "1px solid var(--line)", borderRadius: 10, outline: "none", color: "var(--text)", background: "var(--surface-2)", fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>POLICY NUMBER *</label>
                      <input value={policyDraft.policyNumber} onChange={(e) => setPolicyDraft((d) => ({ ...d, policyNumber: e.target.value }))} placeholder="Policy reference number" style={{ width: "100%", height: 42, padding: "0 12px", border: "1px solid var(--line)", borderRadius: 10, outline: "none", color: "var(--text)", background: "var(--surface-2)", fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>BENEFICIARY</label>
                      <input value={policyDraft.beneficiary ?? ""} onChange={(e) => setPolicyDraft((d) => ({ ...d, beneficiary: e.target.value || undefined }))} placeholder="Optional" style={{ width: "100%", height: 38, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 9, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>CONTACT / CLAIMS</label>
                      <input value={policyDraft.contact ?? ""} onChange={(e) => setPolicyDraft((d) => ({ ...d, contact: e.target.value || undefined }))} placeholder="Phone or email" style={{ width: "100%", height: 38, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 9, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>NOTES</label>
                    <input value={policyDraft.notes ?? ""} onChange={(e) => setPolicyDraft((d) => ({ ...d, notes: e.target.value || undefined }))} placeholder="Any important notes" style={{ width: "100%", height: 38, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 9, background: "var(--surface-2)", color: "var(--text)", fontSize: 12 }} />
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="secondary-btn" onClick={() => setEditPolicy(null)}>Cancel</button>
                  <button className="primary-btn" onClick={savePolicy} disabled={!policyDraft.name.trim() || !policyDraft.insurer.trim()}>Save policy</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Wishes */}
      {legacyTab === "wishes" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginBottom: 16 }}>
            {WISH_SECTIONS.map(({ key, label }) => {
              const existing = health.wishes.find((w) => w.section === key);
              return (
                <div key={key} className="panel" style={{ padding: 18, borderLeft: existing ? "3px solid #6366f1" : "3px solid var(--line)", cursor: "pointer" }}
                  onClick={() => { setEditWish(existing ?? { id: -1, section: key, title: label, content: "", updatedAt: "" }); setWishDraft({ section: key, title: existing?.title ?? label, content: existing?.content ?? "" }); }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: existing ? "#6366f1" : "var(--muted)" }}>{label}</span>
                    {existing ? <Check size={14} style={{ color: "#6366f1" }} /> : <Plus size={14} style={{ color: "var(--muted)" }} />}
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--muted)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {existing?.content || "Click to add your wishes for this section."}
                  </p>
                  {existing?.updatedAt && <span style={{ fontSize: 9, color: "var(--muted)", display: "block", marginTop: 8 }}>Updated: {existing.updatedAt}</span>}
                </div>
              );
            })}
          </div>

          {editWish && (
            <div className="modal-backdrop" onMouseDown={() => setEditWish(null)}>
              <div className="modal" style={{ width: "min(640px, 100%)" }} onMouseDown={(e) => e.stopPropagation()}>
                <div className="modal-head"><div><span className="eyebrow">Legacy</span><h2>{wishDraft.title}</h2></div><button className="icon-btn" onClick={() => setEditWish(null)}><X size={19} /></button></div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>TITLE</label>
                  <input value={wishDraft.title} onChange={(e) => setWishDraft((d) => ({ ...d, title: e.target.value }))} style={{ width: "100%", height: 40, padding: "0 12px", border: "1px solid var(--line)", borderRadius: 10, outline: "none", color: "var(--text)", background: "var(--surface-2)", fontSize: 13, marginBottom: 12 }} />
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>YOUR WISHES / INSTRUCTIONS</label>
                  <textarea value={wishDraft.content} onChange={(e) => setWishDraft((d) => ({ ...d, content: e.target.value }))} placeholder="Write your wishes, instructions, or information here..."
                    style={{ width: "100%", height: 200, padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10, outline: "none", color: "var(--text)", background: "var(--surface-2)", fontSize: 13, fontFamily: "inherit", resize: "vertical", lineHeight: 1.6 }} />
                </div>
                <div className="modal-actions">
                  {editWish.id !== -1 && <button onClick={() => { onChange({ ...health, wishes: health.wishes.filter((w) => w.id !== editWish.id) }); onToast("Removed"); setEditWish(null); }} style={{ marginRight: "auto", padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(192,57,43,.3)", background: "none", color: "#c0392b", fontSize: 11, cursor: "pointer" }}>Remove</button>}
                  <button className="secondary-btn" onClick={() => setEditWish(null)}>Cancel</button>
                  <button className="primary-btn" onClick={saveWish} disabled={!wishDraft.content.trim()}>Save</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legacy Access PIN */}
      {legacyTab === "access" && (
        <div style={{ maxWidth: 600 }}>
          <div style={{ padding: "16px 20px", borderRadius: 12, background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.2)", marginBottom: 20, fontSize: 12, lineHeight: 1.7 }}>
            <strong style={{ color: "#6366f1", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}><KeyRound size={14} /> How Legacy Access works</strong>
            Set a PIN and choose what sections a trusted person can see. Share the link with them.
            When they visit the link and enter the PIN, they see only the sections you've allowed — your emergency card, medications, wishes, and/or policies.
            <strong style={{ display: "block", marginTop: 6, color: "#c0392b" }}>Never share this link publicly. Only share with someone you trust unconditionally.</strong>
          </div>

          <div className="panel" style={{ padding: 24 }}>
            <h3 style={{ margin: "0 0 18px", fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 500 }}>Trusted Person</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[["Full Name", "trustedName", "text", "Who you trust"], ["Phone", "trustedPhone", "tel", "Their number"], ["Email", "trustedEmail", "email", "Optional"]].map(([label, key, type, ph]) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>{label}</label>
                  <input type={type} value={(acc as unknown as Record<string, string | undefined>)[key] ?? ""} onChange={(e) => upAccess({ [key]: e.target.value })} onBlur={() => onToast("Saved")} placeholder={ph}
                    style={{ width: "100%", height: 40, padding: "0 12px", border: "1px solid var(--line)", borderRadius: 10, outline: "none", color: "var(--text)", background: "var(--surface-2)", fontSize: 13 }} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>Message to trusted person</label>
              <textarea value={acc.message ?? ""} onChange={(e) => upAccess({ message: e.target.value })} onBlur={() => onToast("Saved")} placeholder="A personal note shown when they access this..."
                style={{ width: "100%", height: 70, padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, outline: "none", color: "var(--text)", background: "var(--surface-2)", fontSize: 13, fontFamily: "inherit", resize: "none" }} />
            </div>

            <h3 style={{ margin: "20px 0 12px", fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 500 }}>Access PIN</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <input
                type={pinVisible ? "text" : "password"}
                maxLength={8}
                value={acc.pin}
                onChange={(e) => upAccess({ pin: e.target.value.replace(/\D/g, "").slice(0, 8) })}
                onBlur={() => onToast("PIN saved")}
                placeholder="Enter 4–8 digit PIN"
                style={{ width: 180, height: 48, padding: "0 14px", border: "2px solid var(--line)", borderRadius: 12, outline: "none", color: "var(--text)", background: "var(--surface-2)", fontSize: 22, letterSpacing: 6, fontWeight: 700 }}
              />
              <button onClick={() => setPinVisible((v) => !v)} style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--muted)", fontSize: 11, cursor: "pointer" }}>
                {pinVisible ? "Hide" : "Show"}
              </button>
            </div>

            <h3 style={{ margin: "0 0 12px", fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 500 }}>What they can access</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {(["emergency_card", "medications", "wishes", "policies"] as const).map((sec) => {
                const labels: Record<string, string> = { emergency_card: "Emergency Card", medications: "Medications", wishes: "Wishes & Directives", policies: "Policies" };
                const checked = acc.grantedSections.includes(sec);
                return (
                  <button key={sec} onClick={() => upAccess({ grantedSections: checked ? acc.grantedSections.filter((s) => s !== sec) : [...acc.grantedSections, sec] })}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 9, border: `1px solid ${checked ? "#6366f1" : "var(--line)"}`, background: checked ? "rgba(99,102,241,.1)" : "var(--surface-2)", color: checked ? "#6366f1" : "var(--muted)", fontSize: 11, fontWeight: 680, cursor: "pointer" }}>
                    {checked && <Check size={12} />}{labels[sec]}
                  </button>
                );
              })}
            </div>

            {acc.pin && acc.trustedName && (
              <div style={{ padding: "14px 18px", borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "var(--text)" }}>Share this link with {acc.trustedName}:</p>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <code style={{ flex: 1, fontSize: 11, color: "#6366f1", wordBreak: "break-all", padding: "8px 12px", background: "var(--surface)", borderRadius: 8, border: "1px solid var(--line)" }}>{legacyUrl}</code>
                  <button onClick={copyLink} style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid var(--line)", background: copySuccess ? "rgba(96,131,107,.15)" : "var(--surface-2)", color: copySuccess ? "var(--green)" : "var(--muted)", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                    {copySuccess ? "✓ Copied!" : "Copy link"}
                  </button>
                </div>
                <p style={{ margin: "8px 0 0", fontSize: 10, color: "var(--muted)" }}>They also need the PIN: <strong>{pinVisible ? acc.pin : "••••"}</strong> — share it separately, not with the link.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
