"use client";
import { Download, FileText, File, ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Field, Modal, inputStyle, selectStyle, textareaStyle } from "@/components/ui/Modal";
import type { DocumentMeta } from "@/lib/types";

const CATEGORIES = ["Bank Statements", "Tax", "Legal", "Medical", "Policies", "Identity", "Contracts", "Insurance", "Notes & Scripts", "Other"];

const SUPABASE_ENABLED = process.env.NEXT_PUBLIC_SUPABASE_ENABLED === "true";

function fileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <ImageIcon size={28} />;
  if (mimeType === "application/pdf") return <FileText size={28} />;
  return <File size={28} />;
}

function fileColor(mimeType: string) {
  if (mimeType.startsWith("image/")) return "#60836b";
  if (mimeType === "application/pdf") return "#c0392b";
  if (mimeType.includes("word") || mimeType.includes("document")) return "#2980b9";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "#27ae60";
  return "var(--muted)";
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string) {
  try { return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)); }
  catch { return iso; }
}

export function DocumentsSection({
  documents,
  onChange,
  onToast,
}: {
  documents: DocumentMeta[];
  onChange: (d: DocumentMeta[]) => void;
  onToast: (msg: string) => void;
}) {
  const fileRef   = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending]     = useState<File | null>(null);
  const [showMeta, setShowMeta]   = useState(false);
  const [filterCat, setFilterCat] = useState<string>("All");

  const categories = ["All", ...CATEGORIES];
  const filtered = filterCat === "All" ? documents : documents.filter((d) => d.category === filterCat);

  function pickFile() {
    fileRef.current?.click();
  }

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) { onToast("File too large — max 20 MB"); return; }
    setPending(f);
    setShowMeta(true);
    e.target.value = "";
  }

  async function upload(name: string, category: string, notes: string) {
    if (!pending) return;
    setUploading(true);
    setShowMeta(false);
    try {
      const form = new FormData();
      form.append("file", pending);
      const res = await fetch("/api/documents/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) { onToast(json.error ?? "Upload failed"); return; }
      const meta: DocumentMeta = {
        id: Date.now(),
        name: name || pending.name,
        fileName: json.fileName,
        storagePath: json.storagePath,
        size: json.size,
        mimeType: json.mimeType,
        category,
        notes,
        uploadedAt: new Date().toISOString().split("T")[0],
      };
      onChange([...documents, meta]);
      onToast("Document uploaded");
    } catch {
      onToast("Upload failed — check connection");
    } finally {
      setUploading(false);
      setPending(null);
    }
  }

  async function download(doc: DocumentMeta) {
    try {
      const res = await fetch(`/api/documents?path=${encodeURIComponent(doc.storagePath)}`);
      const json = await res.json();
      if (!res.ok || !json.url) { onToast("Could not generate download link"); return; }
      const a = document.createElement("a");
      a.href = json.url;
      a.download = doc.fileName;
      a.target = "_blank";
      a.click();
    } catch {
      onToast("Download failed");
    }
  }

  async function remove(doc: DocumentMeta) {
    try {
      await fetch(`/api/documents?path=${encodeURIComponent(doc.storagePath)}`, { method: "DELETE" });
    } catch { /* best effort — still remove from list */ }
    onChange(documents.filter((d) => d.id !== doc.id));
    onToast("Document removed");
  }

  if (!SUPABASE_ENABLED) {
    return (
      <div>
        <div className="section-hero">
          <div className="section-icon"><FileText size={24} /></div>
          <div>
            <span className="eyebrow">Your space</span>
            <h1>Documents</h1>
            <p>Secure personal file storage.</p>
          </div>
        </div>
        <section className="panel" style={{ padding: 32, textAlign: "center" }}>
          <FileText size={40} style={{ color: "var(--muted)", margin: "0 auto 16px", display: "block" }} />
          <h3 style={{ margin: "0 0 8px" }}>Storage not configured</h3>
          <p style={{ color: "var(--muted)", fontSize: 13, maxWidth: 400, margin: "0 auto" }}>
            Document storage requires Supabase to be configured. Set <code>NEXT_PUBLIC_SUPABASE_ENABLED=true</code> and the Supabase environment variables to enable this feature.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div>
      <div className="section-hero">
        <div className="section-icon"><FileText size={24} /></div>
        <div>
          <span className="eyebrow">Your space</span>
          <h1>Documents</h1>
          <p>Bank statements, policies, legal documents, and personal files — in one secure place.</p>
        </div>
        <button className="primary-btn" style={{ marginLeft: "auto" }} onClick={pickFile} disabled={uploading}>
          {uploading ? <span style={{ fontSize: 12 }}>Uploading…</span> : <><Upload size={17} /> Upload file</>}
        </button>
      </div>

      <input ref={fileRef} type="file" style={{ display: "none" }} onChange={onFileChosen}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.gif,.webp,.csv,.pptx,.odt,.ods" />

      {/* Category filter */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {categories.map((c) => (
          <button key={c} onClick={() => setFilterCat(c)} style={{
            padding: "6px 14px", borderRadius: 20, border: "1px solid var(--line)", fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: filterCat === c ? "var(--accent)" : "var(--surface)", color: filterCat === c ? "#fff" : "var(--text)",
          }}>{c}{c === "All" ? ` (${documents.length})` : ""}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <section className="panel" style={{ padding: 40, textAlign: "center" }}>
          <Upload size={36} style={{ color: "var(--muted)", margin: "0 auto 14px", display: "block" }} />
          <h3 style={{ margin: "0 0 8px", fontFamily: "Georgia, serif", fontWeight: 500 }}>No documents yet</h3>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>
            Upload bank statements, policies, ID documents, testaments, contracts, and any important files.
          </p>
          <button className="primary-btn" onClick={pickFile} disabled={uploading}>
            <Upload size={16} /> Upload your first document
          </button>
        </section>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {filtered.map((doc) => (
            <div key={doc.id} className="panel" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: fileColor(doc.mimeType) + "18", display: "grid", placeItems: "center", color: fileColor(doc.mimeType), flexShrink: 0 }}>
                  {fileIcon(doc.mimeType)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: "block", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.name}</strong>
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>{doc.fileName !== doc.name ? doc.fileName : ""}</span>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 6, background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--muted)", fontWeight: 700 }}>{doc.category}</span>
                <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 6, background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--muted)" }}>{fmtSize(doc.size)}</span>
                <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 6, background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--muted)" }}>{fmtDate(doc.uploadedAt)}</span>
              </div>

              {doc.notes && (
                <p style={{ margin: 0, fontSize: 11, color: "var(--muted)", lineHeight: 1.5, borderTop: "1px solid var(--line)", paddingTop: 8 }}>{doc.notes}</p>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                <button
                  onClick={() => download(doc)}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 9, border: "1px solid var(--line)", background: "none", color: "var(--text)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  <Download size={14} /> Download
                </button>
                <button
                  onClick={() => remove(doc)}
                  style={{ padding: "8px 12px", borderRadius: 9, border: "1px solid rgba(192,57,43,.25)", background: "rgba(192,57,43,.05)", color: "#c0392b", cursor: "pointer" }}
                  title="Delete document"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload metadata modal */}
      {showMeta && pending && (
        <UploadMetaModal
          fileName={pending.name}
          onSave={upload}
          onClose={() => { setShowMeta(false); setPending(null); }}
        />
      )}
    </div>
  );
}

function UploadMetaModal({
  fileName,
  onSave,
  onClose,
}: {
  fileName: string;
  onSave: (name: string, category: string, notes: string) => void;
  onClose: () => void;
}) {
  const [name, setName]         = useState(fileName.replace(/\.[^.]+$/, ""));
  const [category, setCategory] = useState("Other");
  const [notes, setNotes]       = useState("");

  return (
    <Modal title="File details" onClose={onClose}>
      <p style={{ margin: "0 0 16px", fontSize: 12, color: "var(--muted)" }}>
        Adding: <strong>{fileName}</strong>
      </p>
      <Field label="Display name">
        <input style={inputStyle} autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={fileName} />
      </Field>
      <Field label="Category">
        <select style={selectStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Notes (optional)">
        <textarea style={textareaStyle} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What is this document? Any reference numbers or context…" />
      </Field>
      <div className="modal-actions">
        <button className="secondary-btn" onClick={onClose}>Cancel</button>
        <button className="primary-btn" onClick={() => onSave(name.trim() || fileName, category, notes)}>
          <Upload size={15} /> Upload
        </button>
      </div>
    </Modal>
  );
}
