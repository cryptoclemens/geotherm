import { NextResponse } from 'next/server'

// Feedback-Endpoint wird in M2.5 implementiert
export async function POST() {
  return NextResponse.json(
    { error: 'Noch nicht implementiert. Folgt in Milestone 2.5.' },
    { status: 501 }
  )
}
