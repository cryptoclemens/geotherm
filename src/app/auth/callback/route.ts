import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Supabase PKCE Auth-Callback — tauscht den Code gegen eine Session
// Wird aufgerufen nach E-Mail-Bestätigung, Password-Reset und OAuth
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Bei Fehler zur Login-Seite mit Fehlermeldung weiterleiten
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
