"use client";
import { useState } from "react";

export default function MjwLogo({ size = 64, className = "" }: { size?: number; className?: string }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!imgFailed) {
    return (
      <img
        src="/mjw-logo.png"
        width={size}
        height={size}
        alt="MJW logo"
        className={className}
        style={{ borderRadius: "50%", objectFit: "cover", display: "block" }}
        onError={() => setImgFailed(true)}
      />
    );
  }

  // SVG fallback if image not found
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="MJW logo"
    >
      <defs>
        <radialGradient id="bg-grad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#0d0d0d" />
        </radialGradient>
        <linearGradient id="gold" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#f5d070" />
          <stop offset="35%" stopColor="#d4a017" />
          <stop offset="65%" stopColor="#c9980a" />
          <stop offset="100%" stopColor="#8a6000" />
        </linearGradient>
      </defs>
      <circle cx="150" cy="150" r="150" fill="url(#bg-grad)" />
      {/* M */}
      <path d="M22,215 L22,88 L50,88 L80,155 L110,88 L138,88 L138,215 L112,215 L112,138 L80,195 L48,138 L48,215 Z" fill="url(#gold)" />
      {/* J */}
      <path d="M148,88 L178,88 L178,200 C178,218 163,228 146,228 C129,228 114,218 114,200 L136,196 C136,207 156,207 156,200 L156,112 L148,112 Z" fill="url(#gold)" />
      {/* W */}
      <path d="M162,88 L188,88 L214,185 L240,88 L262,88 L288,185 L278,215 L240,110 L214,215 L188,215 L152,110 Z" fill="url(#gold)" />
    </svg>
  );
}
