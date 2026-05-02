import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
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

  try {
    const upstream = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(30_000),
    })

    const data: unknown = await upstream.json()
    return NextResponse.json(data, {
      status: upstream.status,
      headers: { 'Cache-Control': 'public, max-age=1800' },
    })
  } catch {
    return NextResponse.json({ error: 'overpass fetch failed' }, { status: 502 })
  }
}
