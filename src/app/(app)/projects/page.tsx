'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FolderOpenIcon, PlusIcon, SaveIcon, DownloadIcon } from 'lucide-react'
import { exportProjectsToCsv } from '@/core/lib/exportCsv'
import { useAuth } from '@/core/auth/useAuth'
import {
  createProject,
  type Project,
  type ProjectUpdate,
  type ProjectType,
  type ProjectStatus,
} from '@/core/api/projects'
import { useDeltaTStore } from '@/apps/deltat/store/useDeltaTStore'
import { useBohrkostStore } from '@/apps/bohrkost/store/useBohrkostStore'
import { useProjectStore } from '@/core/store/useProjectStore'
import type { BohrkostInputs, Bohrungszweck } from '@/apps/bohrkost/calc/kosten'
import { ProjectFormDialog } from './ProjectFormDialog'
import { ProjectDetailDialog } from './ProjectDetailDialog'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/core/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/core/ui/dialog'
import { Button } from '@/core/ui/button'
import { Input } from '@/core/ui/input'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return '–'
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

const STATUS_COLOR: Record<ProjectStatus, string> = {
  Idee:       '#94a3b8',
  Planung:    '#3b82f6',
  Aktiv:      '#16a34a',
  Archiviert: '#64748b',
}

const TYPE_COLOR: Record<ProjectType, string> = {
  Dublette:            '#5bafd6',
  Einzelbohrung:       '#a8d4e6',
  Explorationsbohrung: '#e8a857',
  EGS:                 '#a87cd6',
}

// ── SaveProjectDialog ────────────────────────────────────────────────────────

interface SaveDialogProps {
  onSave: (name: string, description: string) => Promise<void>
  saving: boolean
}

