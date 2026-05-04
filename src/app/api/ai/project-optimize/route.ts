/**
 * /api/ai/project-optimize — KI-gestützte Optimierungsvorschläge für Geothermie-Projekte
 *
 * Nimmt Projektdaten mit aktuellen DeltaT-Parametern und gibt konkrete
 * Optimierungsvorschläge zurück. Nutzt Haiku für schnelle Antwort.
 */
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import type { AiSuggestion } from '@/core/api/projects'
import { getUserAiModel } from '@/lib/ai/getUserAiModel'

const OptimizationSchema = z.object({
  suggestions: z.array(z.object({
    param: z.string().describe('Parametername, z.B. "tiefe", "Q", "maechtig"'),
    currentValue: z.union([z.number(), z.string()]).nullable().describe('Aktueller Wert'),
    suggestedValue: z.union([z.number(), z.string()]).describe('Empfohlener Wert'),
    rationale: z.string().describe('Kurze Begründung (1–2 Sätze) warum diese Änderung sinnvoll ist'),
    confidence: z.enum(['hoch', 'mittel', 'gering']).describe('Konfidenz der Empfehlung'),
  })).min(1).max(6),
  generalNotes: z.string().describe('Allgemeine Einschätzung und übergeordnete Empfehlungen (2–3 Sätze)'),
})

const SYSTEM = `Du bist ein erfahrener Hydrogeologe und Geothermie-Ingenieur mit fundiertem Kenntnisstand des DeltaT-Formelwerks (VDI 4640, DVGW W 115, Drost 1978, Arpagaus 2018).

Deine Aufgabe: Analysiere die Parameter eines Geothermie-Projekts und gib konkrete, wissenschaftlich fundierte Optimierungsvorschläge.

DeltaT-Parameter und typische Wertebereiche:
- tiefe [m]: Bohrtiefe bis Aquifer-Oberkante, typisch 200–2000 m
- maechtig [m]: Aquifer-Mächtigkeit, typisch 10–200 m
- kf [m/s]: Hydraulische Leitfähigkeit, typisch 1e-5 bis 1e-2 m/s
- tGW [°C]: Grundwassertemperatur, typisch 10–80 °C
- tds [mg/l]: Mineralisation, typisch 200–50000 mg/l
- Q [l/s]: Förderrate, typisch 5–100 l/s
- zielLeistung [kW]: Ziel-Wärmeleistung, typisch 50–5000 kW

Berücksichtige: Thermischen Durchbruch, Materialklasse (Korrosion bei TDS), Transmissivität, WP-Effizienz.
Antworte auf Deutsch.`

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'KI nicht konfiguriert' }, { status: 503 })
  }

  let body: {
    project_id: string
    project_name: string
    project_type?: string | null
    current_params: Record<string, number>
    optimization_goal?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }

  const { project_id, project_name, project_type, current_params, optimization_goal } = body

  const userPrompt = `Projekt: "${project_name}" (Typ: ${project_type ?? 'unbekannt'})
Aktuelle Parameter: ${JSON.stringify(current_params, null, 2)}
${optimization_goal ? `Optimierungsziel: ${optimization_goal}` : ''}

Bitte analysiere die Parameter und gib 3–5 konkrete Optimierungsvorschläge.`

  const model = await getUserAiModel('claude-haiku-4-5-20251001', 'anthropic')

  try {
    const { object } = await generateObject({
      model,
      system: SYSTEM,
      prompt: userPrompt,
      schema: OptimizationSchema,
    })

    const suggestion: AiSuggestion = {
      id: `${project_id}-${Date.now()}`,
      projectId: project_id,
      createdAt: new Date().toISOString(),
      promptSummary: optimization_goal ?? `Optimierung für "${project_name}"`,
      suggestions: object.suggestions,
      generalNotes: object.generalNotes,
    }

    return NextResponse.json(suggestion)
  } catch (err) {
    console.error('project-optimize error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'KI-Fehler' },
      { status: 500 },
    )
  }
}
