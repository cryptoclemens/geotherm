import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
]

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  let query: string
  try {
    const body = await req.json() as { query?: unknown }
    if (typeof body.query !== 'string' || !body.query) {
      return NextResponse.json({ error: 'missing query' }, { status: 400 })
    }
    query = body.query
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  for (const endpoint of ENDPOINTS) {
    try {
      const upstream = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(30_000),
      })

      const text = await upstream.text()
      let data: unknown
      try {
        data = JSON.parse(text)
      } catch {
        // Non-JSON response (HTML error page) — try next endpoint
        continue
      }

      return NextResponse.json(data, {
        status: upstream.ok ? 200 : upstream.status,
        headers: { 'Cache-Control': 'public, max-age=1800' },
      })
    } catch {
      // Network error or timeout — try next endpoint
    }
  }

  return NextResponse.json({ error: 'all overpass endpoints failed' }, { status: 502 })
}