function SaveProjectDialog({ onSave, saving }: SaveDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [open, setOpen] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await onSave(name.trim(), description.trim())
    setOpen(false)
    setName('')
    setDescription('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button>
          <SaveIcon />
          Aktuellen Stand speichern
        </Button>
      } />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Projekt speichern</DialogTitle>
          <DialogDescription>
            Speichere den aktuellen DeltaT-Rechnerstand als Projekt.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="project-name" className="text-sm font-medium">
              Projektname *
            </label>
            <Input
              id="project-name"
              placeholder="z. B. Standort München-Nord"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="project-desc" className="text-sm font-medium">
              Beschreibung
            </label>
            <Input
              id="project-desc"
              placeholder="Optional"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              Abbrechen
            </DialogClose>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Speichern…' : 'Speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── ProjectCard (vereinfacht, vollständig anklickbar) ────────────────────────

interface ProjectCardProps {
  project: Project
  onClick: () => void
}

function ProjectCard({ project, onClick }: ProjectCardProps) {
  const showDeltaT = project.project_type === 'Dublette' || project.deltat_input != null

  return (
    <Card
      className="cursor-pointer hover:shadow-md hover:ring-1 hover:ring-primary/20 transition-all duration-150 select-none"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Projekt ${project.name} öffnen`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex-1 min-w-0 text-sm leading-snug">{project.name}</CardTitle>
          <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
            {project.project_type && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded border"
                style={{
                  color: TYPE_COLOR[project.project_type],
                  borderColor: TYPE_COLOR[project.project_type],
                }}
              >
                {project.project_type}
              </span>
            )}
            {project.status && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border"
                style={{
                  color: STATUS_COLOR[project.status],
                  borderColor: STATUS_COLOR[project.status],
                }}
              >
                {project.status}
              </span>
            )}
          </div>
        </div>
        {project.description && (
          <CardDescription className="line-clamp-1 text-xs mt-0.5">
            {project.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Schnellübersicht: Kernparameter */}
        {project.deltat_input && (
          <dl className="grid grid-cols-3 gap-1 text-xs mb-3">
            <div>
              <dt className="text-muted-foreground/70">Tiefe</dt>
              <dd className="font-mono font-medium">{project.deltat_input.tiefe} m</dd>
            </div>
            <div>
              <dt className="text-muted-foreground/70">GW-Temp.</dt>
              <dd className="font-mono font-medium">{project.deltat_input.tGW} °C</dd>
            </div>
            <div>
              <dt className="text-muted-foreground/70">Q</dt>
              <dd className="font-mono font-medium">{project.deltat_input.Q} l/s</dd>
            </div>
          </dl>
        )}

        {/* ── Berechnungsstatus ─────────────────────────────────── */}
        <div className="mt-3 flex flex-col gap-1.5 border-t border-border/50 pt-3">
          {showDeltaT && (
            project.deltat_result ? (
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                <span className="text-muted-foreground">DeltaT:</span>
                <span className="font-medium text-foreground">
                  {(project.deltat_result.qDelivered ?? 0).toFixed(0)} kW
                  {project.deltat_result.anzahlDubletten != null && ` · ${project.deltat_result.anzahlDubletten}× Dublette`}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 italic">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                DeltaT-Berechnung steht noch aus
              </div>
            )
          )}
          {project.bohrkost_result ? (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              <span className="text-muted-foreground">Bohrkost:</span>
              <span className="font-medium text-foreground font-mono">
                {project.bohrkost_result.projektkosten_mid >= 1_000_000
                  ? `${(project.bohrkost_result.projektkosten_mid / 1_000_000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} Mio. EUR`
                  : `${(project.bohrkost_result.projektkosten_mid / 1_000).toLocaleString('de-DE', { maximumFractionDigits: 0 })} T EUR`
                }
              </span>
              <span className="text-muted-foreground/60">
                ({project.bohrkost_result.anzahl_bohrungen} Bohr.)
              </span>
              {project.bohrkost_result.foerderung_betrag > 0 && (
                <span className="text-green-600 dark:text-green-400 font-mono">
                  → {project.bohrkost_result.projektkosten_netto_mid >= 1_000_000
                    ? `${(project.bohrkost_result.projektkosten_netto_mid / 1_000_000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} Mio.`
                    : `${(project.bohrkost_result.projektkosten_netto_mid / 1_000).toLocaleString('de-DE', { maximumFractionDigits: 0 })} T`
                  } netto
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 italic">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
              Bohrkostenberechnung steht noch aus
            </div>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground/40 mt-2">{formatDate(project.created_at)}</p>
      </CardContent>
    </Card>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const deltaTInputs  = useDeltaTStore((s) => s.inputs)
  const deltaTOutputs = useDeltaTStore((s) => s.outputs)
  const applyFullProject       = useDeltaTStore((s) => s.applyFullProject)
  const applyBohrkostFromProject = useBohrkostStore((s) => s.applyFromProject)
  const selectProject = useProjectStore((s) => s.selectProject)

  // Project store
  const projects          = useProjectStore((s) => s.projects)
  const loadingProjects   = useProjectStore((s) => s.loading)
  const fetchProjects     = useProjectStore((s) => s.fetchProjects)
  const storeUpdate       = useProjectStore((s) => s.updateProject)
  const storeDelete       = useProjectStore((s) => s.deleteProject)

  // Local UI state
  const [saving, setSaving]         = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError]           = useState<string | null>(null)

  // Detail popup
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen]           = useState(false)

  // Derives the current (possibly updated) project from the store
  const detailProject = detailProjectId
    ? (projects.find(p => p.id === detailProjectId) ?? null)
    : null

  const stableFetchProjects = useCallback(fetchProjects, [fetchProjects])

  useEffect(() => {
    if (!authLoading && user) stableFetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user])

  function openDetail(project: Project) {
    setDetailProjectId(project.id)
    setDetailOpen(true)
  }

  async function handleSave(name: string, description: string) {
    setSaving(true)
    try {
      await createProject({
        name,
        description,
        deltat_input: deltaTInputs,
        deltat_result: deltaTOutputs,
      })
      // Refresh store so new project appears
      await stableFetchProjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(id: string, updates: ProjectUpdate) {
    try {
      await storeUpdate(id, updates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aktualisierung fehlgeschlagen')
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await storeDelete(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen')
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
    // Wenn bohrkost_input bereits gespeichert: direkt laden
    const deltaTAnzahl = project.deltat_result?.anzahlDubletten ?? null
    const partial: Partial<BohrkostInputs> = project.bohrkost_input
      ? project.bohrkost_input
      : {
          tiefe:           project.deltat_input?.tiefe ?? 700,
          tGW:             project.deltat_input?.tGW   ?? 35,
          foerderrate:     project.deltat_input?.Q      ?? 15,
          tReinjektion:    project.deltat_input?.tR     ?? 15,
          zweck,
          // Dubletten-Anzahl aus DeltaT-Ergebnis vorbelegen (max. 8)
          ...(deltaTAnzahl != null && {
            anzahlDubletten: Math.min(8, Math.max(1, deltaTAnzahl)),
          }),
        }
    applyBohrkostFromProject(partial, project.id, project.name)
    router.push('/bohrkost')
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Lade…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center gap-4 text-center">
        <FolderOpenIcon className="size-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Meine Projekte</h1>
        <p className="text-muted-foreground max-w-md">
          Melde dich an, um DeltaT-Berechnungen als Projekte zu speichern und später wieder zu laden.
        </p>
        <Button onClick={() => router.push('/login')}>Anmelden</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Meine Projekte</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Klick auf eine Karte für Details, Berechnung und Navigation
          </p>
        </div>
        <div className="flex items-center gap-2">
          {projects.length > 0 && (
            <Button
              variant="outline"
              onClick={() => exportProjectsToCsv(projects)}
              aria-label="Alle Projekte als CSV herunterladen"
            >
              <DownloadIcon />
              CSV
            </Button>
          )}
          <SaveProjectDialog onSave={handleSave} saving={saving} />
          <ProjectFormDialog mode="create" />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm"
        >
          {error}
        </div>
      )}

      {loadingProjects ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <PlusIcon className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            Noch keine Projekte gespeichert.
            <br />
            Berechne im DeltaT-Rechner und speichere den Stand.
          </p>
          <Button variant="outline" onClick={() => router.push('/deltat')}>
            Zum DeltaT-Rechner
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => openDetail(project)}
            />
          ))}
        </div>
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
