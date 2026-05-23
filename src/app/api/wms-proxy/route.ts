import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_HOSTS = [
  'services.bgr.de',
  'www.geotis.de',
  'www.gis-idmz.nrw.de',
  'overpass-api.de',
  'nominatim.openstreetmap.org',
]

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const url = req.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'missing url param' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 })
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return NextResponse.json({ error: 'host not allowed' }, { status: 403 })
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'geotherm/1.0 (+https://geotherm.vencly.com)',
        'Accept': 'image/png,image/*,*/*',
      },
      signal: AbortSignal.timeout(15_000),
    })

    const contentType = upstream.headers.get('content-type') ?? 'image/png'
    const body = await upstream.arrayBuffer()

    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return NextResponse.json({ error: 'upstream fetch failed' }, { status: 502 })
  }
}
