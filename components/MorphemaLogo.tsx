export default function MorphemaLogo() {
  return (
    <div className="morphema-logo" aria-label="Morphema logo">
      <div className="morphema-logo-row">
        <svg
          className="morphema-logo-icon"
          width="20"
          height="18"
          viewBox="0 0 20 18"
          role="img"
          aria-hidden="true"
        >
          <rect x="0" y="0" width="20" height="6" rx="2" fill="#484848" opacity="0.85" />
          <rect x="0" y="10" width="20" height="6" rx="2" fill="#484848" opacity="0.85" />
        </svg>
        <span className="morphema-logo-word">MORPHEMA</span>
      </div>
      <span className="morphema-logo-tagline">Infrastructure for autonomous work.</span>
    </div>
  )
}
