'use client'

import { useState } from 'react'
import { SaveIcon, CheckIcon, XIcon } from 'lucide-react'
import { Button } from '@/core/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/core/ui/dialog'
import { Input } from '@/core/ui/input'
import { createProject } from '@/core/api/projects'
import { useDeltaTStore } from '../store/useDeltaTStore'
import { useProjectStore } from '@/core/store/useProjectStore'

type Status = 'idle' | 'saving' | 'success' | 'error'

export function SaveProjectDialog() {
  const inputs  = useDeltaTStore(s => s.inputs)
  const outputs = useDeltaTStore(s => s.outputs)

  const selectedProjectId = useProjectStore(s => s.selectedProjectId)
  const selectedProject   = useProjectStore(s => s.projects.find(p => p.id === s.selectedProjectId))
  const storeUpdate       = useProjectStore(s => s.updateProject)

  const isUpdate = selectedProjectId != null

  const [open, setOpen]     = useState(false)
  const [name, setName]     = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errMsg, setErrMsg] = useState('')

  function handleOpen() {
    // Bei Update: bestehenden Projektnamen vorbelegen; bei Neu: Kennzahlen
    const suggestion = isUpdate && selectedProject
      ? selectedProject.name
      : `${inputs.tiefe} m · ${inputs.tGW} °C · ${outputs.qDelivered.toFixed(0)} kW`
    setName(suggestion)
    setStatus('idle')
    setErrMsg('')
    setOpen(true)
  }

  async function handleSave() {
    if (!name.trim()) return
    setStatus('saving')
    try {
      if (isUpdate && selectedProjectId) {
        await storeUpdate(selectedProjectId, {
          name:          name.trim(),
          deltat_input:  inputs,
          deltat_result: outputs,
        })
      } else {
        await createProject({
          name:          name.trim(),
          deltat_input:  inputs,
          deltat_result: outputs,
        })
      }
      setStatus('success')
      setTimeout(() => setOpen(false), 1200)
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'Unbekannter Fehler')
      setStatus('error')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave()
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        data-print-hide
        onClick={handleOpen}
        aria-label={isUpdate ? 'Projekt aktualisieren' : 'Projekt speichern'}
      >
        <SaveIcon />
        {isUpdate ? 'Aktualisieren' : 'Speichern'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{isUpdate ? 'Projekt aktualisieren' : 'Projekt speichern'}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            <label htmlFor="project-name" className="text-sm text-muted-foreground">
              Projektname
            </label>
            <Input
              id="project-name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="z. B. Standort Hamburg Nord"
              disabled={status === 'saving' || status === 'success'}
              autoFocus
            />
            {/* Vorschau der gespeicherten Kennzahlen */}
            <p className="text-xs text-muted-foreground">
              {isUpdate ? 'Aktualisiert werden' : 'Gespeichert werden'}: alle Parameter + Ergebnisse
              ({inputs.tiefe} m · {inputs.tGW} °C · {outputs.qDelivered.toFixed(0)} kW · {outputs.anzahlDoubletten ?? '–'} Dobl.)
            </p>
            {status === 'error' && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <XIcon className="w-3.5 h-3.5" /> {errMsg}
              </p>
            )}
            {status === 'success' && (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <CheckIcon className="w-3.5 h-3.5" /> Gespeichert!
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={status === 'saving'}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || status === 'saving' || status === 'success'}
            >
              {status === 'saving'
                ? (isUpdate ? 'Aktualisieren…' : 'Speichern…')
                : (isUpdate ? 'Aktualisieren' : 'Speichern')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
