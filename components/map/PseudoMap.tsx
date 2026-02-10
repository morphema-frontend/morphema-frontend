'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import React, { useMemo } from 'react'
import type { Gig } from '@/lib/types'

// Fix default marker icon paths for Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

function jitter(n: number) {
  // deterministic-ish jitter from integer
  const x = Math.sin(n * 999) * 10000
  return x - Math.floor(x)
}

export function PseudoMap({ gigs }: { gigs: Gig[] }) {
  // Backend doesn't expose venue coordinates. This map places markers around Rome deterministically.
  const markers = useMemo(() => {
    const center: [number, number] = [41.9028, 12.4964]
    return gigs.map((g) => {
      const lat = center[0] + (jitter(g.id) - 0.5) * 0.06
      const lng = center[1] + (jitter(g.id + 42) - 0.5) * 0.08
      return { g, pos: [lat, lng] as [number, number] }
    })
  }, [gigs])

  return (
    <div className="h-[360px] w-full overflow-hidden rounded-xl border border-zinc-200">
      <MapContainer center={[41.9028, 12.4964]} zoom={12} style={{ height: '360px', width: '100%' }}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {markers.map(({ g, pos }) => (
          <Marker key={g.id} position={pos}>
            <Popup>
              <div className="text-sm font-semibold">{g.title}</div>
              <div className="text-xs">venueId: {g.venueId}</div>
              <div className="text-xs">jobTypeId: {g.jobTypeId ?? '—'}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
