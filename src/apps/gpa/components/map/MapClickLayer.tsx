// @ts-nocheck
import { useMapEvents } from 'react-leaflet'
import { useGpaStore } from '../../store/useGpaStore'

/**
 * Unsichtbare Karte-Klick-Komponente.
 * Registriert Klicks auf der Karte und speichert den Punkt im GPA-Store.
 * Die LocationInspectorPanel-Komponente wertet den Punkt aus.
 */
export default function MapClickLayer() {
  const setClickedPoint = useGpaStore(s => s.setClickedPoint)

  useMapEvents({
    click(e) {
      // Klicks auf Marker (CircleMarker/DivIcon) propagieren nicht — nur echte Karten-Klicks
      setClickedPoint({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })

  return null
}
