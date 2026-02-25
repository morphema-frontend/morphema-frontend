export default function MrMorpSvg() {
  return (
    <svg
      width="200"
      height="220"
      viewBox="0 0 200 220"
      role="img"
      aria-label="Mr. Morp"
    >
      <defs>
        <linearGradient id="morp-head" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#303030" />
          <stop offset="100%" stopColor="#2B2B2B" />
        </linearGradient>
        <linearGradient id="morp-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#303030" />
          <stop offset="100%" stopColor="#2B2B2B" />
        </linearGradient>
        <filter id="morp-eye-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#A0F8F8" floodOpacity="0.7" />
        </filter>
      </defs>

      <rect x="50" y="18" width="100" height="70" rx="14" fill="url(#morp-head)" />

      <path d="M60 92 L140 92 L128 178 Q100 188 72 178 Z" fill="url(#morp-body)" />

      <rect x="30" y="110" width="26" height="18" rx="7" fill="#2B2B2B" />
      <rect x="144" y="110" width="26" height="18" rx="7" fill="#2B2B2B" />

      <rect x="76" y="178" width="20" height="26" rx="7" fill="#2B2B2B" />
      <rect x="104" y="178" width="20" height="26" rx="7" fill="#2B2B2B" />

      <rect x="82" y="44" width="12" height="12" rx="3" fill="#A0F8F8" filter="url(#morp-eye-glow)" />
      <rect x="106" y="44" width="12" height="12" rx="3" fill="#A0F8F8" filter="url(#morp-eye-glow)" />
    </svg>
  )
}
