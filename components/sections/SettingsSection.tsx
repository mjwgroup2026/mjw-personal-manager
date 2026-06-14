"use client";
import { signOut } from "next-auth/react";
import { AlertTriangle, Download, Info, Key, LogOut, Pencil, Settings, Shield, Trash2, User } from "lucide-react";
import { useState } from "react";
import { Field, Modal, inputStyle } from "@/components/ui/Modal";
import { IMPORT_TASKS, IMPORT_HABITS, IMPORT_PROJECTS, applyMoneyImport } from "@/lib/personalImport";
import type { Task, Habit, Project, MoneyData } from "@/lib/types";

export function SettingsSection({
  username,
  displayName,
  onToast,
  onResetData,
  onDisplayNameChange,
  onImportPersonal,
}: {
  username: string;
  displayName: string;
  onToast: (msg: string) => void;
  onResetData: () => void;
  onDisplayNameChange: (name: string) => void;
  onImportPersonal?: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  const [showEditUsername, setShowEditUsername] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);

  return (
    <div>
      <div className="section-hero">
        <div className="section-icon"><Settings size={24} /></div>
        <div>
          <span className="eyebrow">Your space</span>
          <h1>Settings</h1>
          <p>Manage your account and workspace preferences.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 900 }}>

        {/* Profile */}
        <section className="panel" style={{ padding: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
            <div style={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 12, background: "#f8e2db" }}>
              <User size={20} style={{ color: "var(--accent-dark)" }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 500 }}>Profile</h2>
              <p style={{ margin: "3px 0 0", color: "var(--muted)", fontSize: 11 }}>Your account details</p>
            </div>
          </div>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)", fontSize: 12 }}>
              <span style={{ color: "var(--muted)" }}>Display name</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <strong>{displayName}</strong>
                <button
                  onClick={() => setShowEditName(true)}
                  style={{ width: 26, height: 26, display: "grid", placeItems: "center", borderRadius: 7, border: "1px solid var(--line)", background: "var(--surface-2)", cursor: "pointer" }}
                  aria-label="Edit display name"
                >
                  <Pencil size={12} />
                </button>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)", fontSize: 12 }}>
              <span style={{ color: "var(--muted)" }}>Username</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <strong>{username}</strong>
                <button
                  onClick={() => setShowEditUsername(true)}
                  style={{ width: 26, height: 26, display: "grid", placeItems: "center", borderRadius: 7, border: "1px solid var(--line)", background: "var(--surface-2)", cursor: "pointer" }}
                  aria-label="Change username"
                >
                  <Pencil size={12} />
                </button>
              </div>
            </div>
            <Row label="Workspace" value="Personal workspace" />
          </div>
          <p style={{ marginTop: 18, fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
            Username and display name can be changed anytime. A username change will require you to sign in again.
          </p>
        </section>

        {/* Security */}
        <section className="panel" style={{ padding: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
            <div style={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 12, background: "#ece8f4" }}>
              <Key size={20} style={{ color: "#9c8db2" }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 500 }}>Security</h2>
              <p style={{ margin: "3px 0 0", color: "var(--muted)", fontSize: 11 }}>Password & access</p>
            </div>
          </div>
          <button
            onClick={() => setShowPassword(true)}
            style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface-2)", textAlign: "left", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}
          >
            <Key size={16} style={{ color: "var(--muted)" }} /> Change password
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface-2)", textAlign: "left", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, color: "var(--accent-dark)" }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </section>

        {/* Data */}
        <section className="panel" style={{ padding: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
            <div style={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 12, background: "#e3eee5" }}>
              <Shield size={20} style={{ color: "#4f7d5d" }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 500 }}>Data</h2>
              <p style={{ margin: "3px 0 0", color: "var(--muted)", fontSize: 11 }}>Manage your workspace data</p>
            </div>
          </div>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
            Your data is saved to Supabase (when configured) and your browser. Resetting will permanently erase all your tasks, habits, journal entries, finances, projects, and people.
          </p>
          <button
            onClick={() => setShowReset(true)}
            style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "1px solid #fcc", background: "#fff5f5", textAlign: "left", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, color: "#c0392b" }}
          >
            <Trash2 size={16} /> Reset all my data
          </button>
        </section>

        {/* Disclaimer */}
        <section className="panel" style={{ padding: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div style={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 12, background: "#f4dfbf" }}>
              <Info size={20} style={{ color: "#b77c3e" }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 500 }}>Disclaimer</h2>
            </div>
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.7, color: "var(--muted)" }}>
            <p style={{ margin: "0 0 10px" }}>
              <strong style={{ color: "var(--text)" }}>MJW Signal</strong> is a private, personal command dashboard. Access is restricted to authorised users only.
            </p>
            <p style={{ margin: "0 0 10px" }}>
              Figures, risk indicators, and AI/system-generated summaries must be verified against approved source records before financial, legal, or operational action is taken. This dashboard does not replace formal approval processes, source documents, or accounting records.
            </p>
            <p style={{ margin: "0 0 10px" }}>
              All data is stored in your Supabase database and locally in your browser. No data is shared with third parties beyond your chosen hosting provider.
            </p>
            <p style={{ margin: 0 }}>
              © {new Date().getFullYear()} MJW Signal. All rights reserved. Unauthorised access is prohibited.
            </p>
          </div>
        </section>
      </div>

      {/* Personal Register Import */}
      {onImportPersonal && (
        <section className="panel" style={{ padding: 26, marginTop: 16, maxWidth: 900 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(201,152,10,.12)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Download size={20} style={{ color: "var(--gold)" }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700 }}>Import Personal Command Register</h3>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
                Loads your Gmail-reviewed personal register (14 May–14 Jun 2026) into your dashboard.<br />
                Adds <strong>{IMPORT_TASKS.length} tasks</strong>, <strong>{IMPORT_HABITS.length} habits</strong>, <strong>{IMPORT_PROJECTS.length} projects</strong>, and money items (loans + subscriptions).<br />
                Existing items are not overwritten. Duplicates are skipped automatically. Data stays in your Supabase profile only.
              </p>
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(201,152,10,.06)", border: "1px solid rgba(201,152,10,.2)", fontSize: 11, color: "var(--muted)", marginBottom: 14 }}>
                Privacy audit: all imported data is written to your personal Supabase row (same as all other data). No credentials, OTPs, or API keys are included per PER-RULE-001.
              </div>
              <button className="primary-btn" style={{ background: "var(--gold)", color: "#1a1a1a" }} onClick={() => setShowImportConfirm(true)}>
                Import Personal Register
              </button>
            </div>
          </div>
        </section>
      )}

      {showImportConfirm && (
        <Modal title="Import Personal Command Register?" onClose={() => setShowImportConfirm(false)}>
          <p style={{ margin: "0 0 14px", fontSize: 13, lineHeight: 1.6 }}>
            This will add <strong>{IMPORT_TASKS.length} tasks</strong>, <strong>{IMPORT_HABITS.length} habits</strong>, <strong>{IMPORT_PROJECTS.length} projects</strong>, and money items to your dashboard. Existing items will not be changed.
          </p>
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--surface-2)", fontSize: 11, color: "var(--muted)", marginBottom: 16 }}>
            Source: Gmail review 14 May–14 Jun 2026. No credentials stored. Data stays in your account only.
          </div>
          <div className="modal-actions">
            <button className="secondary-btn" onClick={() => setShowImportConfirm(false)}>Cancel</button>
            <button className="primary-btn" style={{ background: "var(--gold)", color: "#1a1a1a" }} onClick={() => { onImportPersonal?.(); setShowImportConfirm(false); }}>
              Yes, import now
            </button>
          </div>
        </Modal>
      )}

      {showEditName && (
        <EditNameModal
          current={displayName}
          onSave={(name) => { onDisplayNameChange(name); onToast("Display name updated"); setShowEditName(false); }}
          onClose={() => setShowEditName(false)}
        />
      )}

      {showEditUsername && (
        <ChangeUsernameModal
          current={username}
          onToast={onToast}
          onClose={() => setShowEditUsername(false)}
        />
      )}

      {showPassword && (
        <PasswordModal username={username} onToast={onToast} onClose={() => setShowPassword(false)} />
      )}

      {showReset && (
        <Modal title="Reset all data?" onClose={() => setShowReset(false)}>
          <div style={{ display: "flex", gap: 12, padding: "16px 0" }}>
            <AlertTriangle size={24} style={{ color: "#c0392b", flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
              This will permanently delete all your tasks, habits, journal entries, money data, projects, and people. This cannot be undone.
            </p>
          </div>
          <div className="modal-actions">
            <button className="secondary-btn" onClick={() => setShowReset(false)}>Cancel</button>
            <button
              className="primary-btn"
              style={{ background: "#c0392b" }}
              onClick={() => { onResetData(); setShowReset(false); onToast("All data reset"); }}
            >
              Yes, reset everything
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--line)", fontSize: 12 }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EditNameModal({ current, onSave, onClose }: { current: string; onSave: (n: string) => void; onClose: () => void }) {
  const [name, setName] = useState(current);
  return (
    <Modal title="Edit display name" onClose={onClose}>
      <Field label="Display name">
        <input
          style={inputStyle}
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onSave(name.trim())}
        />
      </Field>
      <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--muted)" }}>
        This is how your name appears across MJW Signal.
      </p>
      <div className="modal-actions">
        <button className="secondary-btn" onClick={onClose}>Cancel</button>
        <button className="primary-btn" onClick={() => { if (name.trim()) onSave(name.trim()); }}>Save name</button>
      </div>
    </Modal>
  );
}

