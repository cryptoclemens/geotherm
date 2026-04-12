// @ts-nocheck
import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import L from 'leaflet'
import { getMapInstance } from '../../lib/mapInstance'

let searchMarker = null

async function fetchPlaces(q) {
  if (!q || q.length < 2) return []
  const url = 'https://nominatim.openstreetmap.org/search'
    + '?q=' + encodeURIComponent(q)
    + '&format=json&limit=6&addressdetails=1&accept-language=de&countrycodes=de,at,ch,nl,be,pl'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Nominatim: ${res.status}`)
  return res.json()
}

export default function Ortssuche() {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const [debouncedQ, setDebouncedQ] = useState('')
  const inputRef = useRef(null)
  const dropRef  = useRef(null)

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 380)
    return () => clearTimeout(t)
  }, [query])

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['nominatim', debouncedQ],
    queryFn:  () => fetchPlaces(debouncedQ),
    enabled:  debouncedQ.length >= 2,
  })

  useEffect(() => {
    setOpen(debouncedQ.length >= 2)
  }, [results, debouncedQ])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!inputRef.current?.contains(e.target) && !dropRef.current?.contains(e.target))
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function flyTo(d) {
    setOpen(false)
    const a    = d.address || {}
    const name = a.city || a.town || a.village || a.hamlet || d.display_name.split(',')[0]
    const region = [a.state, a.country].filter(Boolean).join(', ')
    const type   = d.type || d.class || ''
    setQuery(name)

    const map = getMapInstance()
    if (!map) return
    const ll   = [parseFloat(d.lat), parseFloat(d.lon)]
    const zoom = type === 'city' ? 12 : type === 'town' ? 13 : 14

    if (searchMarker) { map.removeLayer(searchMarker); searchMarker = null }

    const popup = `
      <div style="font-family:-apple-system,sans-serif;min-width:170px">
        <div style="font-size:14px;font-weight:700;color:#0d1f38;margin-bottom:3px">📍 ${name}</div>
        ${region ? `<div style="font-size:11px;color:#555">${region}</div>` : ''}
        ${type   ? `<div style="font-size:10px;color:#888;text-transform:capitalize">${type}</div>` : ''}
        <div style="font-size:10px;color:#777;border-top:1px solid #eee;margin-top:5px;padding-top:4px">
          ${parseFloat(d.lat).toFixed(5)}° N, ${parseFloat(d.lon).toFixed(5)}° E
        </div>
      </div>`

    const icon = L.divIcon({
      html: '<div style="font-size:22px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))">📍</div>',
      className: '',
      iconSize: [22, 22],
      iconAnchor: [11, 22],
      popupAnchor: [0, -24],
    })
    searchMarker = L.marker(ll, { icon }).addTo(map).bindPopup(popup, { maxWidth: 260 }).openPopup()
    map.flyTo(ll, zoom, { duration: 0.9 })
  }

  return (
    <div style={{ padding:'6px 12px 8px', borderBottom:'1px solid var(--border)', position:'relative' }}>
      {/* Input with icon */}
      <div style={{ position:'relative' }}>
        <span style={{
          position:'absolute', left:8, top:'50%', transform:'translateY(-50%)',
          color:'var(--accent)', fontSize:12, pointerEvents:'none', lineHeight:1,
          zIndex:1,
        }}>🔍</span>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          onKeyDown={e => e.key === 'Escape' && setOpen(false)}
          placeholder="Ort suchen…"
          autoComplete="off"
          style={{
            display:'block', width:'100%', boxSizing:'border-box',
            background:'rgba(255,255,255,0.05)',
            border:'1px solid var(--border)', borderRadius:6,
            paddingLeft:26, paddingRight: isFetching ? 28 : 8,
            paddingTop:5, paddingBottom:5,
            color:'var(--text)', fontSize:12,
            outline:'none',
          }}
        />
        {isFetching && (
          <span style={{
            position:'absolute', right:8, top:'50%', transform:'translateY(-50%)',
            fontSize:10, color:'var(--muted)', animation:'pulse 1s infinite'
          }}>···</span>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          ref={dropRef}
          style={{
            position:'absolute', left:12, right:12, top:'100%', marginTop:4,
            zIndex:9999, background:'#0f1d35',
            border:'1px solid rgba(91,175,214,0.3)', borderRadius:6,
            boxShadow:'0 8px 24px rgba(0,0,0,0.4)',
            overflowY:'auto', maxHeight:240,
          }}
        >
          {results.length === 0 && !isFetching && (
            <div style={{ padding:'8px 12px', fontSize:11, color:'var(--muted)', fontStyle:'italic' }}>
              Kein Ergebnis
            </div>
          )}
          {results.map((d, i) => {
            const a    = d.address || {}
            const name = a.city || a.town || a.village || a.hamlet || d.display_name.split(',')[0]
            const sub  = [a.state, a.country].filter(Boolean).join(', ')
            return (
              <button
                key={i}
                onMouseDown={() => flyTo(d)}
                style={{
                  display:'block', width:'100%', textAlign:'left',
                  padding:'7px 12px', background:'none', border:'none',
                  borderBottom:'1px solid var(--border)', cursor:'pointer',
                  transition:'background .1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(91,175,214,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background='none'}
              >
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{name}</div>
                <div style={{ fontSize:10, color:'var(--muted)' }}>{sub}</div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
