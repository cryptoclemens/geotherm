'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapIcon, ThermometerIcon, FolderOpenIcon, ArrowRightIcon } from 'lucide-react'
import { useAuth } from '@/core/auth/useAuth'
import { listProjects, type Project } from '@/core/api/projects'
import { useDeltaTStore } from '@/apps/deltat/store/useDeltaTStore'
import { Button } from '@/core/ui/button'
import { AiDialog } from '@/apps/dashboard/components/AiDialog'

const APPS = [
  {
    id: 'gpa',
    name: 'GPA Atlas',
    description: 'Interaktive Karte des norddeutschen Tieflandes',
    href: '/atlas',
    Icon: MapIcon,
    color: 'oklch(0.72 0.15 195)',
    bg: 'oklch(0.62 0.14 195 / 0.15)',
  },
  {
    id: 'deltat',
    name: 'DeltaT',
    description: 'Echtzeit-Auslegung geothermischer Dubletten',
    href: '/deltat',
    Icon: ThermometerIcon,
    color: 'oklch(0.82 0.14 60)',
    bg: 'oklch(0.78 0.14 60 / 0.15)',
  },
  {
    id: 'projects',
    name: 'Projekte',
    description: 'Gespeicherte DeltaT-Berechnungen',
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
    <div className="container mx-auto px-4 py-8 max-w-3xl">

      {/* Begrüßung */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          {greeting()}{name ? `, ${name}` : ''}
        </h1>
        <p className="text-white/40 mt-1 text-sm">
          Beschreibe dein Projekt — ich öffne den passenden Rechner für dich.
        </p>
      </div>

      {/* KI-Dialog — Herzstück des Dashboards */}
      <div className="mb-6">
        <AiDialog />
      </div>

      {/* App-Schnellzugriff */}
      <section aria-labelledby="apps-heading" className="mb-8">
        <h2 id="apps-heading" className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">
          Direktzugriff
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {APPS.map(({ id, name: appName, description, href, Icon, color, bg }) => (
            <Link
              key={id}
              href={href}
              className="glass-card rounded-xl p-4 flex flex-col gap-2 hover:bg-white/[0.07] transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                <Icon className="w-4 h-4" style={{ color }} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{appName}</p>
                <p className="text-[11px] text-white/40 leading-tight mt-0.5">{description}</p>
              </div>
              <ArrowRightIcon
                className="w-3.5 h-3.5 mt-auto group-hover:translate-x-0.5 transition-transform"
                style={{ color }}
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Zuletzt gespeicherte Projekte */}
      {recentProjects.length > 0 && (
        <section aria-labelledby="recent-heading">
          <div className="flex items-center justify-between mb-3">
            <h2 id="recent-heading" className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">
              Zuletzt gespeichert
            </h2>
            <Link
              href="/projects"
              className="text-xs text-[oklch(0.72_0.15_195)] hover:text-[oklch(0.82_0.14_195)] transition-colors"
            >
              Alle →
            </Link>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
            {recentProjects.map(project => (
              <div
                key={project.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{project.name}</p>
                  <p className="text-xs text-white/35 mt-0.5">
                    {project.deltat_input && `${project.deltat_input.tiefe} m · ${project.deltat_input.tGW} °C`}
                    {project.deltat_result && ` · ${project.deltat_result.qDelivered.toFixed(0)} kW`}
                    {' · '}{formatDate(project.created_at)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 ml-4 text-xs text-[oklch(0.72_0.15_195)] hover:bg-[oklch(0.62_0.14_195/0.1)]"
                  onClick={() => loadProject(project)}
                >
                  In DeltaT laden
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
