// @ts-nocheck
import { useEffect } from 'react'
import { useMapEvents } from 'react-leaflet'
import { useGpaStore } from '../../store/useGpaStore'
import { FW_CITIES } from '../../data/fwCities'

export default function ViewportCounter() {
  const { heatMarkers, setStatCount } = useGpaStore()

  function countInBounds(map) {
    const bounds = map.getBounds()
    // Count each heat source type in bounds
    const counts = {}
    Object.entries(heatMarkers).forEach(([key, markers]) => {
      counts[key] = markers.filter(m => bounds.contains([m.lat, m.lng])).length
    })
    // Map layer keys → stat keys (OSM sources — null if layer not yet loaded)
    const dc  = counts['heat-dc']  != null ? counts['heat-dc']  : null
    const pp  = counts['heat-pp']  != null ? counts['heat-pp']  : null
    const abw = counts['heat-abw'] != null ? counts['heat-abw'] : null
    // FW cities: always countable from static data — show all dh>20 cities in bounds
    const fw  = FW_CITIES.filter(c => c.dh >= 20 && bounds.contains([c.lat, c.lng])).length
    setStatCount('dc',  dc)
    setStatCount('pp',  pp)
    setStatCount('abw', abw)
    setStatCount('fw',  fw)
  }

  const map = useMapEvents({
    moveend: () => countInBounds(map),
    zoomend: () => countInBounds(map),
  })

  // Initial count when heatMarkers update
  useEffect(() => {
    if (map) countInBounds(map)
  }, [heatMarkers]) // eslint-disable-line

  return null
}
