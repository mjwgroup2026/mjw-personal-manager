"use client";

import { AlertTriangle, KeyRound, Printer, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type LegacyPayload = {
  granted: string[];
  trustedName: string;
  message?: string;
  profile?: {
    fullName: string; dateOfBirth: string; idNumber: string; gender: string;
    bloodType: string; organDonor: boolean; clinicalSummary: string;
    conditions: string[]; allergies: string[];
    emergencyContacts: { id: number; name: string; relationship: string; phone: string; email?: string }[];
    doctors: { id: number; name: string; specialty: string; phone: string }[];
  };
  medicalAid?: { scheme: string; plan: string; memberNumber: string; emergencyLine?: string };
  medications?: { id: number; name: string; dosage: string; active: boolean; scheduleTimes: string[] }[];
  policies?: { id: number; name: string; type: string; insurer: string; policyNumber: string; beneficiary?: string; contact?: string }[];
  wishes?: { id: number; section: string; title: string; content: string; updatedAt: string }[];
};

function LegacyContent() {
  const params = useSearchParams();
  const urlPin = params.get("pin") ?? "";

  const [pin, setPin] = useState(urlPin);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<LegacyPayload | null>(null);

  useEffect(() => {
    if (urlPin && urlPin.length >= 4) unlock(urlPin);
  }, [urlPin]);

  async function unlock(p = pin) {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/legacy?pin=${encodeURIComponent(p)}`);
      if (!res.ok) { setError("Invalid PIN. Please check and try again."); setLoading(false); return; }
      const json = await res.json();
      setData(json);
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  if (data) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px", fontFamily: "system-ui, sans-serif", color: "#1a1a1a", background: "#fff", minHeight: "100vh" }}>
        {/* Print button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24, gap: 10 }}>
          <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "1px solid #ddd", background: "#f5f5f5", cursor: "pointer", fontSize: 12, fontWeight: 700 }}><Printer size={15} /> Print / Save PDF</button>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
          <AlertTriangle size={26} style={{ color: "#c0392b" }} />
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#c0392b" }}>Emergency Handover</h1>
        </div>
        <p style={{ margin: "0 0 24px", fontSize: 12, color: "#666", borderBottom: "1px solid #eee", paddingBottom: 12 }}>
          This document was prepared by {data.profile?.fullName ?? "the account holder"} in advance for emergency responders.
          Generated: {new Date().toLocaleString("en-ZA")}
        </p>

        {data.message && (
          <div style={{ marginBottom: 24, padding: "14px 18px", borderRadius: 10, background: "#f8f4ff", border: "1px solid #d4b8ff", fontSize: 13, lineHeight: 1.6 }}>
            <strong>Personal message:</strong> {data.message}
          </div>
        )}

        {/* Profile block */}
        {data.profile && (
          <div style={{ marginBottom: 24, padding: "18px 22px", borderRadius: 12, border: "1px solid #e5e5e5", background: "#fcfcfc" }}>
            <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 800 }}>{data.profile.fullName}</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: data.profile.clinicalSummary ? 12 : 0 }}>
              {data.profile.dateOfBirth && <Chip label={`DOB: ${data.profile.dateOfBirth}`} />}
              {data.profile.gender && <Chip label={data.profile.gender} style={{ textTransform: "capitalize" }} />}
              {data.profile.bloodType && <Chip label={`🩸 ${data.profile.bloodType}`} color="#c0392b" />}
              {data.profile.idNumber && <Chip label={`ID: ${data.profile.idNumber}`} />}
              {data.profile.organDonor && <Chip label="♥ Organ Donor" color="#276749" />}
            </div>
            {data.profile.clinicalSummary && (
              <div style={{ padding: "12px 14px", borderRadius: 8, background: "#fff", border: "1px solid #e5e5e5", fontSize: 13, lineHeight: 1.6 }}>
                <strong>Clinical Summary:</strong> {data.profile.clinicalSummary}
              </div>
            )}
          </div>
        )}

        {/* Allergies */}
        {data.profile && (
          <Section title="Known Allergies" color="#c0392b">
            {data.profile.allergies.length === 0
              ? <span style={{ color: "#276749", fontWeight: 700, fontSize: 13 }}>No known allergies</span>
              : data.profile.allergies.map((a, i) => <Chip key={i} label={a} color="#c0392b" />)
            }
          </Section>
        )}

        {/* Conditions */}
        {data.profile && data.profile.conditions.length > 0 && (
          <Section title="Conditions & Immediate Risks" color="#b87c3e">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {data.profile.conditions.map((c, i) => <Chip key={i} label={c} color="#b87c3e" />)}
            </div>
          </Section>
        )}

        {/* Medications */}
        {data.medications && data.medications.filter((m) => m.active).length > 0 && (
          <Section title="Active Medications" color="#4b5563">
            {data.medications.filter((m) => m.active).map((m) => (
              <div key={m.id} style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
                <strong style={{ minWidth: 150 }}>{m.name}</strong>
                <span style={{ color: "#666" }}>{m.dosage}</span>
                {m.scheduleTimes.length > 0 && <span style={{ color: "#888", marginLeft: "auto" }}>{m.scheduleTimes.join(", ")}</span>}
              </div>
            ))}
          </Section>
        )}

        {/* Emergency contacts */}
        {data.profile && data.profile.emergencyContacts.length > 0 && (
          <Section title="Emergency Contact" color="#276749">
            {data.profile.emergencyContacts.map((c) => (
              <div key={c.id} style={{ fontSize: 13, marginBottom: 4 }}>
                <strong>{c.name}</strong> ({c.relationship}) — {c.phone}{c.email ? ` · ${c.email}` : ""}
              </div>
            ))}
          </Section>
        )}

        {/* Doctors */}
        {data.profile && data.profile.doctors.length > 0 && (
          <Section title="Treating Doctor" color="#1e40af">
            {data.profile.doctors.map((d) => (
              <div key={d.id} style={{ fontSize: 13, marginBottom: 4 }}>
                <strong>Dr {d.name}</strong>{d.specialty ? ` — ${d.specialty}` : ""}{d.phone ? ` — ${d.phone}` : ""}
              </div>
            ))}
          </Section>
        )}

        {/* Medical aid */}
        {data.medicalAid?.scheme && (
          <Section title="Medical Aid" color="#4b5563">
            <span style={{ fontSize: 13 }}>{data.medicalAid.scheme}{data.medicalAid.plan ? ` · ${data.medicalAid.plan}` : ""}{data.medicalAid.memberNumber ? ` · #${data.medicalAid.memberNumber}` : ""}</span>
            {data.medicalAid.emergencyLine && <div style={{ marginTop: 4, fontSize: 11, color: "#666" }}>Emergency: {data.medicalAid.emergencyLine}</div>}
          </Section>
        )}

        {/* Policies */}
        {data.policies && data.policies.length > 0 && (
          <Section title="Policies & Insurance" color="#5b21b6">
            {data.policies.map((p) => (
              <div key={p.id} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
                <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#ede9fe", color: "#5b21b6", fontWeight: 750, alignSelf: "center", textTransform: "uppercase" }}>{p.type}</span>
                <strong>{p.name}</strong>
                <span style={{ color: "#666" }}>{p.insurer}</span>
                <span style={{ color: "#888", marginLeft: "auto" }}>#{p.policyNumber}</span>
              </div>
            ))}
          </Section>
        )}

        {/* Wishes */}
        {data.wishes && data.wishes.length > 0 && (
          <Section title="Wishes & Final Instructions" color="#6b21a8">
            {data.wishes.map((w) => (
              <div key={w.id} style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 8, border: "1px solid #e5e5e5" }}>
                <strong style={{ fontSize: 12, display: "block", marginBottom: 6 }}>{w.title}</strong>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: "#333", whiteSpace: "pre-wrap" }}>{w.content}</p>
                <span style={{ fontSize: 9, color: "#999", display: "block", marginTop: 6 }}>Updated: {w.updatedAt}</span>
              </div>
            ))}
          </Section>
        )}

        <div style={{ marginTop: 28, paddingTop: 16, borderTop: "1px solid #eee", fontSize: 10, color: "#999", lineHeight: 1.6 }}>
          <strong>Disclaimer:</strong> This is a user-prepared emergency document from MJW Signal. It does not replace professional medical assessment. Information may be unverified. Always consult a qualified healthcare professional regarding medical decisions.
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0A0F", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: "min(420px, 90vw)", padding: 32, borderRadius: 20, background: "#12121A", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <KeyRound size={24} style={{ color: "#818cf8" }} />
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#fff" }}>Legacy Access</h1>
          <p style={{ margin: 0, fontSize: 13, color: "#8A8A9A", lineHeight: 1.5 }}>Enter the PIN you received to view this person's emergency information.</p>
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 9, background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.3)", fontSize: 12, color: "#e07070", textAlign: "center" }}>{error}</div>
        )}

        <div style={{ marginBottom: 16 }}>
          <input
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
            onKeyDown={(e) => e.key === "Enter" && unlock()}
            placeholder="Enter PIN"
            autoFocus
            style={{ width: "100%", height: 56, textAlign: "center", fontSize: 28, fontWeight: 800, letterSpacing: 12, padding: "0 16px", border: "2px solid rgba(255,255,255,0.1)", borderRadius: 14, outline: "none", color: "#fff", background: "#1E1E28", boxSizing: "border-box" }}
          />
        </div>

        <button
          onClick={() => unlock()}
          disabled={loading || pin.length < 4}
          style={{ width: "100%", height: 52, borderRadius: 14, border: "none", background: pin.length >= 4 ? "#6366f1" : "rgba(99,102,241,0.3)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: pin.length >= 4 ? "pointer" : "default" }}
        >
          {loading ? "Checking…" : "Unlock"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 20 }}>
          <ShieldCheck size={13} style={{ color: "#8A8A9A" }} />
          <p style={{ margin: 0, fontSize: 10, color: "#8A8A9A" }}>Secured by MJW Signal. Only authorised access is shown.</p>
        </div>
      </div>
    </div>
  );
}

function Chip({ label, color, style }: { label: string; color?: string; style?: React.CSSProperties }) {
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 6, background: color ? `${color}18` : "#f5f5f5", border: `1px solid ${color ? `${color}40` : "#e5e5e5"}`, fontSize: 11, color: color ?? "#555", fontWeight: color ? 700 : 400, ...style }}>{label}</span>
  );
}
function Section({ title, color, children }: { title: string; color?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 800, color: color ?? "#333", textTransform: "uppercase", letterSpacing: 0.6, borderBottom: "1px solid #eee", paddingBottom: 6 }}>{title}</h3>
      {children}
    </div>
  );
}

export default function LegacyPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0A0A0F", display: "flex", alignItems: "center", justifyContent: "center", color: "#8A8A9A" }}>Loading…</div>}>
      <LegacyContent />
    </Suspense>
  );
}
