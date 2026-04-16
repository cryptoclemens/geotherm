'use client'

import { useState, useEffect, useCallback } from 'react'
import { KeyRound, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Trash2 } from 'lucide-react'
import { useAuth } from '@/core/auth/useAuth'
import { Button } from '@/core/ui/button'
import { Input } from '@/core/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/ui/card'

type Provider = 'anthropic' | 'openai' | 'azure_openai' | 'perplexity'

interface ApiKeyEntry {
  id: string
  provider: Provider
  key_hint: string
  azure_endpoint: string | null
  is_active: boolean
  updated_at: string
}

interface ProviderConfig {
  id: Provider
  label: string
  description: string
  keyPlaceholder: string
  docsUrl: string
  needsEndpoint?: boolean
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    description: 'Für alle KI-Funktionen: Chat, Standortanalyse, Projektoptimierung.',
    keyPlaceholder: 'sk-ant-api03-…',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'openai',
    label: 'OpenAI (GPT)',
    description: 'Alternativ-Provider für KI-Features (GPT-4o, GPT-4o-mini).',
    keyPlaceholder: 'sk-proj-…',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'azure_openai',
    label: 'Microsoft Azure OpenAI',
    description: 'Für Unternehmensumgebungen mit eigenem Azure-Deployment.',
    keyPlaceholder: 'Azure API Key',
    docsUrl: 'https://portal.azure.com',
    needsEndpoint: true,
  },
  {
    id: 'perplexity',
    label: 'Perplexity AI',
    description: 'Für webgestützte Suche und aktuelle Daten in KI-Antworten.',
    keyPlaceholder: 'pplx-…',
    docsUrl: 'https://www.perplexity.ai/settings/api',
  },
]

function ProviderCard({
  config,
  existingKey,
  onSaved,
  onDeleted,
}: {
  config: ProviderConfig
  existingKey: ApiKeyEntry | undefined
  onSaved: () => void
  onDeleted: () => void
}) {
  const [apiKey, setApiKey] = useState('')
  const [azureEndpoint, setAzureEndpoint] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSave() {
    if (!apiKey.trim()) return
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: config.id,
          api_key: apiKey.trim(),
          azure_endpoint: azureEndpoint.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Fehler beim Speichern')
      } else {
        setSuccess(true)
        setApiKey('')
        setAzureEndpoint('')
        setTimeout(() => setSuccess(false), 3000)
        onSaved()
      }
    } catch {
      setError('Verbindungsfehler')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch('/api/user/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: config.id }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Fehler beim Löschen')
      } else {
        onDeleted()
      }
    } catch {
      setError('Verbindungsfehler')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <CardTitle className="text-base">{config.label}</CardTitle>
              <CardDescription className="text-sm mt-0.5">{config.description}</CardDescription>
            </div>
          </div>
          {existingKey && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Aktiv
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {existingKey ? (
          <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/40 px-3 py-2">
            <span className="font-mono text-sm text-muted-foreground">{existingKey.key_hint}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span className="ml-1 text-xs">Entfernen</span>
            </Button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                placeholder={config.keyPlaceholder}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                className="pr-10 font-mono text-sm"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showKey ? 'Key verbergen' : 'Key anzeigen'}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {config.needsEndpoint && (
              <Input
                type="url"
                placeholder="https://…openai.azure.com"
                value={azureEndpoint}
                onChange={e => setAzureEndpoint(e.target.value)}
                className="text-sm"
              />
            )}
          </>
        )}

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <XCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}
        {success && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            API-Key sicher gespeichert.
          </p>
        )}

        {!existingKey && (
          <div className="flex items-center justify-between">
            <a
              href={config.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            >
              API-Key erstellen →
            </a>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !apiKey.trim()}
              className="h-8"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Speichern
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [savedKeys, setSavedKeys] = useState<ApiKeyEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/user/api-keys')
      if (res.ok) {
        const data = await res.json()
        setSavedKeys(data.keys ?? [])
      }
    } catch {
      // Stille Degradation
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) fetchKeys()
  }, [user, fetchKeys])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Einstellungen</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Hinterlege deinen eigenen LLM-API-Key (BYOK). Der Schlüssel wird AES-256-GCM
            verschlüsselt gespeichert — der Klartext verlässt den Server nie.
          </p>
        </div>

        <section>
          <h2 className="text-base font-medium mb-4 flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            KI-API-Schlüssel
          </h2>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Lade gespeicherte Keys…
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {PROVIDERS.map(config => (
                <ProviderCard
                  key={config.id}
                  config={config}
                  existingKey={savedKeys.find(k => k.provider === config.id)}
                  onSaved={fetchKeys}
                  onDeleted={() => {
                    setSavedKeys(prev => prev.filter(k => k.provider !== config.id))
                  }}
                />
              ))}
            </div>
          )}

          <p className="mt-6 text-xs text-muted-foreground leading-relaxed">
            Kein eigener Key? Die KI-Funktionen laufen auf einem geteilten Server-Key mit
            Kontingent-Limits. Für unbegrenzte Nutzung eigenen Key hinterlegen.{' '}
            <a href="/datenschutz" className="underline-offset-2 hover:underline">
              Datenschutz
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
