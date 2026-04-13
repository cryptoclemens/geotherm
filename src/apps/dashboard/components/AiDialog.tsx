'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { useRouter } from 'next/navigation'
import { BotIcon, SendIcon, Trash2Icon, MapPinIcon } from 'lucide-react'
import { useDeltaTStore } from '@/apps/deltat/store/useDeltaTStore'
import type { DeltaTInputs } from '@/apps/deltat/calc/system'
import { useWorkspaceStore } from '@/core/store/useWorkspaceStore'
import type { GeoSpot } from '@/core/store/useWorkspaceStore'

const STORAGE_KEY = 'ai-dialog-history'

// Starters — zeigen bevor der Nutzer schreibt
const STARTERS = [
  'Standort München, 600 m Tiefe, Grundwasser 22 °C',
  'Dublette für 500 kW Wärme auslegen',
  'Atlas für Norddeutschland öffnen',
  'Ich wünsche mir eine Wirtschaftlichkeitsrechnung',
]

// Beschriftung für einfache Tool-Aufrufe im Chat
const TOOL_LABELS: Record<string, string> = {
  navigate_to_deltat: '⟶ Öffne DeltaT-Rechner…',
  navigate_to_atlas:  '⟶ Öffne Atlas…',
  create_feedback:    '✓ Feedback gespeichert',
}

function potentialStyle(p: string): { color: string; bg: string } {
  if (p === 'sehr hoch') return { color: '#16a34a', bg: 'rgba(22,163,74,0.10)' }
  if (p === 'hoch')      return { color: '#b45309', bg: 'rgba(180,83,9,0.10)' }
  return                        { color: '#475569', bg: 'rgba(71,85,105,0.10)' }
}

interface GeoSpotsCardProps {
  spots: GeoSpot[]
  queryContext: string
  onNavigate: () => void
}

function GeoSpotsCard({ spots, queryContext, onNavigate }: GeoSpotsCardProps) {
  return (
    <div className="mt-1.5 flex flex-col gap-1.5">
      <p className="text-[11px] text-muted-foreground italic">{queryContext}</p>
      {spots.map((spot, i) => {
        const { color, bg } = potentialStyle(spot.potential)
        return (
          <div key={i} className="flex items-start gap-2 text-xs border border-border/40 rounded-lg px-2.5 py-2 bg-background/60">
            <span
              className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
              style={{ background: bg, color }}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground leading-tight">{spot.name}</div>
              <div className="text-muted-foreground text-[11px] mt-0.5">{spot.aquifer} · {spot.depth} · {spot.temperature}</div>
            </div>
            <span
              className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-md whitespace-nowrap"
              style={{ color, background: bg }}
            >
              {spot.potential}
            </span>
          </div>
        )
      })}
      <button
        onClick={onNavigate}
        className="mt-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
      >
        <MapPinIcon className="w-3.5 h-3.5" />
        Auf Karte anzeigen
      </button>
    </div>
  )
}

const WELCOME_MESSAGE: UIMessage = {
  id: 'welcome',
  role: 'assistant',
  parts: [{
    type: 'text',
    text: 'Wie kann ich dir helfen? Nenn mir Standort oder Projektparameter — ich öffne den richtigen Rechner. Oder sag mir, welches Tool du dir noch wünschst.',
  }],
}

function loadHistory(): UIMessage[] {
  if (typeof window === 'undefined') return [WELCOME_MESSAGE]
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [WELCOME_MESSAGE]
    const parsed = JSON.parse(raw) as UIMessage[]
    return parsed.length > 0 ? parsed : [WELCOME_MESSAGE]
  } catch {
    return [WELCOME_MESSAGE]
  }
}

function saveHistory(msgs: UIMessage[]) {
  try {
    // Nur Text-Messages speichern (keine laufenden Tool-Calls)
    const toSave = msgs.filter(m =>
      m.parts.every(p => p.type === 'text' || (p.type === 'tool-invocation' && (p as unknown as { state: string }).state === 'result'))
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave.slice(-50)))
  } catch { /* QuotaExceededError ignorieren */ }
}