function ChangeUsernameModal({ current, onToast, onClose }: { current: string; onToast: (m: string) => void; onClose: () => void }) {
  const [newUsername, setNewUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setError("");
    if (!newUsername.trim()) { setError("Username is required."); return; }
    setLoading(true);
    const res = await fetch("/api/auth/change-username", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ newUsername: newUsername.trim() }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Failed to change username."); return; }
    onToast("Username changed. Please sign in again with your new username.");
    onClose();
    // Force sign out so they re-authenticate with new username
    setTimeout(() => {
      import("next-auth/react").then(({ signOut }) => signOut({ callbackUrl: "/login" }));
    }, 1500);
  }

  return (
    <Modal title="Change username" onClose={onClose}>
      <p style={{ margin: "0 0 16px", fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
        Current username: <strong>{current}</strong>. All your data will be migrated to the new username. You will be signed out after the change.
      </p>
      <Field label="New username">
        <input
          style={inputStyle}
          autoFocus
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          placeholder="new-username"
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
      </Field>
      {error && <p style={{ color: "#c0392b", fontSize: 12, margin: "0 0 8px" }}>{error}</p>}
      <div className="modal-actions">
        <button className="secondary-btn" onClick={onClose}>Cancel</button>
        <button className="primary-btn" onClick={handleSave} disabled={loading}>
          {loading ? "Saving…" : "Change username"}
        </button>
      </div>
    </Modal>
  );
}

function PasswordModal({ username, onToast, onClose }: { username: string; onToast: (m: string) => void; onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleChange() {
    setError("");
    if (!current || !next) { setError("All fields required."); return; }
    if (next.length < 6) { setError("New password must be at least 6 characters."); return; }
    if (next !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true);
    const res = await fetch("/api/auth/change-password", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Failed to change password."); return; }
    onToast("Password changed successfully.");
    onClose();
  }

  return (
    <Modal title="Change password" onClose={onClose}>
      <Field label="Current password">
        <input style={inputStyle} type="password" autoFocus value={current} onChange={(e) => setCurrent(e.target.value)} />
      </Field>
      <Field label="New password">
        <input style={inputStyle} type="password" value={next} onChange={(e) => setNext(e.target.value)} />
      </Field>
      <Field label="Confirm new password">
        <input style={inputStyle} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      {error && <p style={{ color: "#c0392b", fontSize: 12, margin: "0 0 8px" }}>{error}</p>}
      <div className="modal-actions">
        <button className="secondary-btn" onClick={onClose}>Cancel</button>
        <button className="primary-btn" onClick={handleChange} disabled={loading}>
          {loading ? "Saving…" : "Change password"}
        </button>
      </div>
    </Modal>
  );
}
