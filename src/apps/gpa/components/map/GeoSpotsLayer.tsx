// @ts-nocheck
import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { useWorkspaceStore } from '@/core/store/useWorkspaceStore'

const POTENTIAL_COLOR = {
  'sehr hoch': '#16a34a',
  'hoch':      '#d97706',
  'mittel':    '#64748b',
}

export default function GeoSpotsLayer() {
  const map = useMap()
  const geoSpots  = useWorkspaceStore(s => s.geoSpots)
  const markersRef = useRef([])

  useEffect(() => {
    // Alte Marker entfernen
    markersRef.current.forEach(m => { try { map.removeLayer(m) } catch {} })
    markersRef.current = []

    if (!geoSpots || geoSpots.length === 0) return

    geoSpots.forEach((spot, i) => {
      const color = POTENTIAL_COLOR[spot.potential] ?? '#64748b'

      const marker = L.circleMarker([spot.lat, spot.lng], {
        radius:      14,
        color:       '#ffffff',
        weight:      2.5,
        fillColor:   color,
        fillOpacity: 0.85,
      })

      // Nummer als permanentes Label
      const numIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:22px; height:22px;
          border-radius:50%;
          background:${color};
          border:2.5px solid #fff;
          display:flex; align-items:center; justify-content:center;
          font-size:11px; font-weight:700; color:#fff;
          box-shadow:0 1px 4px rgba(0,0,0,.35);
          line-height:1;
        ">${i + 1}</div>`,
        iconSize:   [22, 22],
        iconAnchor: [11, 11],
      })

      const iconMarker = L.marker([spot.lat, spot.lng], { icon: numIcon, zIndexOffset: 1000 })
      iconMarker.bindTooltip(`
        <div style="font-weight:700;font-size:13px;margin-bottom:2px;">${spot.name}</div>
        <div style="font-size:11px;color:${color};font-weight:600;">${spot.potential}</div>
        <div style="font-size:11px;opacity:0.75;margin-top:1px;">${spot.aquifer} · ${spot.depth}</div>
        <div style="font-size:9px;opacity:0.5;margin-top:3px;">Klick in der Seitenleiste für Details</div>
      `, { direction: 'top' })

      marker.addTo(map)
      iconMarker.addTo(map)
      markersRef.current.push(marker, iconMarker)
    })

    // Karte auf alle Spots zoomen
    const latlngs = geoSpots.map(s => [s.lat, s.lng])
    try {
      map.fitBounds(latlngs, { padding: [60, 60], maxZoom: 10 })
    } catch {}
  }, [geoSpots]) // eslint-disable-line

  // Cleanup on unmount
  useEffect(() => () => {
    markersRef.current.forEach(m => { try { map.removeLayer(m) } catch {} })
  }, []) // eslint-disable-line

  return null
}
