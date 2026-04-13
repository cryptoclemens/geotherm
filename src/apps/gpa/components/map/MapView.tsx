// @ts-nocheck
import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import BaseLayers from './BaseLayers'
import AquiferLayers from './AquiferLayers'
import WMSLayers from './WMSLayers'
import HeatSourceLayers from './HeatSourceLayers'
import FWCitiesLayer from './FWCitiesLayer'
import KwpLayers from './KwpLayers'
import ViewportCounter from './ViewportCounter'
import { setMapInstance } from '../../lib/mapInstance'

function MapRef() {
  const map = useMap()
  useEffect(() => { setMapInstance(map) }, [map])
  return null
}

export default function MapView() {
  return (
    <MapContainer
      center={[51.15, 6.6]}
      zoom={8}
      minZoom={5}
      maxZoom={14}
      zoomControl={false}
      style={{ width: '100%', height: '100%' }}
      aria-label="Interaktive Geothermie-Potenzial-Karte des norddeutschen Tieflandes. Zoomen mit +/- oder Mausrad, Verschieben mit Drag, Klick auf Marker für Details."
      role="region"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
        maxZoom={19}
      />
      <MapRef />
      <BaseLayers />
      <AquiferLayers />
      <WMSLayers />
      <HeatSourceLayers />
      <FWCitiesLayer />
      <KwpLayers />
      <ViewportCounter />
    </MapContainer>
  )
}
