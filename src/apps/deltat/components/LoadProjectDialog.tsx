'use client'

import { useState, useEffect } from 'react'
import { FolderOpenIcon } from 'lucide-react'
import { Button } from '@/core/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/core/ui/dialog'
import { useProjectStore } from '@/core/store/useProjectStore'
import { useDeltaTStore } from '../store/useDeltaTStore'
import type { Project } from '@/core/api/projects'

function formatDate(iso: string): string {
  if (!iso) return '–'
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

const STATUS_COLOR: Record<string, string> = {
  Idee: '#94a3b8',
  Planung: '#3b82f6',
  Aktiv: '#16a34a',
  Archiviert: '#64748b',
}

const TYPE_COLOR: Record<string, string> = {
  Dublette: '#5bafd6',
  Einzelbohrung: '#a8d4e6',
  Explorationsbohrung: '#e8a857',
  EGS: '#a87cd6',
}

export function LoadProjectDialog() {
  const [open, setOpen] = useState(false)
  const projects = useProjectStore((s) => s.projects)
  const loading = useProjectStore((s) => s.loading)
  const fetchProjects = useProjectStore((s) => s.fetchProjects)
  const selectProject = useProjectStore((s) => s.selectProject)
  const applyFullProject = useDeltaTStore((s) => s.applyFullProject)

  useEffect(() => {
    if (open) {
      fetchProjects()
    }
  }, [open, fetchProjects])

  function handleLoad(project: Project) {
    if (project.deltat_input) {
      applyFullProject(project.deltat_input)
    }
    selectProject(project.id)
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        data-print-hide
        onClick={() => setOpen(true)}
        aria-label="Projekt laden"
      >
        <FolderOpenIcon />
        Laden
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Projekt laden</DialogTitle>
            <DialogDescription>
              Wähle ein gespeichertes Projekt um dessen Parameter in den Rechner zu übernehmen.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto py-2">
            {loading && (
              <p className="text-sm text-muted-foreground py-4 text-center">Lade Projekte…</p>
            )}
            {!loading && projects.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Keine Projekte vorhanden.
              </p>
            )}
            {projects.map((project) => (
              <button
                key={project.id}
                className="text-left rounded-lg border border-border p-3 hover:border-primary/50 hover:bg-muted/40 transition-colors"
                onClick={() => handleLoad(project)}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-sm text-foreground">{project.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {project.project_type && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded border"
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
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded border"
                        style={{
                          color: STATUS_COLOR[project.status] ?? '#64748b',
                          borderColor: STATUS_COLOR[project.status] ?? '#64748b',
                        }}
                      >
                        {project.status}
                      </span>
                    )}
                  </div>
                </div>
                {project.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{project.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  {project.deltat_input && (
                    <span>{project.deltat_input.tiefe} m · {project.deltat_input.tGW} °C</span>
                  )}
                  <span className="ml-auto">{formatDate(project.created_at)}</span>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
