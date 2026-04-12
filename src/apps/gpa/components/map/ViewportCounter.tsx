import { useEffect } from 'react'
import { useMapEvents } from 'react-leaflet'
import type L from 'leaflet'
import { useGpaStore } from '../../store/useGpaStore'
import { FW_CITIES } from '../../data/fwCities'

export default function ViewportCounter() {
  const { heatMarkers, setStatCount } = useGpaStore()

  function countInBounds(map: L.Map): void {
    const bounds = map.getBounds()
    const counts: Record<string, number | null> = {}
    Object.entries(heatMarkers).forEach(([key, markers]) => {
      counts[key] = markers.filter(m => bounds.contains([m.lat, m.lng])).length
    })
    setStatCount('dc',  counts['heat-dc']  ?? null)
    setStatCount('pp',  counts['heat-pp']  ?? null)
    setStatCount('abw', counts['heat-abw'] ?? null)
    setStatCount('fw',  FW_CITIES.filter(c => c.dh >= 20 && bounds.contains([c.lat, c.lng])).length)
  }

  const map = useMapEvents({
    moveend: () => countInBounds(map),
    zoomend: () => countInBounds(map),
  })

  // Initial count when heatMarkers update
  useEffect(() => {
    if (map) countInBounds(map)
  }, [heatMarkers]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
