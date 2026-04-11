'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FolderOpenIcon, PlusIcon, Trash2Icon, ArrowRightIcon, SaveIcon, DownloadIcon } from 'lucide-react'
import { exportProjectsToCsv } from '@/core/lib/exportCsv'
import { useAuth } from '@/core/auth/useAuth'
import {
  listProjects,
  createProject,
  deleteProject,
  type Project,
} from '@/core/api/projects'
import { useDeltaTStore } from '@/apps/deltat/store/useDeltaTStore'
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

interface ProjectCardProps {
  project: Project
  onLoad: (project: Project) => void
  onDelete: (id: string) => void
  deleting: boolean
}

function ProjectCard({ project, onLoad, onDelete, deleting }: ProjectCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
        {project.description && (
          <CardDescription>{project.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {project.deltat_input && (
            <>
              <dt>Tiefe</dt>
              <dd className="font-medium text-foreground">
                {project.deltat_input.tiefe} m
              </dd>
              <dt>Förderrate</dt>
              <dd className="font-medium text-foreground">
                {project.deltat_input.Q} l/s
              </dd>
              <dt>GW-Temp.</dt>
              <dd className="font-medium text-foreground">
                {project.deltat_input.tGW} °C
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
      </CardContent>
      <CardFooter className="gap-2">
        <Button size="sm" onClick={() => onLoad(project)}>
          <ArrowRightIcon />
          In DeltaT laden
        </Button>
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
    router.push('/deltat')
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
              onDelete={handleDelete}
              deleting={deletingId === project.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