export function AiDialog() {
  const router = useRouter()
  const setInput = useDeltaTStore(s => s.setInput)
  const setGeoSpots = useWorkspaceStore(s => s.setGeoSpots)
  const [text, setText] = useState('')
  const [initialMessages] = useState<UIMessage[]>(loadHistory)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/ai/chat' }),
    messages: initialMessages,
    onToolCall: async ({ toolCall }) => {
      // Cast da UIMessage generisch ohne TOOLS-Param
      const tc = toolCall as unknown as {
        toolName: string
        input: Record<string, unknown>
      }

      if (tc.toolName === 'navigate_to_deltat') {
        const params = tc.input as Partial<DeltaTInputs>
        Object.entries(params).forEach(([key, val]) => {
          if (typeof val === 'number') {
            setInput(key as keyof DeltaTInputs, val)
          }
        })
        setTimeout(() => router.push('/deltat'), 800)
      }

      if (tc.toolName === 'navigate_to_atlas') {
        setTimeout(() => router.push('/atlas'), 800)
      }

      if (tc.toolName === 'show_geothermal_spots') {
        const input = tc.input as { spots: GeoSpot[]; query_context: string }
        setGeoSpots(input.spots ?? [], input.query_context ?? '')
        // Keine automatische Navigation — Nutzer klickt selbst auf "Auf Karte anzeigen"
      }
    },
  })

  // Scroll to bottom + History speichern bei neuen Nachrichten
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    if (status !== 'streaming') saveHistory(messages)
  }, [messages, status])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || status === 'streaming') return
    sendMessage({ text: text.trim() })
    setText('')
  }

  function sendStarter(prompt: string) {
    if (status === 'streaming') return
    sendMessage({ text: prompt })
  }

  function clearHistory() {
    localStorage.removeItem(STORAGE_KEY)
    setMessages([WELCOME_MESSAGE])
  }

  const isStreaming = status === 'streaming'
  const hasUserMessage = messages.some(m => m.role === 'user')

  return (
    <div className="glass-card rounded-2xl flex flex-col overflow-hidden" style={{ height: '360px' }}>
      {/* Header */}
      <div className="shrink-0 flex items-center gap-2.5 px-4 py-2.5 border-b border-border">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
          <BotIcon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        </div>
        <span className="text-sm font-medium text-foreground">Geotherm-Assistent</span>
        {hasUserMessage && !isStreaming && (
          <button
            onClick={clearHistory}
            title="Verlauf löschen"
            className="ml-auto text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            aria-label="Chat-Verlauf löschen"
          >
            <Trash2Icon className="w-3.5 h-3.5" />
          </button>
        )}
        {isStreaming && (
          <div className="ml-auto flex gap-1" role="status" aria-label="Antwort wird generiert" aria-live="polite">
            {[0, 150, 300].map(delay => (
              <span
                key={delay}
                className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
                aria-hidden="true"
              />
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            }`}>
              {msg.parts.map((part, i) => {
                if (part.type === 'text') {
                  return <span key={i}>{part.text}</span>
                }
                if (part.type === 'tool-invocation') {
                  const tp = part as unknown as { toolName: string; state: string; input?: unknown }

                  // Spots-Karte — custom Rendering
                  if (tp.toolName === 'show_geothermal_spots' && (tp.state === 'call' || tp.state === 'result')) {
                    const spotsInput = tp.input as { spots: GeoSpot[]; query_context: string } | undefined
                    if (spotsInput?.spots?.length) {
                      return (
                        <GeoSpotsCard
                          key={i}
                          spots={spotsInput.spots}
                          queryContext={spotsInput.query_context}
                          onNavigate={() => router.push('/atlas')}
                        />
                      )
                    }
                  }

                  const label = TOOL_LABELS[tp.toolName]
                  if (label && (tp.state === 'call' || tp.state === 'result')) {
                    return (
                      <span key={i} className="italic text-muted-foreground text-xs block mt-1" role="status" aria-live="polite">
                        {label}
                      </span>
                    )
                  }
                }
                return null
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Starter chips — nur wenn noch keine Nutzer-Nachricht */}
      {!hasUserMessage && (
        <div className="shrink-0 px-4 pb-2 flex flex-wrap gap-1.5">
          {STARTERS.map(s => (
            <button
              key={s}
              onClick={() => sendStarter(s)}
              disabled={isStreaming}
              className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:border-primary/50 hover:text-primary disabled:opacity-40 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={submit}
        className="shrink-0 flex items-center gap-2 px-4 py-3 border-t border-border"
      >
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Schreib eine Nachricht…"
          disabled={isStreaming}
          aria-label="Nachricht an den Geotherm-Assistenten"
          className="flex-1 bg-muted border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 disabled:opacity-50 transition-colors"
        />
        <button
          type="submit"
          disabled={!text.trim() || isStreaming}
          aria-label="Senden"
          className="shrink-0 w-9 h-9 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center transition-colors"
        >
          <SendIcon className="w-4 h-4 text-primary-foreground" />
        </button>
      </form>
    </div>
  )
}
