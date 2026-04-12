'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapIcon, ThermometerIcon, FolderOpenIcon, ArrowRightIcon } from 'lucide-react'
import { useAuth } from '@/core/auth/useAuth'
import { listProjects, type Project } from '@/core/api/projects'
import { useDeltaTStore } from '@/apps/deltat/store/useDeltaTStore'
import { Button } from '@/core/ui/button'

const APPS = [
  {
    id: 'gpa',
    name: 'Geothermie-Potenzial-Atlas',
    description: 'Interaktive Karte des norddeutschen Tieflandes — Aquifer-Überblick, Fernwärme-Städte und Industriestandorte.',
    href: '/atlas',
    Icon: MapIcon,
    color: 'oklch(0.72 0.15 195)',
    bg: 'oklch(0.62 0.14 195 / 0.15)',
  },
  {
    id: 'deltat',
    name: 'DeltaT Rechner',
    description: 'Echtzeit-Auslegung geothermischer Dubletten — Wärmepumpe, COP, Durchbruchszeit, Materialwahl.',
    href: '/deltat',
    Icon: ThermometerIcon,
    color: 'oklch(0.82 0.14 60)',
    bg: 'oklch(0.78 0.14 60 / 0.15)',
  },
  {
    id: 'projects',
    name: 'Meine Projekte',
    description: 'Gespeicherte DeltaT-Berechnungen — schnell laden, vergleichen und als CSV exportieren.',
    href: '/projects',
    Icon: FolderOpenIcon,
    color: 'oklch(0.75 0.12 280)',
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
  const router = useRouter()
  const applyFullProject = useDeltaTStore(s => s.applyFullProject)
  const [recentProjects, setRecentProjects] = useState<Project[]>([])

  useEffect(() => {
    listProjects()
      .then(projects => setRecentProjects(projects.slice(0, 3)))
      .catch(() => {})
  }, [])

  function loadProject(project: Project) {
    if (!project.deltat_input) return
    applyFullProject(project.deltat_input)
    router.push('/deltat')
  }

  const name = user?.email?.split('@')[0] ?? ''

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">

      {/* Begrüßung */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white">
          {greeting()}{name ? `, ${name}` : ''}
        </h1>
        <p className="text-white/50 mt-1.5 text-sm">
          Deine Geothermie-Suite — alle Werkzeuge auf einen Blick.
        </p>
      </div>

      {/* App-Kacheln */}
      <section aria-labelledby="apps-heading" className="mb-12">
        <h2 id="apps-heading" className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-4">
          Anwendungen
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {APPS.map(({ id, name: appName, description, href, Icon, color, bg }) => (
            <Link
              key={id}
              href={href}
              className="glass-card rounded-2xl p-5 flex flex-col gap-3 hover:bg-white/[0.07] transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon className="w-5 h-5" style={{ color }} aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-sm leading-tight mb-1.5">{appName}</h3>
                <p className="text-xs text-white/45 leading-relaxed">{description}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium" style={{ color }}>
                Öffnen
                <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Zuletzt gespeicherte Projekte */}
      {recentProjects.length > 0 && (
        <section aria-labelledby="recent-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="recent-heading" className="text-[11px] font-semibold text-white/35 uppercase tracking-widest">
              Zuletzt gespeichert
            </h2>
            <Link
              href="/projects"
              className="text-xs text-[oklch(0.72_0.15_195)] hover:text-[oklch(0.82_0.14_195)] transition-colors"
            >
              Alle anzeigen →
            </Link>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.07]">
            {recentProjects.map(project => (
              <div
                key={project.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.04] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{project.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {project.deltat_input && `${project.deltat_input.tiefe} m · ${project.deltat_input.tGW} °C`}
                    {project.deltat_result && ` · ${project.deltat_result.qDelivered.toFixed(0)} kW`}
                    {' · '}{formatDate(project.created_at)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 ml-4 text-[oklch(0.72_0.15_195)] hover:bg-[oklch(0.62_0.14_195/0.1)]"
                  onClick={() => loadProject(project)}
                >
                  In DeltaT laden
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
