'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapIcon, ThermometerIcon, FolderOpenIcon, ArrowRightIcon, HardHatIcon } from 'lucide-react'
import { useAuth } from '@/core/auth/useAuth'
import { useDeltaTStore } from '@/apps/deltat/store/useDeltaTStore'
import { useBohrkostStore } from '@/apps/bohrkost/store/useBohrkostStore'
import { useProjectStore } from '@/core/store/useProjectStore'
import { AiDialog } from '@/apps/dashboard/components/AiDialog'
import { ProjectDetailDialog } from '../projects/ProjectDetailDialog'
import type { Project, ProjectUpdate } from '@/core/api/projects'
import type { BohrkostInputs, Bohrungszweck } from '@/apps/bohrkost/calc/kosten'

const APPS = [
  {
    id: 'gpa',
    name: 'Geothermie-Potenzial-Atlas',
    description: 'Interaktive Karte des norddeutschen Tieflandes — Aquifer-Überblick, Fernwärme-Städte und Industriestandorte.',
    href: '/atlas',
    Icon: MapIcon,
    color: 'oklch(0.62 0.14 195)',
    bg: 'oklch(0.62 0.14 195 / 0.15)',
  },
  {
    id: 'deltat',
    name: 'DeltaT Rechner',
    description: 'Echtzeit-Auslegung geothermischer Dubletten — Wärmepumpe, COP, Durchbruchszeit, Materialwahl.',
    href: '/deltat',
    Icon: ThermometerIcon,
    color: 'oklch(0.68 0.14 60)',
    bg: 'oklch(0.78 0.14 60 / 0.15)',
  },
  {
    id: 'bohrkost',
    name: 'Bohrkostenrechner',
    description: 'Investitionsschätzung für Geothermie-Bohrungen — Lukawski-Formel, MAP/KfW-Förderung, Bandbreite Min/Mid/Max.',
    href: '/bohrkost',
    Icon: HardHatIcon,
    color: 'oklch(0.58 0.15 40)',
    bg: 'oklch(0.80 0.12 40 / 0.15)',
  },
  {
    id: 'projects',
    name: 'Meine Projekte',
    description: 'Gespeicherte DeltaT-Berechnungen — schnell laden, vergleichen und als CSV exportieren.',
    href: '/projects',
    Icon: FolderOpenIcon,
    color: 'oklch(0.55 0.12 280)',
    bg: 'oklch(0.72 0.12 280 / 0.15)',
  },
] as const

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso))
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Guten Morgen'
  if (h < 18) return 'Guten Tag'
  return 'Guten Abend'
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router   = useRouter()

  const applyFullProject         = useDeltaTStore(s => s.applyFullProject)
  const applyBohrkostFromProject = useBohrkostStore(s => s.applyFromProject)
  const selectProject            = useProjectStore(s => s.selectProject)

  const projects      = useProjectStore(s => s.projects)
  const fetchProjects = useProjectStore(s => s.fetchProjects)
  const storeUpdate   = useProjectStore(s => s.updateProject)
  const storeDelete   = useProjectStore(s => s.deleteProject)

  const recentProjects = projects.slice(0, 3)

  // Detail popup state
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen]           = useState(false)
  const [deletingId, setDeletingId]           = useState<string | null>(null)

  const detailProject = detailProjectId
    ? (projects.find(p => p.id === detailProjectId) ?? null)
    : null

  const stableFetchProjects = useCallback(fetchProjects, [fetchProjects])

  useEffect(() => {
    if (user) stableFetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  function openDetail(project: Project) {
    setDetailProjectId(project.id)
    setDetailOpen(true)
  }

  async function handleUpdate(id: string, updates: ProjectUpdate) {
    await storeUpdate(id, updates)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await storeDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  function handleLoad(project: Project) {
    if (!project.deltat_input) return
    applyFullProject(project.deltat_input)
    selectProject(project.id)
    router.push('/deltat')
  }

  function handleLoadBohrkost(project: Project) {
    const zweck: Bohrungszweck =
      project.project_type === 'Dublette'              ? 'Dublette'
      : project.project_type === 'Einzelbohrung'       ? 'Einzelbohrung'
      : project.project_type === 'Explorationsbohrung' ? 'Explorationsbohrung'
      : 'Dublette'
    const partial: Partial<BohrkostInputs> = project.bohrkost_input
      ? project.bohrkost_input
      : {
          tiefe:        project.deltat_input?.tiefe ?? 700,
          tGW:          project.deltat_input?.tGW   ?? 35,
          foerderrate:  project.deltat_input?.Q      ?? 15,
          tReinjektion: project.deltat_input?.tR     ?? 15,
          zweck,
        }
    applyBohrkostFromProject(partial, project.id, project.name)
    router.push('/bohrkost')
  }

  const name = user?.email?.split('@')[0] ?? ''

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">

      {/* Begrüßung */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          {greeting()}{name ? `, ${name}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Beschreibe dein Projekt — ich öffne den passenden Rechner für dich.
        </p>
      </div>

      {/* KI-Dialog — Herzstück des Dashboards */}
      <div className="mb-8">
        <AiDialog />
      </div>

      {/* App-Kacheln */}
      <section aria-labelledby="apps-heading" className="mb-12">
        <h2 id="apps-heading" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Anwendungen
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {APPS.map(({ id, name: appName, description, href, Icon, color, bg }) => (
            <Link
              key={id}
              href={href}
              className="glass-card rounded-2xl p-5 flex flex-col gap-3 hover:bg-muted/40 dark:hover:bg-white/[0.07] transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon className="w-5 h-5" style={{ color }} aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-sm leading-tight mb-1.5">{appName}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium" style={{ color }}>
                Öffnen
                <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Zuletzt gespeicherte Projekte */}
      {recentProjects.length > 0 && (
        <section aria-labelledby="recent-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="recent-heading" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              Zuletzt gespeichert
            </h2>
            <Link
              href="/projects"
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Alle anzeigen →
            </Link>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border">
            {recentProjects.map(project => (
              <button
                key={project.id}
                type="button"
                onClick={() => openDetail(project)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 dark:hover:bg-white/[0.04] transition-colors text-left"
                aria-label={`Projekt ${project.name} öffnen`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {project.deltat_input && `${project.deltat_input.tiefe} m · ${project.deltat_input.tGW} °C`}
                    {project.deltat_result && ` · ${project.deltat_result.qDelivered.toFixed(0)} kW`}
                    {' · '}{formatDate(project.created_at)}
                  </p>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-muted-foreground/40 shrink-0 ml-4" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Detail-Popup */}
      {detailProject && (
        <ProjectDetailDialog
          project={detailProject}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onLoad={handleLoad}
          onLoadBohrkost={handleLoadBohrkost}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          deleting={deletingId === detailProject.id}
        />
      )}
    </div>
  )
}
