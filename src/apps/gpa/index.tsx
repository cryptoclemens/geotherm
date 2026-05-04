'use client'

import { useState } from 'react'
import './gpa.css'
import MapView from './components/map/MapView'
import Sidebar from './components/sidebar/Sidebar'
import Legend from './components/ui/Legend'
import InfoPanel from './components/ui/InfoPanel'
import Loader from './components/ui/Loader'
import OsmSpinner from './components/ui/OsmSpinner'
import BootLog from './components/ui/BootLog'
import StatListPanel from './components/ui/StatListPanel'
import PrintDialog from './components/ui/PrintDialog'
import WelcomeOverlay from './components/ui/WelcomeOverlay'
import GuidedTour from './components/ui/GuidedTour'
import SearchResultsPanel from './components/ui/SearchResultsPanel'
import LocationInspectorPanel from './components/ui/LocationInspectorPanel'
import SavedLocationsTab from './components/ui/SavedLocationsTab'
import ProjectsTab from './components/ui/ProjectsTab'
import ProjectDetailPanel from './components/ui/ProjectDetailPanel'
import { useGpaStore } from './store/useGpaStore'
import { useWorkspaceStore } from '@/core/store/useWorkspaceStore'
import { useProjectStore } from '@/core/store/useProjectStore'
import { FW_CITIES } from './data/fwCities'
import { getMapInstance } from './lib/mapInstance'

type StatKey = 'dc' | 'pp' | 'abw' | 'fw'
type GpaTab = 'atlas' | 'orte' | 'projekte'

interface StatTileProps {
  statKey: StatKey
  label: string
  title: string
}

function StatTile({ statKey, label, title }: StatTileProps) {
  const statCounts = useGpaStore(s => s.statCounts)
  const heatMarkers = useGpaStore(s => s.heatMarkers)
  const showStatList = useGpaStore(s => s.showStatList)
  const val = statCounts[statKey]

  function handleClick() {
    if (statKey === 'fw') {
      const bounds = getMapInstance()?.getBounds()
      const cities = bounds
        ? FW_CITIES.filter((c: { dh: number; lat: number; lng: number }) => c.dh >= 20 && bounds.contains([c.lat, c.lng]))
        : FW_CITIES.filter((c: { dh: number }) => c.dh >= 20)
      const items = cities.map((c: { n: string; lat: number; lng: number; op: string }) => ({
        name: c.n, lat: c.lat, lng: c.lng, tags: { operator: c.op },
      }))
      showStatList('fw', items)
      return
    }
    const layerMap: Record<string, string> = { dc: 'heat-dc', pp: 'heat-pp', abw: 'heat-abw' }
    const layerKey = layerMap[statKey]
    const items = layerKey ? (heatMarkers[layerKey] ?? []) : []
    showStatList(statKey, items)
  }

  return (
    <div className="stat stat-clickable" title={title} onClick={handleClick}>
      <div className="stat-v">{val !== null && val !== undefined ? val : '—'}</div>
      <div className="stat-l">im Ausschnitt<br /><small style={{ opacity: 0.7 }}>{label}</small></div>
    </div>
  )
}

export default function GpaApp() {
  const showPrintDialog = useGpaStore(s => s.showPrintDialog)
  const savedLocations = useWorkspaceStore(s => s.savedLocations)
  const projects = useProjectStore(s => s.projects)
  const [tab, setTab] = useState<GpaTab>('atlas')

  return (
    <div id="gpa-root">
      <Loader />
      <WelcomeOverlay />
      <GuidedTour />

      <header>
        <div className="hdr-left">
          <div className="hdr-title">
            <h1>Geothermie-Potenzial-Atlas</h1>
            <p>Live-Daten · Nordeuropäisches Tiefland · Fernwärme · Wärmeproduzenten</p>
          </div>
          {/* Sub-Tabs */}
          <div id="gpa-tabs">
            <button
              className={`gpa-tab${tab === 'atlas' ? ' gpa-tab--active' : ''}`}
              onClick={() => setTab('atlas')}
            >
              Atlas
            </button>
            <button
              className={`gpa-tab${tab === 'orte' ? ' gpa-tab--active' : ''}`}
              onClick={() => setTab('orte')}
            >
              Meine Orte{savedLocations.length > 0 ? ` (${savedLocations.length})` : ''}
            </button>
            <button
              className={`gpa-tab${tab === 'projekte' ? ' gpa-tab--active' : ''}`}
              onClick={() => setTab('projekte')}
            >
              Projekte{projects.length > 0 ? ` (${projects.length})` : ''}
            </button>
          </div>
        </div>
        <div className="hdr-stats">
          <span className="potentiale-label">Potentiale</span>
          <StatTile statKey="dc"  label="Rechenzentren"    title="Rechenzentren im Ausschnitt" />
          <StatTile statKey="pp"  label="Kraftwerke/Ind."  title="Kraftwerke/Industrie im Ausschnitt" />
          <StatTile statKey="abw" label="Abwärme (OSM)"    title="Industrieabwärme-Standorte im Ausschnitt" />
          <StatTile statKey="fw"  label="FW-Städte >20%"   title="Fernwärme-Städte >20% im Ausschnitt" />
          <button
            className="print-btn-hdr"
            title="Drucken / Exportieren"
            onClick={showPrintDialog}
          >🖨</button>
        </div>
      </header>

      {/* Atlas-Ansicht — MapContainer darf NICHT unmounten (Leaflet verliert Initialisierung) */}
      <div id="map-wrap" style={{ display: tab === 'atlas' ? '' : 'none' }}>
        <MapView />
        <Sidebar />
        <InfoPanel />
        <Legend />
        <SearchResultsPanel />
        <LocationInspectorPanel />
        <ProjectDetailPanel />
        <OsmSpinner />
        <BootLog />
        <div className="powered-by">
          powered by <a href="https://www.vencly.com" target="_blank" rel="noopener">Venclÿ</a>
        </div>
      </div>

      {/* Meine Orte */}
      <div id="saved-locs-view" style={{ display: tab === 'orte' ? '' : 'none' }}>
        <SavedLocationsTab />
      </div>

      {/* Projekte */}
      <div id="projects-tab-view" style={{ display: tab === 'projekte' ? '' : 'none' }}>
        <ProjectsTab />
      </div>

      <StatListPanel />
      <PrintDialog />
    </div>
  )
}
