'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FolderOpenIcon, PlusIcon, Trash2Icon, ArrowRightIcon, SaveIcon, DownloadIcon } from 'lucide-react'
import { exportProjectsToCsv } from '@/core/lib/exportCsv'
import { useAuth } from '@/core/auth/useAuth'
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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

const STATUS_COLOR: Record<ProjectStatus, string> = {
  Idee: '#94a3b8',
  Planung: '#3b82f6',
  Aktiv: '#16a34a',
  Archiviert: '#64748b',
}

const TYPE_COLOR: Record<ProjectType, string> = {
  Dublette: '#5bafd6',
  Einzelbohrung: '#a8d4e6',
  Explorationsbohrung: '#e8a857',
  EGS: '#a87cd6',
}

/** Geothermischer Gradient: T_GW ≈ 10 °C + tiefe × 0,03 °C/m (VDI 4640 Bl. 1) */
const GEO_GRADIENT = 0.03
const GEO_SURFACE  = 10

function tiefeToTgw(tiefe: number): number {
  return Math.round((GEO_SURFACE + tiefe * GEO_GRADIENT) * 10) / 10
}
function tgwToTiefe(tGW: number): number {
  return Math.max(0, Math.round((tGW - GEO_SURFACE) / GEO_GRADIENT))
}

interface InlineEditFieldProps {
  value: number
  unit: string
  min?: number
  max?: number
  step?: number
  onSave: (v: number) => void
}

function InlineEditField({ value, unit, min, max, step = 1, onSave }: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))

  function commit() {
    const parsed = parseFloat(draft)
    if (!isNaN(parsed)) onSave(parsed)
    setEditing(false)
  }

  if (editing) {
    return (
      <span className="flex items-center gap-1">
        <input
          type="number"
          value={draft}
          min={min}
          max={max}
          step={step}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') { setDraft(String(value)); setEditing(false) }
          }}
          className="w-20 text-right text-xs font-mono font-medium bg-background border border-primary/50 rounded px-1.5 py-0.5 outline-none"
          autoFocus
        />
        <span className="text-muted-foreground">{unit}</span>
      </span>
    )
  }

  return (
    <button
      onClick={() => { setDraft(String(value)); setEditing(true) }}
      className="font-medium text-foreground hover:text-primary hover:underline underline-offset-2 decoration-dotted transition-colors text-left"
      title="Klicken zum Bearbeiten"
    >
      {value} {unit}
    </button>
  )
}

interface ProjectCardProps {
  project: Project
  onLoad: (project: Project) => void
  onLoadBohrkost: (project: Project) => void
  onUpdate: (id: string, updates: ProjectUpdate) => void
  onDelete: (id: string) => void
  deleting: boolean
}

