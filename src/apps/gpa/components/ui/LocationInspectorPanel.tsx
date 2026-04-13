// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGpaStore } from '../../store/useGpaStore'
import { useWorkspaceStore } from '@/core/store/useWorkspaceStore'
import type { SavedLocation } from '@/core/store/useWorkspaceStore'

interface LocationDetails {
  aquiferType: string
  tiefe_m: number
  tGW_celsius: number
  maechtig_m: number
  kf_ms: number
  tds_mgl: number
  potential: 'sehr hoch' | 'hoch' | 'mittel' | 'gering'
  erlaeuterung: string
}

const POTENTIAL_COLOR = {
  'sehr hoch': '#16a34a',
  'hoch':      '#d97706',
  'mittel':    '#64748b',
  'gering':    '#94a3b8',
}

function fmt(n: number, decimals = 0) {
  return n.toLocaleString('de-DE', { maximumFractionDigits: decimals })
}

function fmtKf(kf: number) {
  if (kf >= 1e-3) return `${(kf * 1000).toFixed(1)} × 10⁻³ m/s`
  if (kf >= 1e-4) return `${(kf * 10000).toFixed(1)} × 10⁻⁴ m/s`
  if (kf >= 1e-5) return `${(kf * 100000).toFixed(1)} × 10⁻⁵ m/s`
  return `${kf.toExponential(1)} m/s`
}

export default function LocationInspectorPanel() {
  const router = useRouter()
  const clickedPoint = useGpaStore(s => s.clickedPoint)
  const setClickedPoint = useGpaStore(s => s.setClickedPoint)
  const saveLocation = useWorkspaceStore(s => s.saveLocation)
  const setLocationPreset = useWorkspaceStore(s => s.setLocationPreset)

  const [details, setDetails] = useState<LocationDetails | null>(null)
  const [placeName, setPlaceName] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!clickedPoint) {
      setDetails(null)
      setPlaceName('')
      setSaved(false)
      return
    }

    setDetails(null)
    setPlaceName('')
    setSaved(false)
    setLoading(true)

    // Abort vorherige Anfrage
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    const { lat, lng } = clickedPoint

    // 1. Reverse Geocoding (Nominatim, kein API-Key nötig)
    async function fetchDetails() {
      let name = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`
      try {
        const geo = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=de`,
          { signal: ctrl.signal },
        )
        if (geo.ok) {
          const geoJson = await geo.json()
          const a = geoJson.address ?? {}
          name = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? name
          if (a.state && name !== a.state) name = `${name}, ${a.state}`
        }
      } catch { /* Nominatim-Fehler ignorieren */ }

      if (ctrl.signal.aborted) return
      setPlaceName(name)

      // 2. KI-Analyse
      try {
        const res = await fetch('/api/ai/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng, placeName: name }),
          signal: ctrl.signal,
        })
        if (!res.ok) throw new Error('API-Fehler')
        const data: LocationDetails = await res.json()
        if (!ctrl.signal.aborted) setDetails(data)
      } catch (err) {
        if (!ctrl.signal.aborted) setDetails(null)
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    }

    fetchDetails()
    return () => ctrl.abort()
  }, [clickedPoint])

  if (!clickedPoint) return null

  const { lat, lng } = clickedPoint

  function handleSave() {
    if (!details) return
    saveLocation({
      name: placeName || `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
      lat,
      lng,
      aquiferType: details.aquiferType,
      tiefe_m: details.tiefe_m,
      tGW_celsius: details.tGW_celsius,
      maechtig_m: details.maechtig_m,
      kf_ms: details.kf_ms,
      tds_mgl: details.tds_mgl,
      potential: details.potential,
      erlaeuterung: details.erlaeuterung,
    })
    setSaved(true)
  }

  function handleDeltaT() {
    setLocationPreset({
      name: placeName || `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
      lat,
      lng,
      aquifer: details ? {
        tiefe:   details.tiefe_m,
        maechtig: details.maechtig_m,
        kf:      details.kf_ms,
        tGW:     details.tGW_celsius,
        tds:     details.tds_mgl,
      } : undefined,
    })
    router.push('/deltat')
  }

  const potColor = details ? (POTENTIAL_COLOR[details.potential] ?? '#64748b') : '#64748b'

  return (
    <div id="loc-inspector">
      {/* Header */}
      <div id="loc-inspector-hdr">
        <div id="loc-inspector-name">
          📍 {placeName || `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`}
        </div>
        <button id="loc-inspector-close" onClick={() => setClickedPoint(null)} title="Schließen">×</button>
      </div>

      {/* Koordinaten */}
      <div id="loc-inspector-coords">
        {lat.toFixed(5)}°N · {lng.toFixed(5)}°E
      </div>

      {/* Inhalt */}
      {loading && (
        <div id="loc-inspector-loading">
          <span className="loc-spinner" />
          KI analysiert Geologie…
        </div>
      )}

      {!loading && !details && (
        <div id="loc-inspector-error">Analyse nicht verfügbar</div>
      )}

      {details && (
        <>
          {/* Potenzial-Badge */}
          <div id="loc-inspector-potential" style={{ color: potColor, borderColor: potColor }}>
            {details.potential}
          </div>

          {/* Aquifer */}
          <div id="loc-inspector-aquifer">{details.aquiferType}</div>

          {/* Parameter-Grid */}
          <div id="loc-inspector-grid">
            <div className="loc-param">
              <span className="loc-param-label">Tiefe</span>
              <span className="loc-param-value">{fmt(details.tiefe_m)} m</span>
            </div>
            <div className="loc-param">
              <span className="loc-param-label">T Grundwasser</span>
              <span className="loc-param-value">{details.tGW_celsius.toFixed(1)} °C</span>
            </div>
            <div className="loc-param">
              <span className="loc-param-label">Mächtigkeit</span>
              <span className="loc-param-value">{fmt(details.maechtig_m)} m</span>
            </div>
            <div className="loc-param">
              <span className="loc-param-label">k<sub>f</sub></span>
              <span className="loc-param-value">{fmtKf(details.kf_ms)}</span>
            </div>
            <div className="loc-param">
              <span className="loc-param-label">TDS</span>
              <span className="loc-param-value">{fmt(details.tds_mgl)} mg/l</span>
            </div>
          </div>

          {/* Erläuterung */}
          <div id="loc-inspector-explanation">{details.erlaeuterung}</div>

          {/* Disclaimer */}
          <div id="loc-inspector-disclaimer">
            ⚠ KI-Schätzung — kein Ersatz für ein Standortgutachten
          </div>

          {/* Aktionen */}
          <div id="loc-inspector-actions">
            <button
              className="loc-action-btn loc-action-save"
              onClick={handleSave}
              disabled={saved}
            >
              {saved ? '✓ Gespeichert' : '📌 Ort speichern'}
            </button>
            <button
              className="loc-action-btn loc-action-deltat"
              onClick={handleDeltaT}
            >
              ⟶ DeltaT
            </button>
          </div>
        </>
      )}
    </div>
  )
}
