export default function MrMorpSvg() {
  return (
    <svg
      width="170"
      height="170"
      viewBox="0 0 200 200"
      role="img"
      aria-label="Mr. Morp"
    >
      <defs>
        <linearGradient id="morp-head" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3A3A3A" />
          <stop offset="100%" stopColor="#262626" />
        </linearGradient>
        <linearGradient id="morp-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#373737" />
          <stop offset="100%" stopColor="#252525" />
        </linearGradient>
        <linearGradient id="morp-highlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="70%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id="morp-eye-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#A0F8F8" floodOpacity="0.5" />
        </filter>
        <filter id="morp-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <ellipse cx="100" cy="176" rx="42" ry="6" fill="rgba(0, 0, 0, 0.12)" filter="url(#morp-shadow)" />

      <g>
        <rect x="60" y="42" width="80" height="56" rx="14" fill="url(#morp-head)" />
        <rect x="62" y="44" width="76" height="24" rx="12" fill="url(#morp-highlight)" />

        <rect x="86" y="66" width="10" height="10" rx="2" fill="#A0F8F8" filter="url(#morp-eye-glow)" />
        <rect x="104" y="66" width="10" height="10" rx="2" fill="#A0F8F8" filter="url(#morp-eye-glow)" />
      </g>

      <g>
        <rect x="72" y="104" width="56" height="52" rx="14" fill="url(#morp-body)" />
        <rect x="74" y="106" width="52" height="18" rx="9" fill="url(#morp-highlight)" opacity="0.7" />
      </g>

      <rect x="58" y="118" width="10" height="18" rx="5" fill="#2B2B2B" />
      <rect x="132" y="118" width="10" height="18" rx="5" fill="#2B2B2B" />

      <rect x="82" y="152" width="12" height="22" rx="6" fill="#2B2B2B" />
      <rect x="106" y="152" width="12" height="22" rx="6" fill="#2B2B2B" />
    </svg>
  )
}
