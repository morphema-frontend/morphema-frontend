'use client'

import 'leaflet/dist/leaflet.css'

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import React, { useMemo } from 'react'
import type { Gig } from '@/lib/types'

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

function pseudoLatLng(seed: number): [number, number] {
  // No venue coordinates in backend. We generate deterministic fake points around Rome for a visual demo.
  // If you want real markers, expose venue lat/lng or a public venue read endpoint.
  const baseLat = 41.9028
  const baseLng = 12.4964
  const x = Math.sin(seed * 999) * 0.08
  const y = Math.cos(seed * 777) * 0.08
  return [baseLat + x, baseLng + y]
}

export function GigMap({ gigs }: { gigs: Gig[] }) {
  const markers = useMemo(
    () =>
      gigs.map((g) => ({
        gig: g,
        pos: pseudoLatLng(g.venueId * 1000 + g.id),
      })),
    [gigs],
  )

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Map</div>
          <div className="mt-1 text-xs text-zinc-600">Markers are fake (backend has no venue coordinates / public venue details).</div>
        </div>
        <span className="badge">{gigs.length} gigs</span>
      </div>
      <div className="mt-3 h-[380px] overflow-hidden rounded-xl border border-zinc-200">
        <MapContainer center={[41.9028, 12.4964]} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map(({ gig, pos }) => (
            <Marker key={gig.id} position={pos}>
              <Popup>
                <div className="text-sm font-semibold">{gig.title}</div>
                <div className="text-xs">venueId: {gig.venueId}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
