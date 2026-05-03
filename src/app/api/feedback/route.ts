import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { appendToFeedbackMd } from '@/lib/feedback/github-sync'
import { z } from 'zod'

const schema = z.object({
  inApp: z.enum(['allgemein', 'gpa', 'deltat', 'bohrkost', 'docs']),
  category: z.enum(['bug', 'ui-design', 'feature-wunsch', 'performance', 'datenqualitaet', 'sonstiges']),
  stars: z.number().int().min(1).max(5).nullable(),
  message: z.string().min(5).max(2000),
  consent: z.boolean().refine(v => v, 'Consent erforderlich'),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { inApp, category, stars, message } = parsed.data
  const timestamp = new Date().toISOString()
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev'
  const userAgent = request.headers.get('user-agent') ?? 'unbekannt'

  // 1. In Supabase einfügen
  const { error: dbError } = await supabase
    .from('feedback')
    .insert({
      user_id: user.id,
      email: user.email,
      in_app: inApp,
      category,
      stars,
      message,
      app_version: version,
      user_agent: userAgent,
      github_synced: false,
    })

  if (dbError) {
    return NextResponse.json({ error: 'DB-Fehler' }, { status: 500 })
  }

  // 2. Async in feedback.md syncen (kein Fehler wenn es scheitert)
  const synced = await appendToFeedbackMd({
    timestamp,
    inApp,
    category,
    stars,
    message,
    email: user.email ?? '',
    version,
    userAgent,
  })

  if (synced) {
    await supabase
      .from('feedback')
      .update({ github_synced: true })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
  }

  return NextResponse.json({ ok: true })
}