function ProjectCard({ project, onLoad, onLoadBohrkost, onUpdate, onDelete, deleting }: ProjectCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  function saveField(field: 'tiefe' | 'tGW' | 'Q', raw: number) {
    if (!project.deltat_input) return
    const next = { ...project.deltat_input }

    if (field === 'tiefe') {
      next.tiefe = raw
      next.tGW   = tiefeToTgw(raw)    // Gradient-Kopplung
    } else if (field === 'tGW') {
      next.tGW   = raw
      next.tiefe = tgwToTiefe(raw)    // Gradient-Kopplung
    } else {
      next.Q = raw
    }

    onUpdate(project.id, { deltat_input: next })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex-1 min-w-0">{project.name}</CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
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
          <CardDescription>{project.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {project.deltat_input && (
            <>
              <dt className="self-center">Tiefe</dt>
              <dd>
                <InlineEditField
                  value={project.deltat_input.tiefe}
                  unit="m"
                  min={50} max={5000} step={50}
                  onSave={v => saveField('tiefe', v)}
                />
              </dd>
              <dt className="self-center">Förderrate</dt>
              <dd>
                <InlineEditField
                  value={project.deltat_input.Q}
                  unit="l/s"
                  min={1} max={200} step={1}
                  onSave={v => saveField('Q', v)}
                />
              </dd>
              <dt className="self-center">GW-Temp.</dt>
              <dd>
                <InlineEditField
                  value={project.deltat_input.tGW}
                  unit="°C"
                  min={5} max={120} step={0.5}
                  onSave={v => saveField('tGW', v)}
                />
              </dd>
            </>
          )}
          {project.deltat_result && (
            <>
              <dt>Thermische Leistung</dt>
              <dd className="font-medium text-foreground">
                {project.deltat_result.qDelivered.toFixed(0)} kW
              </dd>
            </>
          )}
          <dt>Gespeichert</dt>
          <dd>{formatDate(project.created_at)}</dd>
        </dl>
        {project.deltat_input && (
          <p className="text-[10px] text-muted-foreground/50 mt-2 italic">
            Tiefe ↔ GW-Temp. gekoppelt (∇T = 0,03 °C/m · VDI 4640)
          </p>
        )}

        {/* ── Berechnungsstatus ─────────────────────────────────── */}
        <div className="mt-3 flex flex-col gap-1.5 border-t border-border/50 pt-3">
          {/* DeltaT — nur bei Dublette relevant */}
          {project.project_type === 'Dublette' || (!project.project_type && project.deltat_input) ? (
            project.deltat_result ? (
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                <span className="text-muted-foreground">DeltaT:</span>
                <span className="font-medium text-foreground">
                  {project.deltat_result.qDelivered.toFixed(0)} kW · {project.deltat_result.anzahlDoubletten}× Dublette
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 italic">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                DeltaT-Berechnung steht noch aus
              </div>
            )
          ) : null}

          {/* Bohrkost */}
          {project.bohrkost_result ? (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              <span className="text-muted-foreground">Bohrkost:</span>
              <span className="font-medium text-foreground font-mono">
                {project.bohrkost_result.projektkosten_mid >= 1_000_000
                  ? `${(project.bohrkost_result.projektkosten_mid / 1_000_000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} Mio. EUR`
                  : `${(project.bohrkost_result.projektkosten_mid / 1_000).toLocaleString('de-DE', { maximumFractionDigits: 0 })} T EUR`
                }
                {project.bohrkost_result.foerderung_betrag > 0 && (
                  <span className="text-green-600 dark:text-green-400 ml-1 font-normal">
                    (nach Förderung: {project.bohrkost_result.projektkosten_netto_mid >= 1_000_000
                      ? `${(project.bohrkost_result.projektkosten_netto_mid / 1_000_000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} Mio.`
                      : `${(project.bohrkost_result.projektkosten_netto_mid / 1_000).toLocaleString('de-DE', { maximumFractionDigits: 0 })} T`
                    })
                  </span>
                )}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 italic">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
              Bohrkostenberechnung steht noch aus
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex-wrap gap-2">
        {(project.deltat_input || project.project_type === 'Dublette') && (
          <Button size="sm" onClick={() => onLoad(project)}>
            <ArrowRightIcon />
            In DeltaT laden
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => onLoadBohrkost(project)}>
          <ArrowRightIcon />
          In Bohrkost laden
        </Button>
        <ProjectFormDialog mode="edit" project={project} />
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger render={
            <Button variant="ghost" size="icon-sm">
              <Trash2Icon />
              <span className="sr-only">Löschen</span>
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Projekt löschen?</DialogTitle>
              <DialogDescription>
                &bdquo;{project.name}&ldquo; wird unwiderruflich gelöscht.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" type="button" />}>
                Abbrechen
              </DialogClose>
              <Button
                variant="destructive"
                disabled={deleting}
                onClick={() => {
                  onDelete(project.id)
                  setConfirmOpen(false)
                }}
              >
                {deleting ? 'Löschen…' : 'Löschen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const deltaTInputs = useDeltaTStore((s) => s.inputs)
  const deltaTOutputs = useDeltaTStore((s) => s.outputs)
  const applyFullProject = useDeltaTStore((s) => s.applyFullProject)
  const applyBohrkostFromProject = useBohrkostStore((s) => s.applyFromProject)
  const selectProject = useProjectStore((s) => s.selectProject)

  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      setLoadingProjects(true)
      setError(null)
      const data = await listProjects()
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoadingProjects(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && user) {
      fetchProjects()
    }
    if (!authLoading && !user) {
      setLoadingProjects(false)
    }
  }, [authLoading, user, fetchProjects])

  async function handleSave(name: string, description: string) {
    setSaving(true)
    try {
      const newProject = await createProject({
        name,
        description,
        deltat_input: deltaTInputs,
        deltat_result: deltaTOutputs,
      })
      setProjects((prev) => [newProject, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(id: string, updates: ProjectUpdate) {
    try {
      const updated = await updateProject(id, updates)
      setProjects(prev => prev.map(p => p.id === id ? updated : p))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aktualisierung fehlgeschlagen')
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
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
      project.project_type === 'Dublette'            ? 'Dublette'
      : project.project_type === 'Einzelbohrung'     ? 'Einzelbohrung'
      : project.project_type === 'Explorationsbohrung' ? 'Explorationsbohrung'
      : 'Dublette'
    // Wenn bohrkost_input bereits gespeichert: direkt laden
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
        <Button onClick={() => router.push('/login')}>
          Anmelden
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Meine Projekte</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gespeicherte DeltaT-Berechnungen
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
              onLoad={handleLoad}
              onLoadBohrkost={handleLoadBohrkost}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              deleting={deletingId === project.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
