// @ts-nocheck
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/core/store/useProjectStore'
import { useWorkspaceStore } from '@/core/store/useWorkspaceStore'
import { useDeltaTStore } from '@/apps/deltat/store/useDeltaTStore'

const STATUS_COLOR = {
  Idee: '#94a3b8',
  Planung: '#3b82f6',
  Aktiv: '#16a34a',
  Archiviert: '#64748b',
}

const TYPE_COLOR = {
  Dublette: '#5bafd6',
  Einzelbohrung: '#a8d4e6',
  Explorationsbohrung: '#e8a857',
  EGS: '#a87cd6',
}

function fmt(n: number, d = 0) {
  return n.toLocaleString('de-DE', { maximumFractionDigits: d })
}

export default function ProjectDetailPanel() {
  const router = useRouter()
  const selectedProjectId = useProjectStore((s) => s.selectedProjectId)
  const projects = useProjectStore((s) => s.projects)
  const selectProject = useProjectStore((s) => s.selectProject)
  const setLocationPreset = useWorkspaceStore((s) => s.setLocationPreset)
  const applyFullProject = useDeltaTStore((s) => s.applyFullProject)

  const project = projects.find((p) => p.id === selectedProjectId)
  if (!project) return null

  function handleLoadInDeltaT() {
    if (project.location) {
      setLocationPreset({
        name: project.location.name,
        lat: project.location.lat,
        lng: project.location.lng,
        aquifer: project.geological_data
          ? {
              tiefe: project.geological_data.tiefe_m,
              maechtig: project.geological_data.maechtig_m,
              kf: project.geological_data.kf_ms,
              tGW: project.geological_data.tGW_celsius,
              tds: project.geological_data.tds_mgl,
            }
          : undefined,
      })
    }
    if (project.deltat_input) {
      applyFullProject(project.deltat_input)
    }
    router.push('/deltat')
  }

  const geo = project.geological_data

  return (
    <div id="project-detail-panel">
      {/* Header */}
      <div id="project-detail-hdr">
        <div id="project-detail-name">📁 {project.name}</div>
        <button
          id="project-detail-close"
          onClick={() => selectProject(null)}
          title="Schließen"
        >×</button>
      </div>

      {/* Badges */}
      <div id="project-detail-badges">
        {project.project_type && (
          <span
            className="project-detail-badge"
            style={{
              color: TYPE_COLOR[project.project_type] ?? '#94a3b8',
              borderColor: TYPE_COLOR[project.project_type] ?? '#94a3b8',
            }}
          >
            {project.project_type}
          </span>
        )}
        {project.status && (
          <span
            className="project-detail-badge"
            style={{
              color: STATUS_COLOR[project.status] ?? '#64748b',
              borderColor: STATUS_COLOR[project.status] ?? '#64748b',
            }}
          >
            {project.status}
          </span>
        )}
      </div>

      {/* Ort */}
      {project.location && (
        <div id="project-detail-location">
          📍 {project.location.name}
          {project.location.lat != null && (
            <span style={{ opacity: 0.6, fontSize: '9px', marginLeft: '6px' }}>
              {project.location.lat.toFixed(4)}°N · {project.location.lng.toFixed(4)}°E
            </span>
          )}
        </div>
      )}

      {/* Geologische Daten */}
      {geo && (
        <div id="project-detail-geo">
          {geo.aquiferType && <div className="project-detail-aquifer">{geo.aquiferType}</div>}
          <div id="project-detail-grid">
            {geo.tiefe_m != null && (
              <div className="proj-param">
                <span className="proj-param-label">Tiefe</span>
                <span className="proj-param-value">{fmt(geo.tiefe_m)} m</span>
              </div>
            )}
            {geo.tGW_celsius != null && (
              <div className="proj-param">
                <span className="proj-param-label">T Grundwasser</span>
                <span className="proj-param-value">{geo.tGW_celsius.toFixed(1)} °C</span>
              </div>
            )}
            {geo.maechtig_m != null && (
              <div className="proj-param">
                <span className="proj-param-label">Mächtigkeit</span>
                <span className="proj-param-value">{fmt(geo.maechtig_m)} m</span>
              </div>
            )}
            {geo.tds_mgl != null && (
              <div className="proj-param">
                <span className="proj-param-label">TDS</span>
                <span className="proj-param-value">{fmt(geo.tds_mgl)} mg/l</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DeltaT-Parameter */}
      {project.deltat_input && (
        <div id="project-detail-deltat">
          <div className="project-detail-section-title">DeltaT-Parameter</div>
          <div id="project-detail-grid">
            <div className="proj-param">
              <span className="proj-param-label">Tiefe</span>
              <span className="proj-param-value">{project.deltat_input.tiefe} m</span>
            </div>
            <div className="proj-param">
              <span className="proj-param-label">T GW</span>
              <span className="proj-param-value">{project.deltat_input.tGW} °C</span>
            </div>
            <div className="proj-param">
              <span className="proj-param-label">Förderrate</span>
              <span className="proj-param-value">{project.deltat_input.Q} l/s</span>
            </div>
            {project.deltat_result && (
              <div className="proj-param">
                <span className="proj-param-label">Leistung</span>
                <span className="proj-param-value">{project.deltat_result.qDelivered.toFixed(0)} kW</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notizen */}
      {project.notes && (
        <div id="project-detail-notes">{project.notes}</div>
      )}

      {/* Aktionen */}
      <div id="project-detail-actions">
        <button
          className="proj-action-btn proj-action-deltat"
          onClick={handleLoadInDeltaT}
        >
          ⟶ In DeltaT laden
        </button>
        <button
          className="proj-action-btn proj-action-close"
          onClick={() => selectProject(null)}
        >
          Schließen
        </button>
      </div>
    </div>
  )
}
