'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon } from 'lucide-react'
import { Button } from '@/core/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/core/ui/dialog'
import { Input } from '@/core/ui/input'
import { Textarea } from '@/core/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/ui/select'
import { useProjectStore } from '@/core/store/useProjectStore'
import { useDeltaTStore } from '@/apps/deltat/store/useDeltaTStore'
import type { Project, ProjectType, ProjectStatus } from '@/core/api/projects'

const PROJECT_TYPES: ProjectType[] = ['Dublette', 'Einzelbohrung', 'Explorationsbohrung', 'EGS']
const PROJECT_STATUSES: ProjectStatus[] = ['Idee', 'Planung', 'Aktiv', 'Archiviert']

interface ProjectFormDialogProps {
  mode: 'create' | 'edit'
  project?: Project
  trigger?: React.ReactElement
}

interface FormState {
  name: string
  description: string
  project_type: ProjectType | ''
  status: ProjectStatus | ''
  location_name: string
  location_lat: string
  location_lng: string
  notes: string
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  project_type: '',
  status: 'Idee',
  location_name: '',
  location_lat: '',
  location_lng: '',
  notes: '',
}

function projectToForm(project: Project): FormState {
  return {
    name: project.name,
    description: project.description ?? '',
    project_type: project.project_type ?? '',
    status: project.status ?? '',
    location_name: project.location?.name ?? '',
    location_lat: project.location?.lat != null ? String(project.location.lat) : '',
    location_lng: project.location?.lng != null ? String(project.location.lng) : '',
    notes: project.notes ?? '',
  }
}

export function ProjectFormDialog({ mode, project, trigger }: ProjectFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const createProject = useProjectStore((s) => s.createProject)
  const updateProject = useProjectStore((s) => s.updateProject)
  const deltaTInputs = useDeltaTStore((s) => s.inputs)

  useEffect(() => {
    if (open) {
      setForm(mode === 'edit' && project ? projectToForm(project) : EMPTY_FORM)
      setError(null)
    }
  }, [open, mode, project])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleApplyDeltaT() {
    setForm((prev) => ({
      ...prev,
      notes: prev.notes
        ? `${prev.notes}\n\nDeltaT-Parameter: Tiefe ${deltaTInputs.tiefe} m, T ${deltaTInputs.tGW} °C, Q ${deltaTInputs.Q} l/s`
        : `DeltaT-Parameter: Tiefe ${deltaTInputs.tiefe} m, T ${deltaTInputs.tGW} °C, Q ${deltaTInputs.Q} l/s`,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const lat = form.location_lat ? parseFloat(form.location_lat) : undefined
      const lng = form.location_lng ? parseFloat(form.location_lng) : undefined
      const hasLocation = form.location_name.trim() || (lat != null && !isNaN(lat) && lng != null && !isNaN(lng))
      const location = hasLocation
        ? {
            name: form.location_name.trim() || `${lat?.toFixed(4)}°N, ${lng?.toFixed(4)}°E`,
            lat: lat ?? 0,
            lng: lng ?? 0,
          }
        : undefined

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        project_type: (form.project_type || null) as ProjectType | null,
        status: (form.status || null) as ProjectStatus | null,
        location,
        notes: form.notes.trim() || null,
        ...(mode === 'create' && {
          deltat_input: deltaTInputs,
        }),
      }

      if (mode === 'edit' && project) {
        await updateProject(project.id, payload)
      } else {
        await createProject(payload)
      }
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  const defaultTrigger = mode === 'create' ? (
    <Button>
      <PlusIcon />
      Neues Projekt
    </Button>
  ) : (
    <Button variant="ghost" size="icon-sm" aria-label="Bearbeiten">
      <PencilIcon />
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? defaultTrigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Neues Projekt anlegen' : 'Projekt bearbeiten'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label htmlFor="pf-name" className="text-sm font-medium">
              Projektname *
            </label>
            <Input
              id="pf-name"
              placeholder="z. B. Standort München-Nord"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              required
            />
          </div>

          {/* Beschreibung */}
          <div className="flex flex-col gap-1">
            <label htmlFor="pf-desc" className="text-sm font-medium">
              Beschreibung
            </label>
            <Input
              id="pf-desc"
              placeholder="Optional"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </div>

          {/* Typ + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Projekttyp</label>
              <Select
                value={form.project_type}
                onValueChange={(v) => setField('project_type', v as ProjectType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Typ wählen…" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={form.status}
                onValueChange={(v) => setField('status', v as ProjectStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status wählen…" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ort */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Ort</label>
            <Input
              placeholder="Ortsname (z. B. München)"
              value={form.location_name}
              onChange={(e) => setField('location_name', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Input
                type="number"
                step="any"
                placeholder="Breitengrad"
                value={form.location_lat}
                onChange={(e) => setField('location_lat', e.target.value)}
              />
              <Input
                type="number"
                step="any"
                placeholder="Längengrad"
                value={form.location_lng}
                onChange={(e) => setField('location_lng', e.target.value)}
              />
            </div>
          </div>

          {/* Notizen */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label htmlFor="pf-notes" className="text-sm font-medium">Notizen</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleApplyDeltaT}
                className="text-xs h-auto py-0.5"
              >
                DeltaT-Parameter übernehmen
              </Button>
            </div>
            <Textarea
              id="pf-notes"
              placeholder="Freitext, geologische Hinweise, Projektstatus…"
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={saving || !form.name.trim()}>
              {saving ? 'Speichern…' : 'Speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
