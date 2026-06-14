"use client";
import { X } from "lucide-react";
import { ReactNode } from "react";

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="modal"
        style={wide ? { width: "min(700px,96vw)" } : undefined}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: "block",
          marginBottom: 6,
          color: "var(--muted)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: ".8px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 46,
  padding: "0 12px",
  border: "1px solid var(--line)",
  borderRadius: 11,
  outline: "none",
  color: "var(--text)",
  background: "var(--surface-2)",
  fontFamily: "inherit",
  fontSize: 13,
};

export const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

export const textareaStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid var(--line)",
  borderRadius: 11,
  outline: "none",
  color: "var(--text)",
  background: "var(--surface-2)",
  fontFamily: "inherit",
  fontSize: 13,
  resize: "vertical",
  minHeight: 90,
};
