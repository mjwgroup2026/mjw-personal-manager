export default function MjwLogo({ size = 64, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
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
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5d070" />
          <stop offset="40%" stopColor="#c9980a" />
          <stop offset="70%" stopColor="#e8be50" />
          <stop offset="100%" stopColor="#9a6f0a" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="100" fill="url(#bg-grad)" />
      {/* M */}
      <path
        d="M28 130 L28 72 L50 72 L64 100 L78 72 L100 72 L100 130 L84 130 L84 98 L70 122 L58 122 L44 98 L44 130 Z"
        fill="url(#gold)"
      />
      {/* J */}
      <path
        d="M104 72 L120 72 L120 116 C120 124 115 132 104 132 C93 132 88 125 88 116 L104 116 C104 119 105 120 106 120 C108 120 108 118 108 116 L108 88 L104 88 Z"
        fill="url(#gold)"
      />
      {/* W */}
      <path
        d="M122 72 L136 72 L144 108 L152 72 L166 72 L174 108 L182 72 L196 72 L182 130 L166 130 L158 96 L150 130 L136 130 Z"
        fill="url(#gold)"
      />
    </svg>
  );
}
