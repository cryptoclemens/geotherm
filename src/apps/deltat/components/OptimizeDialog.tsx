'use client'

import { useState } from 'react'
import { SlidersHorizontalIcon, TrendingUpIcon, CheckIcon, XIcon, InfoIcon } from 'lucide-react'
import { Button } from '@/core/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/core/ui/dialog'
import { useDeltaTStore } from '../store/useDeltaTStore'
import { optimize } from '../calc/optimize'
import type { OptimizeMode, OptimizeResult } from '../calc/optimize'
import { calculateSystem } from '../calc/system'

interface ModeOption {
  id: OptimizeMode
  label: string
  desc: string
  icon: React.ReactNode
}

const MODES: ModeOption[] = [
  {
    id: 'MIN_DOUBLETTEN',
    label: 'Minimale Doubletten',
    desc: 'Reduziert CAPEX — findet Q und T_R, die mit möglichst wenig Bohrpaaren die Zielleistung erreichen.',
    icon: <TrendingUpIcon className="w-4 h-4" />,
  },
  {
    id: 'MAX_SPF',
    label: 'Maximale Effizienz (SPF)',
    desc: 'Reduziert OPEX — maximiert das Verhältnis gelieferte Wärme / Strom (Grid-Scan 50×20 Kombinationen).',
    icon: <SlidersHorizontalIcon className="w-4 h-4" />,
  },
]

function fmt(n: number, dec = 0) {
  return n.toLocaleString('de-DE', { maximumFractionDigits: dec })
}

export function OptimizeDialog() {
  const inputs  = useDeltaTStore(s => s.inputs)
  const setInput = useDeltaTStore(s => s.setInput)

  const [open, setOpen]       = useState(false)
  const [mode, setMode]       = useState<OptimizeMode>('MIN_DOUBLETTEN')
  const [result, setResult]   = useState<OptimizeResult | null>(null)
  const [computing, setComputing] = useState(false)

  function handleOpen() {
    setResult(null)
    setOpen(true)
  }

  function handleCompute() {
    setComputing(true)
    // setTimeout damit der State-Update gerendert wird bevor der Scan läuft
    setTimeout(() => {
      const r = optimize(inputs, mode)
      setResult(r)
      setComputing(false)
    }, 0)
  }

  function handleApply() {
    if (!result?.ok) return
    const { newInputs } = result
    // Reihenfolge: zuerst tR und abstand, dann Q (Q-Änderung triggert keine Kopplung)
    if (newInputs.tR   !== undefined) setInput('tR',     newInputs.tR)
    if (newInputs.abstand !== undefined) setInput('abstand', newInputs.abstand)
    if (newInputs.Q    !== undefined) setInput('Q',      newInputs.Q)
    setOpen(false)
    setResult(null)
  }

  // Vorher/Nachher-Kennzahlen für Vergleichstabelle
  const after = result?.ok ? calculateSystem({ ...inputs, ...result.newInputs }) : null
  const before = calculateSystem(inputs)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        data-print-hide
        onClick={handleOpen}
        aria-label="Optimum-Einstellungen berechnen"
      >
        <SlidersHorizontalIcon className="w-3.5 h-3.5" />
        Optimieren
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Optimum-Einstellungen</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-1">
            {/* Modus-Auswahl */}
            {!result && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">Optimierungsziel wählen:</p>
                {MODES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                      mode === m.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className={`mt-0.5 shrink-0 ${mode === m.id ? 'text-primary' : 'text-muted-foreground'}`}>
                      {m.icon}
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className={`text-sm font-medium ${mode === m.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {m.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground leading-snug">{m.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Fehler */}
            {result && !result.ok && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-400">
                <XIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <p>{result.error}</p>
              </div>
            )}

            {/* Ergebnis: Änderungen */}
            {result?.ok && (
              <div className="flex flex-col gap-3">
                {/* Änderungen pro Parameter */}
                <div className="flex flex-col divide-y divide-border">
                  {result.changes.map(c => (
                    <div key={c.label} className="py-2.5 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-foreground">{c.label}</span>
                        <span className="text-xs font-mono">
                          <span className="text-muted-foreground line-through mr-1">{c.vorher}</span>
                          <span className="text-primary font-semibold">{c.nachher}</span>
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-snug">{c.rationale}</p>
                    </div>
                  ))}
                </div>

                {/* Vorher/Nachher KPIs */}
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Auswirkung</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      {
                        label: 'Doubletten',
                        vorher: before.anzahlDubletten ?? '–',
                        nachher: after?.anzahlDubletten ?? '–',
                        unit: 'Stk.',
                      },
                      {
                        label: 'Durchbruchszeit',
                        vorher: fmt(before.tBreak, 1),
                        nachher: after ? fmt(after.tBreak, 1) : '–',
                        unit: 'Jahre',
                      },
                      {
                        label: 'Gelieferte Wärme',
                        vorher: fmt(before.qDelivered, 0),
                        nachher: after ? fmt(after.qDelivered, 0) : '–',
                        unit: 'kW',
                      },
                    ].map(row => (
                      <div key={row.label} className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-muted-foreground">{row.label}</span>
                        <span className="font-mono text-muted-foreground/60 line-through text-[10px]">{row.vorher} {row.unit}</span>
                        <span className="font-mono font-semibold text-primary">{row.nachher} {row.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hinweise */}
                {result.hinweise.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {result.hinweise.map((h, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                        <InfoIcon className="w-3 h-3 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setResult(null) }}>
              Abbrechen
            </Button>
            {!result ? (
              <Button size="sm" onClick={handleCompute} disabled={computing}>
                {computing ? 'Berechne…' : 'Berechnen'}
              </Button>
            ) : result.ok ? (
              <Button size="sm" onClick={handleApply}>
                <CheckIcon className="w-3.5 h-3.5" />
                Übernehmen
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setResult(null)}>
                Zurück
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
