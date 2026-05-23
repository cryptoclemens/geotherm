import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Geocoding-Proxy — leitet Nominatim-Anfragen server-seitig weiter,
 * damit der korrekte User-Agent gesetzt wird (Nominatim Usage Policy).
 * OpenStreetMap Nominatim: https://nominatim.org/release-docs/develop/api/Search/
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return Response.json({ error: 'missing q' }, { status: 400 })

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', q)
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '1')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('countrycodes', 'de,at,ch')   // DACH-Fokus

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Geotherm/1.0 (geotherm.vencly.com; kontakt@vencly.com)',
        'Accept': 'application/json',
        'Accept-Language': 'de',
      },
      next: { revalidate: 3600 },   // Cache 1h
    })

    if (!res.ok) return Response.json({ error: 'Geocoding-Dienst nicht erreichbar' }, { status: 502 })

    const data = await res.json() as Array<{
      lat: string
      lon: string
      display_name: string
    }>

    if (!data.length) return Response.json({ error: 'Adresse nicht gefunden' }, { status: 404 })

    const { lat, lon, display_name } = data[0]
    return Response.json({
      lat: parseFloat(lat),
      lng: parseFloat(lon),
      display_name,
    })
  } catch {
    return Response.json({ error: 'Geocoding fehlgeschlagen' }, { status: 500 })
  }
}
