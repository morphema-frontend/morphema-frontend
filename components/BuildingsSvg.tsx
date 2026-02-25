export default function BuildingsSvg() {
  return (
    <svg
      width="240"
      height="190"
      viewBox="0 0 320 200"
      role="img"
      aria-label="Buildings"
    >
      <defs>
        <filter id="building-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#A0F8F8" floodOpacity="0.6" />
        </filter>
        <filter id="ground-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <ellipse cx="160" cy="186" rx="118" ry="8" fill="rgba(0, 0, 0, 0.08)" filter="url(#ground-shadow)" />

      <rect x="30" y="112" width="70" height="60" rx="4" fill="#E2E2E2" />
      <polygon points="25,112 65,86 105,112" fill="#4A4A4A" />

      <rect x="115" y="90" width="110" height="82" rx="5" fill="#DADADA" />
      <polygon points="110,90 170,52 230,90" fill="#4A4A4A" />

      <rect x="242" y="52" width="52" height="120" rx="4" fill="#E2E2E2" />
      <rect x="242" y="44" width="52" height="16" rx="4" fill="#555555" />

      <rect x="50" y="130" width="10" height="12" rx="2" fill="#A0F8F8" filter="url(#building-glow)" />
      <rect x="72" y="130" width="10" height="12" rx="2" fill="#A0F8F8" filter="url(#building-glow)" />
      <rect x="150" y="120" width="12" height="14" rx="2" fill="#A0F8F8" filter="url(#building-glow)" />
      <rect x="176" y="120" width="12" height="14" rx="2" fill="#A0F8F8" filter="url(#building-glow)" />
      <rect x="258" y="90" width="10" height="14" rx="2" fill="#A0F8F8" filter="url(#building-glow)" />
    </svg>
  )
}
