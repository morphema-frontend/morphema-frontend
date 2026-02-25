import React from 'react'

export default function LandingSplit({
  left,
  right,
}: {
  left: React.ReactNode
  right: React.ReactNode
}) {
  return (
    <section className="landing-split">
      <div className="landing-divider" aria-hidden="true" />
      <div className="landing-notch" aria-hidden="true" />
      <div className="landing-column">{left}</div>
      <div className="landing-column">{right}</div>
    </section>
  )
}
