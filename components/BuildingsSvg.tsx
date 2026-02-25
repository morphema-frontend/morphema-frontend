export default function BuildingsSvg() {
  return (
    <svg
      width="220"
      height="160"
      viewBox="0 0 320 200"
      role="img"
      aria-label="Buildings"
    >
      <defs>
        <linearGradient id="wall-light" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ECECEC" />
          <stop offset="100%" stopColor="#D6D6D6" />
        </linearGradient>
        <linearGradient id="wall-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E2E2E2" />
          <stop offset="100%" stopColor="#CACACA" />
        </linearGradient>
        <linearGradient id="roof-dark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5A5A5A" />
          <stop offset="100%" stopColor="#3E3E3E" />
        </linearGradient>
        <linearGradient id="tower-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A4A4A" />
          <stop offset="100%" stopColor="#2F2F2F" />
        </linearGradient>
        <filter id="building-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#A0F8F8" floodOpacity="0.5" />
        </filter>
        <filter id="ground-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      <ellipse cx="160" cy="176" rx="110" ry="8" fill="rgba(0, 0, 0, 0.1)" filter="url(#ground-shadow)" />

      <g>
        <rect x="60" y="118" width="54" height="42" rx="5" fill="url(#wall-light)" />
        <polygon points="56,118 87,92 118,118" fill="url(#roof-dark)" />
        <rect x="74" y="136" width="9" height="10" rx="2" fill="#A0F8F8" filter="url(#building-glow)" />
        <rect x="88" y="136" width="9" height="10" rx="2" fill="#A0F8F8" filter="url(#building-glow)" />
      </g>

      <g>
        <rect x="128" y="106" width="86" height="54" rx="6" fill="url(#wall-mid)" />
        <polygon points="124,106 171,74 218,106" fill="url(#roof-dark)" />
        <rect x="154" y="128" width="10" height="12" rx="2" fill="#A0F8F8" filter="url(#building-glow)" />
        <rect x="172" y="128" width="10" height="12" rx="2" fill="#A0F8F8" filter="url(#building-glow)" />
        <rect x="190" y="128" width="10" height="12" rx="2" fill="#A0F8F8" filter="url(#building-glow)" />
      </g>

      <g>
        <rect x="232" y="72" width="50" height="88" rx="5" fill="url(#tower-dark)" />
        <rect x="232" y="60" width="50" height="16" rx="5" fill="#3A3A3A" />
        <rect x="248" y="94" width="10" height="12" rx="2" fill="#A0F8F8" filter="url(#building-glow)" />
        <rect x="262" y="110" width="10" height="12" rx="2" fill="#A0F8F8" filter="url(#building-glow)" />
      </g>
    </svg>
  )
}
