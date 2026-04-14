// @ts-nocheck
import { useMapEvents } from 'react-leaflet'
import { useGpaStore } from '../../store/useGpaStore'
import { clearSearchMarker } from '../sidebar/Ortssuche'

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
      clearSearchMarker()   // Such-Nadel entfernen wenn User neuen Punkt wählt
      setClickedPoint({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })

  return null
}
