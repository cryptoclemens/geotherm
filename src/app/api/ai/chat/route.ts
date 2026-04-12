import { anthropic } from '@ai-sdk/anthropic'
import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai'
import { z } from 'zod'
import { appendToFeedbackMd } from '@/lib/feedback/github-sync'

const SYSTEM = `Du bist der KI-Assistent der Geotherm-Suite — einer Web-Plattform für geothermische Projektentwicklung.

AUFGABE: Erkenne die Absicht des Nutzers und ruf das passende Tool auf.

TOOLS:
- navigate_to_deltat: Öffnet den DeltaT-Dubletten-Auslegungsrechner (optional mit Parametern vorausgefüllt)
- navigate_to_atlas: Öffnet den Geothermie-Potenzial-Atlas (interaktive Karte Norddeutschland)
- create_feedback: Speichert einen Feature-Wunsch oder Feedback-Eintrag

REGELN:
- Erwähnt der Nutzer Tiefen, Temperaturen, Förderraten oder Wärmeleistung → navigate_to_deltat mit extrahierten Werten
- Geht es um Standorterkundung, Karte oder "wo bohren?" → navigate_to_atlas
- Wünscht sich der Nutzer ein neues Tool, nennt einen Fehler oder gibt Verbesserungsvorschläge → create_feedback
- Antworte immer auf Deutsch, kurz und technisch präzise
- Erkläre kurz was du tust, bevor du das Tool aufrufst

DeltaT-Parameter (alle in SI-Einheiten, alle optional):
tiefe [m] · maechtig [m] · kf [m/s] · tGW [°C] · tds [mg/l]
Q [l/s] · tR [°C] · abstand [m] · zielLeistung [kW]
tVL [°C] · tRL [°C] · laufstunden [h/a] · foerderhoehe [m]`

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
        description: 'Öffnet den Geothermie-Potenzial-Atlas.',
        inputSchema: z.object({
          location: z.string().optional().describe('Ortsname oder Regionsbeschreibung'),
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
