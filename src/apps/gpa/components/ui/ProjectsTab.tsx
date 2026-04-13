// @ts-nocheck
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/core/store/useProjectStore'
import { useWorkspaceStore } from '@/core/store/useWorkspaceStore'
import { useDeltaTStore } from '@/apps/deltat/store/useDeltaTStore'
import { getMapInstance } from '../../lib/mapInstance'

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

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(iso))
}

export default function ProjectsTab() {
  const router = useRouter()
  const projects = useProjectStore((s) => s.projects)
  const loading = useProjectStore((s) => s.loading)
  const fetchProjects = useProjectStore((s) => s.fetchProjects)
  const deleteProject = useProjectStore((s) => s.deleteProject)
  const selectProject = useProjectStore((s) => s.selectProject)
  const setLocationPreset = useWorkspaceStore((s) => s.setLocationPreset)
  const applyFullProject = useDeltaTStore((s) => s.applyFullProject)

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  function handleFly(project) {
    if (!project.location) return
    const map = getMapInstance()
    if (map) map.flyTo([project.location.lat, project.location.lng], 12, { duration: 1.5, animate: true })
  }

  function handleDeltaT(project) {
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

  if (loading) {
    return (
      <div id="projects-tab-empty">
        <div style={{ opacity: 0.6 }}>Lade Projekte…</div>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div id="projects-tab-empty">
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
        <div>Noch keine Projekte vorhanden.</div>
        <div style={{ marginTop: '0.5rem', opacity: 0.6, fontSize: '0.8rem' }}>
          Erstelle Projekte unter{' '}
          <a
            href="/projects"
            style={{ color: 'var(--accent)', textDecoration: 'underline' }}
          >
            Meine Projekte
          </a>{' '}
          oder speichere aus dem DeltaT-Rechner.
        </div>
      </div>
    )
  }

  return (
    <div id="projects-tab-list">
      {projects.map((project) => {
        const typeColor = TYPE_COLOR[project.project_type ?? ''] ?? '#94a3b8'
        const statusColor = STATUS_COLOR[project.status ?? ''] ?? '#94a3b8'
        return (
          <div key={project.id} className="project-card">
            <div
              className="project-card-header"
              onClick={() => {
                selectProject(project.id)
                handleFly(project)
              }}
            >
              <div className="project-card-meta">
                <div className="project-card-name">📁 {project.name}</div>
                <div className="project-card-sub">
                  {project.location?.name ?? '—'} · {formatDate(project.created_at)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                {project.project_type && (
                  <span
                    className="project-card-badge"
                    style={{ color: typeColor, borderColor: typeColor }}
                  >
                    {project.project_type}
                  </span>
                )}
                {project.status && (
                  <span
                    className="project-card-badge"
                    style={{ color: statusColor, borderColor: statusColor }}
                  >
                    {project.status}
                  </span>
                )}
              </div>
            </div>

            {(project.deltat_input?.tiefe || project.deltat_input?.tGW) && (
              <div className="project-card-params">
                {project.deltat_input?.tiefe && <span>{project.deltat_input.tiefe} m</span>}
                {project.deltat_input?.tGW && <span>{project.deltat_input.tGW} °C</span>}
                {project.deltat_result?.qDelivered != null && (
                  <span>{project.deltat_result.qDelivered.toFixed(0)} kW</span>
                )}
              </div>
            )}

            <div className="project-card-actions">
              {project.location && (
                <button
                  className="project-card-btn project-card-map"
                  onClick={() => handleFly(project)}
                >
                  Karte
                </button>
              )}
              <button
                className="project-card-btn project-card-deltat"
                onClick={() => handleDeltaT(project)}
              >
                ⟶ DeltaT
              </button>
              <button
                className="project-card-btn project-card-del"
                onClick={() => deleteProject(project.id)}
                title="Projekt löschen"
              >×</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
