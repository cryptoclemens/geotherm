import { anthropic } from '@ai-sdk/anthropic'
import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai'
import { z } from 'zod'
import { appendToFeedbackMd } from '@/lib/feedback/github-sync'

const SYSTEM = `Du bist der KI-Assistent der Geotherm-Suite — einer Web-Plattform für geothermische Projektentwicklung.

AUFGABE: Erkenne die Absicht des Nutzers und ruf das passende Tool auf.

TOOLS:
- navigate_to_deltat: Öffnet den DeltaT-Dubletten-Auslegungsrechner (optional mit Parametern vorausgefüllt)
- navigate_to_atlas: Öffnet den Geothermie-Potenzial-Atlas (interaktive Karte)
- show_geothermal_spots: Zeigt eine Liste geothermischer Standort-Empfehlungen im Chat und markiert sie auf der Karte
- create_feedback: Speichert einen Feature-Wunsch oder Feedback-Eintrag

REGELN:
- Erwähnt der Nutzer Tiefen, Temperaturen, Förderraten oder Wärmeleistung → navigate_to_deltat mit extrahierten Werten
- Fragt der Nutzer nach Top-Standorten, besten Erkundungsgebieten oder "wo bohren?" mit Kriterien (Tiefe, Aquifer, Region, Potenzial) → show_geothermal_spots mit 5–8 Einträgen
- Geht es nur allgemein um die Karte (ohne Standort-Empfehlung) → navigate_to_atlas
- Wünscht sich der Nutzer ein neues Tool, nennt einen Fehler oder gibt Verbesserungsvorschläge → create_feedback
- Antworte immer auf Deutsch, kurz und technisch präzise
- Erkläre kurz was du tust, bevor du das Tool aufrufst

DeltaT-Parameter (alle in SI-Einheiten, alle optional):
tiefe [m] · maechtig [m] · kf [m/s] · tGW [°C] · tds [mg/l]
Q [l/s] · tR [°C] · abstand [m] · zielLeistung [kW]
tVL [°C] · tRL [°C] · laufstunden [h/a] · foerderhoehe [m]

Für show_geothermal_spots: lat/lng immer als dezimale WGS84-Koordinaten (Deutschland: lat 47–55, lng 6–15).
Potenzial-Skala: "sehr hoch" (T > 15°C Überschuss + sehr gute Transmissivität), "hoch" (gute Bedingungen), "mittel" (ausreichend aber mit Einschränkungen).`

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'KI nicht konfiguriert' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { messages } = await req.json()

  // AI SDK v6: inputSchema statt parameters, convertToModelMessages ist async
  const result = streamText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system: SYSTEM,
    messages: await convertToModelMessages(messages),
    tools: {
      // Kein execute → Client-Side Tool: onToolCall im Browser übernimmt Navigation
      navigate_to_deltat: tool({
        description: 'Navigiert zum DeltaT-Rechner, optional mit vorausgefüllten Aquifer-Parametern.',
        inputSchema: z.object({
          tiefe:        z.number().optional().describe('Bohrtiefe [m]'),
          maechtig:     z.number().optional().describe('Aquifer-Mächtigkeit [m]'),
          kf:           z.number().optional().describe('Hydraulische Leitfähigkeit [m/s]'),
          tGW:          z.number().optional().describe('Grundwassertemperatur [°C]'),
          tds:          z.number().optional().describe('Mineralisation TDS [mg/l]'),
          Q:            z.number().optional().describe('Förderrate [l/s]'),
          tR:           z.number().optional().describe('Reinjektionstemperatur [°C]'),
          abstand:      z.number().optional().describe('Bohrlochabstand [m]'),
          zielLeistung: z.number().optional().describe('Ziel-Wärmeleistung [kW]'),
          tVL:          z.number().optional().describe('Vorlauftemperatur Wärmenetz [°C]'),
          tRL:          z.number().optional().describe('Rücklauftemperatur Wärmenetz [°C]'),
          laufstunden:  z.number().optional().describe('Laufstunden pro Jahr [h/a]'),
          foerderhoehe: z.number().optional().describe('Förderhöhe Tauchpumpe [m]'),
        }),
      }),
      navigate_to_atlas: tool({
        description: 'Öffnet den Geothermie-Potenzial-Atlas ohne Standort-Empfehlungen.',
        inputSchema: z.object({
          location: z.string().optional().describe('Ortsname oder Regionsbeschreibung'),
        }),
      }),
      // Kein execute → Client-Side Tool: AiDialog rendert die Spots-Liste
      show_geothermal_spots: tool({
        description: 'Zeigt eine Liste geothermischer Standort-Empfehlungen im Chat und markiert sie auf der Atlas-Karte. Nutze dieses Tool wenn der Nutzer nach Top-Spots, besten Erkundungsorten oder konkreten Bohrempfehlungen fragt.',
        inputSchema: z.object({
          spots: z.array(z.object({
            name:        z.string().describe('Standortname oder Region, z.B. "Münchner Becken Süd"'),
            lat:         z.number().describe('Breitengrad WGS84 (Deutschland: 47–55)'),
            lng:         z.number().describe('Längengrad WGS84 (Deutschland: 6–15)'),
            aquifer:     z.string().describe('Aquifer-Formation, z.B. "Malmkarst" oder "Rhaetium"'),
            depth:       z.string().describe('Typische Bohrtiefe, z.B. "800–1.500 m"'),
            temperature: z.string().describe('Grundwassertemperatur, z.B. "28–42 °C"'),
            potential:   z.enum(['sehr hoch', 'hoch', 'mittel']),
            explanation: z.string().describe('2–3 Sätze: Warum dieser Spot geeignet ist, welche Bedingungen ihn auszeichnen und was zu beachten ist.'),
          })).min(1).max(8),
          query_context: z.string().describe('Kurze Zusammenfassung der Suchanfrage in einem Satz, z.B. "Top-5 Spots für mitteltiefe Exploration im Lockergestein in NRW"'),
        }),
      }),
      // Mit execute → Server-Side Tool: läuft im API-Handler, Ergebnis wird an KI zurückgegeben
      create_feedback: tool({
        description: 'Speichert einen Feature-Wunsch, Verbesserungsvorschlag oder Bug-Bericht.',
        inputSchema: z.object({
          title:    z.string().describe('Kurzer Titel des Eintrags'),
          message:  z.string().describe('Detaillierte Beschreibung'),
          category: z.enum(['feature-request', 'improvement', 'bug']).describe('Kategorie'),
        }),
        execute: async ({ title, message, category }) => {
          const success = await appendToFeedbackMd({
            timestamp: new Date().toISOString(),
            inApp: 'dashboard-ki',
            category,
            stars: null,
            message: `**${title}**\n\n${message}`,
            email: 'ki-dialog@geotherm',
            version: process.env.NEXT_PUBLIC_GIT_SHA ?? 'unknown',
            userAgent: 'Geotherm-KI-Dialog',
          })
          return { success, message: success ? 'Feedback gespeichert.' : 'Fehler beim Speichern.' }
        },
      }),
    },
    stopWhen: stepCountIs(3),
  })

  return result.toUIMessageStreamResponse()
}
