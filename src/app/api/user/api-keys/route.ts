/**
 * /api/user/api-keys — CRUD für BYOK-API-Schlüssel
 *
 * GET  → Liste der gespeicherten Keys (nur Hints, nie Klartext)
 * POST → Key verschlüsseln und speichern (upsert per provider)
 * DELETE → Key deaktivieren (soft-delete via is_active = false)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptApiKey, maskApiKey, isEncryptionConfigured } from '@/lib/crypto/apiKeyEncryption'
import { z } from 'zod'

const SaveKeySchema = z.object({
  provider: z.enum(['anthropic', 'openai', 'azure_openai', 'perplexity']),
  api_key: z.string().min(10, 'API-Key zu kurz'),
  azure_endpoint: z.string().url('Ungültige Azure-Endpoint-URL').optional().or(z.literal('')),
})

const DeleteKeySchema = z.object({
  provider: z.enum(['anthropic', 'openai', 'azure_openai', 'perplexity']),
})

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { user: null, supabase }
  return { user, supabase }
}

// GET /api/user/api-keys — Alle gespeicherten Keys (nur Hints) abrufen
export async function GET() {
  const { user, supabase } = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('user_api_keys')
    .select('id, provider, key_hint, azure_endpoint, is_active, created_at, updated_at')
    .eq('user_id', user.id)
    .order('provider')

  if (error) {
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 })
  }

  return NextResponse.json({ keys: data ?? [] })
}

// POST /api/user/api-keys — Key verschlüsseln und speichern (upsert)
export async function POST(req: NextRequest) {
  if (!isEncryptionConfigured()) {
    return NextResponse.json(
      { error: 'Verschlüsselung nicht konfiguriert (API_KEY_ENCRYPTION_SECRET fehlt)' },
      { status: 503 },
    )
  }

  const { user, supabase } = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiger JSON-Body' }, { status: 400 })
  }

  const parsed = SaveKeySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe' },
      { status: 400 },
    )
  }

  const { provider, api_key, azure_endpoint } = parsed.data

  // Key verschlüsseln (läuft server-seitig, Klartext verlässt diesen Handler nie)
  let key_encrypted: string
  try {
    key_encrypted = encryptApiKey(api_key)
  } catch {
    return NextResponse.json({ error: 'Verschlüsselung fehlgeschlagen' }, { status: 500 })
  }

  const key_hint = maskApiKey(api_key)

  const { error } = await supabase
    .from('user_api_keys')
    .upsert(
      {
        user_id: user.id,
        provider,
        key_hint,
        key_encrypted,
        azure_endpoint: azure_endpoint || null,
        is_active: true,
      },
      { onConflict: 'user_id,provider' },
    )

  if (error) {
    return NextResponse.json({ error: 'Speichern fehlgeschlagen' }, { status: 500 })
  }

  return NextResponse.json({ success: true, key_hint })
}

// DELETE /api/user/api-keys — Key deaktivieren
export async function DELETE(req: NextRequest) {
  const { user, supabase } = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiger JSON-Body' }, { status: 400 })
  }

  const parsed = DeleteKeySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültiger Provider' }, { status: 400 })
  }

  const { error } = await supabase
    .from('user_api_keys')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', parsed.data.provider)

  if (error) {
    return NextResponse.json({ error: 'Löschen fehlgeschlagen' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
