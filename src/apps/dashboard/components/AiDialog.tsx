'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { useRouter } from 'next/navigation'
import { BotIcon, SendIcon } from 'lucide-react'
import { useDeltaTStore } from '@/apps/deltat/store/useDeltaTStore'
import type { DeltaTInputs } from '@/apps/deltat/calc/system'

// Starters — zeigen bevor der Nutzer schreibt
const STARTERS = [
  'Standort München, 600 m Tiefe, Grundwasser 22 °C',
  'Dublette für 500 kW Wärme auslegen',
  'Atlas für Norddeutschland öffnen',
  'Ich wünsche mir eine Wirtschaftlichkeitsrechnung',
]

// Beschriftung für Tool-Aufrufe im Chat
const TOOL_LABELS: Record<string, string> = {
  navigate_to_deltat: '⟶ Öffne DeltaT-Rechner…',
  navigate_to_atlas:  '⟶ Öffne Atlas…',
  create_feedback:    '✓ Feedback gespeichert',
}

const INITIAL_MESSAGES: UIMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    parts: [{
      type: 'text',
      text: 'Wie kann ich dir helfen? Nenn mir Standort oder Projektparameter — ich öffne den richtigen Rechner. Oder sag mir, welches Tool du dir noch wünschst.',
    }],
  },
]

export function AiDialog() {
  const router = useRouter()
  const setInput = useDeltaTStore(s => s.setInput)
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/ai/chat' }),
    messages: INITIAL_MESSAGES,
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
    },
  })

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  const isStreaming = status === 'streaming'
  const hasUserMessage = messages.some(m => m.role === 'user')

  return (
    <div className="glass-card rounded-2xl flex flex-col overflow-hidden" style={{ height: '360px' }}>
      {/* Header */}
      <div className="shrink-0 flex items-center gap-2.5 px-4 py-2.5 border-b border-white/[0.08]">
        <div className="w-6 h-6 rounded-full bg-[oklch(0.62_0.14_195/0.25)] flex items-center justify-center">
          <BotIcon className="w-3.5 h-3.5 text-[oklch(0.72_0.15_195)]" aria-hidden="true" />
        </div>
        <span className="text-sm font-medium text-white">Geotherm-Assistent</span>
        {isStreaming && (
          <div className="ml-auto flex gap-1" aria-label="Antwort wird generiert">
            {[0, 150, 300].map(delay => (
              <span
                key={delay}
                className="w-1.5 h-1.5 rounded-full bg-[oklch(0.72_0.15_195)] animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
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
                ? 'bg-[oklch(0.62_0.14_195)] text-white'
                : 'bg-white/[0.06] text-white/85'
            }`}>
              {msg.parts.map((part, i) => {
                if (part.type === 'text') {
                  return <span key={i}>{part.text}</span>
                }
                if (part.type === 'tool-invocation') {
                  const tp = part as unknown as { toolName: string; state: string }
                  const label = TOOL_LABELS[tp.toolName]
                  if (label && (tp.state === 'call' || tp.state === 'result')) {
                    return (
                      <span key={i} className="italic text-white/50 text-xs block mt-1">
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
              className="text-xs px-2.5 py-1 rounded-full border border-white/15 text-white/50 hover:border-[oklch(0.72_0.15_195/0.5)] hover:text-[oklch(0.72_0.15_195)] disabled:opacity-40 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={submit}
        className="shrink-0 flex items-center gap-2 px-4 py-3 border-t border-white/[0.08]"
      >
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Schreib eine Nachricht…"
          disabled={isStreaming}
          aria-label="Nachricht an den Geotherm-Assistenten"
          className="flex-1 bg-white/[0.05] border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-[oklch(0.72_0.15_195/0.5)] disabled:opacity-50 transition-colors"
        />
        <button
          type="submit"
          disabled={!text.trim() || isStreaming}
          aria-label="Senden"
          className="shrink-0 w-9 h-9 rounded-lg bg-[oklch(0.62_0.14_195)] hover:bg-[oklch(0.68_0.15_195)] disabled:opacity-40 flex items-center justify-center transition-colors"
        >
          <SendIcon className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  )
}
