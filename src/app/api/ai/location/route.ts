/**
 * /api/ai/location — KI-gestützte geologische Standortanalyse
 *
 * Nimmt Koordinaten (+ optional Ortsname) und gibt geschätzte
 * hydrogeologische Parameter zurück. Nutzt Haiku für schnelle Antwort.
 */
import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const LocationSchema = z.object({
  aquiferType:  z.string().describe('Aquifer-Typ (z.B. "Mittlerer Buntsandstein", "Oberer Muschelkalk", "Lockergestein-Aquifer")'),
  tiefe_m:      z.number().describe('Geschätzte mittlere Bohrtiefe bis zum Hauptaquifer in Metern'),
  tGW_celsius:  z.number().describe('Geschätzte Grundwassertemperatur in °C'),
  maechtig_m:   z.number().describe('Geschätzte Aquifer-Mächtigkeit in Metern'),
  kf_ms:        z.number().describe('Geschätzter kf-Wert (hydraul. Leitfähigkeit) in m/s'),
  tds_mgl:      z.number().describe('Geschätzter TDS-Wert (Gesamtmineralisation) in mg/l'),
  potential:    z.enum(['sehr hoch', 'hoch', 'mittel', 'gering']).describe('Geothermisches Potenzial'),
  erlaeuterung: z.string().describe('Kurze Erläuterung (2–3 Sätze) zur Geologie und dem geothermischen Potenzial'),
})

const SYSTEM = `Du bist ein Hydrogeologe und Geothermie-Experte.
Gib für einen Standort in Deutschland (Koordinaten + Ortsname) eine fachlich fundierte Schätzung der hydrogeologischen und geothermischen Parameter.

Nutze dein Wissen über:
- Geologische Karten Deutschlands (GÜK250, Hydrogeologische Übersichtskarte)
- Norddeutsches Tiefland (Quartäre Lockergesteine, Sandstein-Aquifere)
- Süddeutschland (Malm-Karst, Buntsandstein, Muschelkalk)
- Rheinland/NRW (Lockergestein-Aquifere, Devon, Karbon)
- Geothermische Tiefenstufe: +3°C pro 100 m Tiefe (mittlere geothermische Tiefenstufe Deutschland)

Alle Werte sind SCHÄTZUNGEN basierend auf der regionalen Geologie — kein Ersatz für Standortgutachten.
Antworte immer auf Deutsch.`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  try {
    const { lat, lng, placeName } = await req.json() as {
      lat: number
      lng: number
      placeName?: string
    }

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'lat/lng required' }, { status: 400 })
    }

    const safePlaceName = placeName ? String(placeName).slice(0, 200) : undefined

    const prompt = `Standort: ${safePlaceName ?? 'Unbekannter Ort'} (${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E)

Bitte schätze die hydrogeologischen Parameter für diesen Standort in Deutschland.`

    const { object } = await generateObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      schema: LocationSchema,
      system: SYSTEM,
      prompt,
    })

    return NextResponse.json(object)
  } catch (err) {
    console.error('[api/ai/location]', err)
    return NextResponse.json({ error: 'Analyse fehlgeschlagen' }, { status: 500 })
  }
}
