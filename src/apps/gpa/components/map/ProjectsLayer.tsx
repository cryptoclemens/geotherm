// @ts-nocheck
import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { useProjectStore } from '@/core/store/useProjectStore'
import { useGpaStore } from '../../store/useGpaStore'

const STATUS_COLOR = {
  Idee: '#94a3b8',
  Planung: '#3b82f6',
  Aktiv: '#16a34a',
  Archiviert: '#64748b',
}

export default function ProjectsLayer() {
  const map = useMap()
  const projects = useProjectStore((s) => s.projects)
  const markersRef = useRef([])

  useEffect(() => {
    // Alte Marker entfernen
    markersRef.current.forEach((m) => { try { map.removeLayer(m) } catch {} })
    markersRef.current = []

    const visible = projects.filter(
      (p) => p.location?.lat != null && p.location?.lng != null,
    )
    if (visible.length === 0) return

    visible.forEach((project) => {
      const color = STATUS_COLOR[project.status ?? ''] ?? '#94a3b8'
      const { lat, lng } = project.location

      const marker = L.circleMarker([lat, lng], {
        radius: 8,
        color: '#ffffff',
        weight: 2,
        fillColor: color,
        fillOpacity: 0.85,
      })

      marker.bindTooltip(
        `<div style="font-weight:700;font-size:12px;margin-bottom:2px;">${project.name}</div>
         <div style="font-size:10px;opacity:0.75;">${project.project_type ?? '—'}</div>`,
        { direction: 'top' },
      )

      marker.on('click', () => {
        useGpaStore.getState().setClickedPoint(null)
        useProjectStore.getState().selectProject(project.id)
      })

      marker.addTo(map)
      markersRef.current.push(marker)
    })
  }, [projects]) // eslint-disable-line

  // Cleanup on unmount
  useEffect(() => () => {
    markersRef.current.forEach((m) => { try { map.removeLayer(m) } catch {} })
  }, []) // eslint-disable-line

  return null
}
