import { NextResponse } from 'next/server'

// TODO M2.5: Implementierung
// 1. Auth prüfen (JWT in Cookie)
// 2. Insert in Supabase feedback-Tabelle
// 3. Sync zu feedback.md via GitHub Contents API
// 4. GITHUB_FEEDBACK_TOKEN ist server-only — niemals im Frontend-Bundle!

export async function POST() {
  return NextResponse.json(
    { error: 'Feedback-System wird in M2.5 implementiert' },
    { status: 501 }
  )
}
