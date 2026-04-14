// @ts-nocheck
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/core/store/useWorkspaceStore'
import { useProjectStore } from '@/core/store/useProjectStore'
import { DEFAULT_INPUTS } from '@/apps/deltat/calc/system'
import { getMapInstance } from '../../lib/mapInstance'

const POTENTIAL_COLOR = {
  'sehr hoch': '#16a34a',
  'hoch':      '#d97706',
  'mittel':    '#64748b',
  'gering':    '#94a3b8',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(iso))
}

function fmt(n: number, d = 0) {
  return n.toLocaleString('de-DE', { maximumFractionDigits: d })
}

export default function SavedLocationsTab() {
  const router = useRouter()
  const savedLocations  = useWorkspaceStore(s => s.savedLocations)
  const deleteLocation  = useWorkspaceStore(s => s.deleteLocation)
  const setLocationPreset = useWorkspaceStore(s => s.setLocationPreset)
  const createProject   = useProjectStore(s => s.createProject)

  const [savingId, setSavingId] = useState(null)
  const [savedId,  setSavedId]  = useState(null)
  const [errorId,  setErrorId]  = useState(null)

  function handleFly(loc) {
    const map = getMapInstance()
    if (map) map.flyTo([loc.lat, loc.lng], 12, { duration: 1.5, animate: true })
  }

  async function handleSaveToProject(loc) {
    setSavingId(loc.id)
    try {
      const deltat_input = {
        ...DEFAULT_INPUTS,
        ...(loc.tiefe_m     != null && { tiefe:    loc.tiefe_m }),
        ...(loc.tGW_celsius != null && { tGW:      loc.tGW_celsius }),
        ...(loc.maechtig_m  != null && { maechtig: loc.maechtig_m }),
        ...(loc.kf_ms       != null && { kf:       loc.kf_ms }),
        ...(loc.tds_mgl     != null && { tds:      loc.tds_mgl }),
      }
      await createProject({
        name:     loc.name,
        location: { name: loc.name, lat: loc.lat, lng: loc.lng },
        deltat_input,
        geological_data: {
          aquiferType: loc.aquiferType,
          tiefe_m:     loc.tiefe_m,
          tGW_celsius: loc.tGW_celsius,
          maechtig_m:  loc.maechtig_m,
          kf_ms:       loc.kf_ms,
          tds_mgl:     loc.tds_mgl,
          potential:   loc.potential,
          notes:       loc.erlaeuterung,
        },
      })
      setSavedId(loc.id)
      setTimeout(() => setSavedId(null), 2500)
    } catch (err) {
      if (err?.message === 'Nicht angemeldet') {
        router.push('/login')
      } else {
        setErrorId(loc.id)
        setTimeout(() => setErrorId(null), 3000)
      }
    } finally {
      setSavingId(null)
    }
  }

  function handleDeltaT(loc) {
    setLocationPreset({
      name: loc.name,
      lat: loc.lat,
      lng: loc.lng,
      aquifer: {
        tiefe:    loc.tiefe_m,
        maechtig: loc.maechtig_m,
        kf:       loc.kf_ms,
        tGW:      loc.tGW_celsius,
        tds:      loc.tds_mgl,
      },
    })
    router.push('/deltat')
  }

  if (savedLocations.length === 0) {
    return (
      <div id="saved-locs-empty">
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📍</div>
        <div>Noch keine gespeicherten Orte.</div>
        <div style={{ marginTop: '0.5rem', opacity: 0.6, fontSize: '0.8rem' }}>
          Klicke auf einen beliebigen Punkt auf der Karte<br />und wähle „Ort speichern".
        </div>
      </div>
    )
  }

  return (
    <div id="saved-locs-list">
      {savedLocations.map(loc => {
        const color = POTENTIAL_COLOR[loc.potential ?? 'mittel'] ?? '#64748b'
        return (
          <div key={loc.id} className="saved-loc-card">
            <div className="saved-loc-header" onClick={() => handleFly(loc)}>
              <div className="saved-loc-meta">
                <div className="saved-loc-name">📍 {loc.name}</div>
                <div className="saved-loc-sub">
                  {loc.aquiferType ?? '—'} · {loc.tiefe_m ? `${fmt(loc.tiefe_m)} m` : '—'} · {formatDate(loc.savedAt)}
                </div>
              </div>
              {loc.potential && (
                <span className="saved-loc-badge" style={{ color, borderColor: color }}>
                  {loc.potential}
                </span>
              )}
            </div>

            {/* Parameter-Zeile */}
            {(loc.tGW_celsius || loc.maechtig_m || loc.tds_mgl) && (
              <div className="saved-loc-params">
                {loc.tGW_celsius && <span>{loc.tGW_celsius.toFixed(1)} °C</span>}
                {loc.maechtig_m && <span>{fmt(loc.maechtig_m)} m Mächtigkeit</span>}
                {loc.tds_mgl && <span>{fmt(loc.tds_mgl)} mg/l TDS</span>}
              </div>
            )}

            {/* Aktionen */}
            <div className="saved-loc-actions">
              <button className="saved-loc-btn saved-loc-karte" onClick={() => handleFly(loc)}>
                Karte
              </button>
              <button className="saved-loc-btn saved-loc-deltat" onClick={() => handleDeltaT(loc)}>
                ⟶ DeltaT
              </button>
              <button
                className={`saved-loc-btn saved-loc-projekt${savedId === loc.id ? ' saved-loc-projekt--saved' : ''}`}
                onClick={() => handleSaveToProject(loc)}
                disabled={savingId === loc.id}
                title="Als Projekt speichern"
              >
                {savingId === loc.id ? '…'
                  : savedId === loc.id ? '✓ Projekt'
                  : errorId === loc.id ? 'Fehler'
                  : '→ Projekte'}
              </button>
              <button
                className="saved-loc-btn saved-loc-del"
                onClick={() => deleteLocation(loc.id)}
                title="Ort löschen"
              >×</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
