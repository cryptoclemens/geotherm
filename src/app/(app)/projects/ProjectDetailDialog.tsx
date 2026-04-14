'use client'

import { useState } from 'react'
import {
  ArrowRightIcon,
  MapPinIcon,
  FileTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  Trash2Icon,
  PencilIcon,
  CalendarIcon,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/core/ui/dialog'
import { Button } from '@/core/ui/button'
import { Separator } from '@/core/ui/separator'
import { ProjectFormDialog } from './ProjectFormDialog'
import type { Project, ProjectUpdate, ProjectType, ProjectStatus } from '@/core/api/projects'

// ── Constants ────────────────────────────────────────────────────────────────

const GEO_GRADIENT = 0.03
const GEO_SURFACE  = 10

const STATUS_COLOR: Record<ProjectStatus, string> = {
  Idee:        '#94a3b8',
  Planung:     '#3b82f6',
  Aktiv:       '#16a34a',
  Archiviert:  '#64748b',
}
const TYPE_COLOR: Record<ProjectType, string> = {
  Dublette:            '#5bafd6',
  Einzelbohrung:       '#a8d4e6',
  Explorationsbohrung: '#e8a857',
  EGS:                 '#a87cd6',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function tiefeToTgw(tiefe: number): number {
  return Math.round((GEO_SURFACE + tiefe * GEO_GRADIENT) * 10) / 10
}
function tgwToTiefe(tGW: number): number {
  return Math.max(0, Math.round((tGW - GEO_SURFACE) / GEO_GRADIENT))
}
function fmt(n: number, dec = 0): string {
  return n.toLocaleString('de-DE', { maximumFractionDigits: dec })
}
function fmtEur(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} Mio. EUR`
  if (n >= 1_000)     return `${(n / 1_000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} T EUR`
  return `${n.toLocaleString('de-DE', { maximumFractionDigits: 0 })} EUR`
}
function formatDate(iso: string): string {
  if (!iso) return '–'
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

// ── InlineEditField ──────────────────────────────────────────────────────────

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
        <span className="text-muted-foreground text-xs">{unit}</span>
      </span>
    )
  }

  return (
    <button
      onClick={() => { setDraft(String(value)); setEditing(true) }}
      className="text-sm font-medium text-foreground hover:text-primary hover:underline underline-offset-2 decoration-dotted transition-colors text-left"
      title="Klicken zum Bearbeiten"
    >
      {value} {unit}
    </button>
  )
}

// ── Props ────────────────────────────────────────────────────────────────────

export interface ProjectDetailDialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoad: (project: Project) => void
  onLoadBohrkost: (project: Project) => void
  onUpdate: (id: string, updates: ProjectUpdate) => Promise<void>
  onDelete: (id: string) => void
  deleting: boolean
}

// ── Component ────────────────────────────────────────────────────────────────

export function ProjectDetailDialog({
  project,
  open,
  onOpenChange,
  onLoad,
  onLoadBohrkost,
  onUpdate,
  onDelete,
  deleting,
}: ProjectDetailDialogProps) {
  const [showExtended, setShowExtended] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const showDeltaT = project.project_type === 'Dublette' || project.deltat_input != null

  function saveDeltaTField(field: 'tiefe' | 'tGW' | 'Q', raw: number) {
    if (!project.deltat_input) return
    const next = { ...project.deltat_input }
    if (field === 'tiefe')     { next.tiefe = raw; next.tGW   = tiefeToTgw(raw) }
    else if (field === 'tGW') { next.tGW   = raw; next.tiefe = tgwToTiefe(raw) }
    else                       { next.Q = raw }
    onUpdate(project.id, { deltat_input: next })
  }

  function handleDelete() {
    onOpenChange(false)
    onDelete(project.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[88vh] p-0 flex flex-col gap-0 overflow-hidden"
      >
        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-start gap-3 pr-8">
            <DialogTitle className="flex-1 text-base leading-snug">
              {project.name}
            </DialogTitle>
            <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
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

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {project.location && (
              <span className="flex items-center gap-1">
                <MapPinIcon className="w-3 h-3 shrink-0" />
                {project.location.name}
                {project.location.lat != null && project.location.lng != null && (
                  <span className="font-mono text-[10px] opacity-60">
                    ({project.location.lat.toFixed(3)}°N, {project.location.lng.toFixed(3)}°E)
                  </span>
                )}
              </span>
            )}
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-3 h-3 shrink-0" />
              {formatDate(project.created_at)}
            </span>
            {project.updated_at !== project.created_at && (
              <span className="text-muted-foreground/50">
                Aktualisiert: {formatDate(project.updated_at)}
              </span>
            )}
          </div>
        </DialogHeader>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 min-h-0">

          {/* Description + Notes */}
          {(project.description || project.notes) && (
            <div className="flex flex-col gap-2">
              {project.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {project.description}
                </p>
              )}
              {project.notes && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2.5">
                  <FileTextIcon className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-60" />
                  <span className="whitespace-pre-line leading-relaxed">{project.notes}</span>
                </div>
              )}
            </div>
          )}

          {/* ── DeltaT-Sektion ── */}
          {showDeltaT && (
            <>
              {(project.description || project.notes) && <Separator />}

              <div className="flex flex-col gap-3">
                {/* Titel */}
                <div className="flex items-center gap-2">
                  {project.deltat_result
                    ? <CheckCircle2Icon className="w-4 h-4 text-green-500 shrink-0" />
                    : <CircleDashedIcon className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  }
                  <h3 className="text-sm font-semibold">DeltaT — Systemauslegung</h3>
                  {!project.deltat_result && (
                    <span className="text-[11px] text-muted-foreground/60 italic">
                      (Berechnung ausstehend)
                    </span>
                  )}
                </div>

                {/* Parameter */}
                {project.deltat_input ? (
                  <>
                    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-xs">
                      <div>
                        <dt className="text-muted-foreground mb-0.5">Bohrtiefe</dt>
                        <dd>
                          <InlineEditField
                            value={project.deltat_input.tiefe}
                            unit="m" min={50} max={5000} step={50}
                            onSave={v => saveDeltaTField('tiefe', v)}
                          />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground mb-0.5">GW-Temperatur</dt>
                        <dd>
                          <InlineEditField
                            value={project.deltat_input.tGW}
                            unit="°C" min={5} max={120} step={0.5}
                            onSave={v => saveDeltaTField('tGW', v)}
                          />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground mb-0.5">Förderrate</dt>
                        <dd>
                          <InlineEditField
                            value={project.deltat_input.Q}
                            unit="l/s" min={1} max={200} step={1}
                            onSave={v => saveDeltaTField('Q', v)}
                          />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground mb-0.5">Reinjektionstemp.</dt>
                        <dd className="font-medium text-foreground">{project.deltat_input.tR} °C</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground mb-0.5">Ziel-Wärmeleistung</dt>
                        <dd className="font-medium text-foreground">{project.deltat_input.zielLeistung} kW</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground mb-0.5">Bohrlochabstand</dt>
                        <dd className="font-medium text-foreground">{project.deltat_input.abstand} m</dd>
                      </div>
                    </dl>

                    <button
                      onClick={() => setShowExtended(s => !s)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
                    >
                      {showExtended
                        ? <ChevronUpIcon className="w-3.5 h-3.5" />
                        : <ChevronDownIcon className="w-3.5 h-3.5" />
                      }
                      {showExtended ? 'Weniger anzeigen' : 'Alle Parameter anzeigen'}
                    </button>

                    {showExtended && (
                      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-xs bg-muted/30 rounded-lg px-4 py-3">
                        {[
                          { label: 'Aquifer-Mächtigkeit', value: `${project.deltat_input.maechtig} m` },
                          { label: 'k_f (hydr. Leitf.)', value: `${project.deltat_input.kf.toExponential(1)} m/s` },
                          { label: 'Mineralisation (TDS)', value: `${project.deltat_input.tds} mg/l` },
                          { label: 'Vorlauftemp. (VL)', value: `${project.deltat_input.tVL} °C` },
                          { label: 'Rücklauftemp. (RL)', value: `${project.deltat_input.tRL} °C` },
                          { label: 'Laufstunden', value: `${project.deltat_input.laufstunden} h/a` },
                          { label: 'Förderhöhe Pumpe', value: `${project.deltat_input.foerderhoehe} m` },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <dt className="text-muted-foreground/70 mb-0.5">{label}</dt>
                            <dd className="font-mono font-medium">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}

                    <p className="text-[10px] text-muted-foreground/50 italic">
                      Tiefe ↔ GW-Temp. gekoppelt (∇T = 0,03 °C/m · VDI 4640). Klicken zum Bearbeiten.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground/60 italic">
                    Noch keine DeltaT-Parameter hinterlegt
                  </p>
                )}

                {/* DeltaT-Ergebnisse */}
                {project.deltat_result && (
                  <div className="bg-green-50 dark:bg-green-950/20 rounded-lg px-4 py-3">
                    <p className="text-[11px] font-semibold text-green-700 dark:text-green-400 mb-3 uppercase tracking-wide">
                      Berechnungsergebnisse
                    </p>
                    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-xs">
                      {(([
                        { label: 'Gelieferte Wärme', value: `${fmt(project.deltat_result.qDelivered, 0)} kW`, strong: true },
                        { label: 'Anzahl Dubletten', value: `${project.deltat_result.anzahlDoubletten}×` },
                        { label: 'COP', value: fmt(project.deltat_result.cop, 2) },
                        { label: 'Jahreswärmemenge', value: `${fmt(project.deltat_result.jahreswaerme, 0)} MWh/a` },
                        { label: 'Durchbruchszeit', value: `${fmt(project.deltat_result.tBreak, 1)} Jahre` },
                        { label: 'Tauchpumpenleistung', value: `${fmt(project.deltat_result.tauchpumpenLeistung, 1)} kW` },
                      ]) as Array<{ label: string; value: string; strong?: boolean }>).map(({ label, value, strong }) => (
                        <div key={label}>
                          <dt className="text-muted-foreground/70 mb-0.5">{label}</dt>
                          <dd className={`font-mono font-medium text-sm ${strong ? 'text-green-700 dark:text-green-400' : ''}`}>
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {/* CTA: noch nicht berechnet */}
                {!project.deltat_result && project.deltat_input && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { onOpenChange(false); onLoad(project) }}
                    className="w-fit"
                  >
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                    Jetzt in DeltaT berechnen
                  </Button>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* ── Bohrkost-Sektion ── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              {project.bohrkost_result
                ? <CheckCircle2Icon className="w-4 h-4 text-green-500 shrink-0" />
                : <CircleDashedIcon className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              }
              <h3 className="text-sm font-semibold">Bohrkostenrechner</h3>
              {!project.bohrkost_result && (
                <span className="text-[11px] text-muted-foreground/60 italic">
                  (Berechnung ausstehend)
                </span>
              )}
            </div>

            {project.bohrkost_input && (
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-xs">
                {[
                  { label: 'Bohrtiefe',    value: `${project.bohrkost_input.tiefe} m` },
                  { label: 'Gesteinstyp',  value: project.bohrkost_input.gesteinstyp },
                  { label: 'Förderrate',   value: `${project.bohrkost_input.foerderrate} l/s` },
                  { label: 'GW-Temp.',     value: `${project.bohrkost_input.tGW} °C` },
                  { label: 'Region',       value: project.bohrkost_input.region },
                  { label: 'Durchmesser',  value: project.bohrkost_input.durchmesser },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-muted-foreground mb-0.5">{label}</dt>
                    <dd className="font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {project.bohrkost_result && (
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg px-4 py-3">
                <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 mb-3 uppercase tracking-wide">
                  Berechnungsergebnisse
                </p>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-xs">
                  {(([
                    { label: 'Projektkosten (Mitte)', value: fmtEur(project.bohrkost_result.projektkosten_mid), strong: true },
                    ...(project.bohrkost_result.foerderung_betrag > 0 ? [
                      { label: 'Nach MAP/KfW-Förderung', value: fmtEur(project.bohrkost_result.projektkosten_netto_mid) },
                    ] : []),
                    ...(project.bohrkost_result.leistung_kw > 0 ? [
                      { label: 'Thermische Leistung', value: `${fmt(project.bohrkost_result.leistung_kw, 0)} kW` },
                    ] : []),
                    { label: `Bohrungen (${project.bohrkost_result.anzahl_bohrungen}×)`, value: fmtEur(project.bohrkost_result.bohrkosten_mid) },
                    { label: 'EUR/m', value: `${fmt(project.bohrkost_result.bohrkosten_pro_m, 0)} EUR/m` },
                    ...(project.bohrkost_result.foerderung_betrag > 0 ? [
                      { label: 'Förderung (MAP/KfW)', value: fmtEur(project.bohrkost_result.foerderung_betrag) },
                    ] : []),
                  ]) as Array<{ label: string; value: string; strong?: boolean }>).map(({ label, value, strong }) => (
                    <div key={label}>
                      <dt className="text-muted-foreground/70 mb-0.5">{label}</dt>
                      <dd className={`font-mono font-medium text-sm ${strong ? 'text-blue-700 dark:text-blue-400' : ''}`}>
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {!project.bohrkost_result && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => { onOpenChange(false); onLoadBohrkost(project) }}
                className="w-fit"
              >
                <ArrowRightIcon className="w-3.5 h-3.5" />
                Jetzt in Bohrkost berechnen
              </Button>
            )}
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-3.5 border-t bg-muted/30 flex items-center gap-2 flex-wrap shrink-0">
          {/* Navigations-Aktionen */}
          {showDeltaT && (
            <Button
              size="sm"
              onClick={() => { onOpenChange(false); onLoad(project) }}
              disabled={!project.deltat_input}
            >
              <ArrowRightIcon />
              In DeltaT laden
            </Button>
          )}
          <Button
            size="sm"
            variant={showDeltaT ? 'outline' : 'default'}
            onClick={() => { onOpenChange(false); onLoadBohrkost(project) }}
          >
            <ArrowRightIcon />
            In Bohrkost laden
          </Button>

          {/* Edit + Delete */}
          <div className="ml-auto flex items-center gap-2">
            <ProjectFormDialog
              mode="edit"
              project={project}
              trigger={
                <Button variant="outline" size="sm">
                  <PencilIcon />
                  Bearbeiten
                </Button>
              }
            />
            {confirmDelete ? (
              <>
                <span className="text-xs text-destructive font-medium">Sicher löschen?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleting}
                  onClick={handleDelete}
                >
                  {deleting ? 'Löschen…' : 'Ja, löschen'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Abbrechen
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setConfirmDelete(true)}
                aria-label="Projekt löschen"
              >
                <Trash2Icon />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
