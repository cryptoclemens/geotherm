/**
 * mapInstance — Zentraler Zugriff auf die Leaflet-Karteninstanz
 *
 * Ersetzt window._map: Kein globaler Window-Zustand, vollständig typsicher.
 * Wird von MapView.MapRef gesetzt, von Ortssuche / StatListPanel / PrintDialog / index gelesen.
 */
import type L from 'leaflet'

let _instance: L.Map | null = null

export function setMapInstance(map: L.Map): void {
  _instance = map
}

export function getMapInstance(): L.Map | null {
  return _instance
}
