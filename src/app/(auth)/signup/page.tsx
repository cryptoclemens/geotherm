'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { KeyRound, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/core/ui/button'
import { Input } from '@/core/ui/input'
import { useAuth } from '@/core/auth/useAuth'

const schema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Mindestens 8 Zeichen'),
  agb: z.boolean().refine(val => val, 'AGB müssen akzeptiert werden'),
  datenschutz: z.boolean().refine(val => val, 'Datenschutzerklärung muss akzeptiert werden'),
})

type FormData = z.infer<typeof schema>

type Step = 'register' | 'byok'

const INPUT_CLS = 'bg-white/[0.08] border-white/15 text-white placeholder:text-white/35 focus-visible:border-[oklch(0.72_0.15_195)] focus-visible:ring-[oklch(0.72_0.15_195/0.3)] h-11'
const BTN_CLS = 'mt-1 h-11 bg-[oklch(0.62_0.14_195)] hover:bg-[oklch(0.68_0.15_195)] text-white font-medium border-0'

export default function SignupPage() {
  const { signUp } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<Step>('register')
  const [serverError, setServerError] = useState<string | null>(null)
  const [anthropicKey, setAnthropicKey] = useState('')
  const [savingKey, setSavingKey] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setServerError(null)
    try {
      const { error } = await signUp(data.email, data.password)
      if (error) {
        const msg = error.message ?? ''
        if (msg.includes('already registered') || msg.includes('user_already_exists')) {
          setServerError('Diese E-Mail ist bereits registriert. Bitte anmelden.')
        } else {
          setServerError(msg || 'Registrierung fehlgeschlagen.')
        }
        return
      }
      setStep('byok')
    } catch {
      setServerError('Verbindungsfehler. Bitte Seite neu laden.')
    }
  }

  async function handleByokSave() {
    if (!anthropicKey.trim()) {
      router.push('/verify-email')
      return
    }
    setSavingKey(true)
    try {
      await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'anthropic', api_key: anthropicKey.trim() }),
      })
    } catch {
      // Stille Degradation — Key kann später unter Einstellungen nachgetragen werden
    } finally {
      setSavingKey(false)
      router.push('/verify-email')
    }
  }

  if (step === 'byok') {
    return (
      <div className="glass-card-strong glow-teal w-full max-w-sm rounded-2xl p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="h-5 w-5 text-[oklch(0.72_0.15_195)]" />
            <h1 className="text-xl font-semibold text-white">Eigener API-Key</h1>
          </div>
          <p className="text-sm text-white/50">
            Optional — du kannst das jederzeit unter{' '}
            <span className="text-white/70">Einstellungen</span> nachholen.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70 leading-relaxed">
            Hinterlege deinen eigenen{' '}
            <span className="text-white font-medium">Anthropic-API-Key</span>, um die
            KI-Funktionen ohne Kontingent-Limits zu nutzen. Der Key wird{' '}
            <span className="text-white font-medium">AES-256-GCM verschlüsselt</span> gespeichert —
            kein Klartext in der Datenbank.
          </div>

          <Input
            type="password"
            placeholder="sk-ant-api03-…"
            value={anthropicKey}
            onChange={e => setAnthropicKey(e.target.value)}
            className={INPUT_CLS + ' font-mono'}
            autoComplete="off"
            spellCheck={false}
          />

          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[oklch(0.72_0.15_195)] hover:text-[oklch(0.80_0.14_195)] transition-colors"
          >
            API-Key bei Anthropic erstellen →
          </a>

          <Button
            onClick={handleByokSave}
            disabled={savingKey}
            className={BTN_CLS}
          >
            {savingKey ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : anthropicKey.trim() ? (
              <>Key speichern &amp; weiter</>
            ) : (
              <>Überspringen</>
            )}
          </Button>

          <button
            type="button"
            onClick={() => router.push('/verify-email')}
            className="flex items-center justify-center gap-1 text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            Später einrichten
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card-strong glow-teal w-full max-w-sm rounded-2xl p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Registrieren</h1>
        <p className="text-sm text-white/50 mt-1">Kostenloses Geotherm-Konto erstellen</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Input
            type="email"
            placeholder="E-Mail"
            autoComplete="email"
            aria-invalid={!!errors.email}
            className={INPUT_CLS}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-destructive text-xs">{errors.email.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Input
            type="password"
            placeholder="Passwort (mind. 8 Zeichen)"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            className={INPUT_CLS}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-destructive text-xs">{errors.password.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 text-sm text-white/70">
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-0.5 accent-[oklch(0.72_0.15_195)]" {...register('agb')} />
            <span>
              Ich akzeptiere die{' '}
              <Link href="/agb" className="text-[oklch(0.72_0.15_195)] hover:text-[oklch(0.80_0.14_195)] transition-colors underline-offset-2 underline" target="_blank">AGB</Link>
            </span>
          </label>
          {errors.agb && <p className="text-destructive text-xs">{errors.agb.message}</p>}
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-0.5 accent-[oklch(0.72_0.15_195)]" {...register('datenschutz')} />
            <span>
              Ich habe die{' '}
              <Link href="/datenschutz" className="text-[oklch(0.72_0.15_195)] hover:text-[oklch(0.80_0.14_195)] transition-colors underline-offset-2 underline" target="_blank">Datenschutzerklärung</Link>
              {' '}gelesen
            </span>
          </label>
          {errors.datenschutz && (
            <p className="text-destructive text-xs">{errors.datenschutz.message}</p>
          )}
        </div>
        {serverError && (
          <p className="text-destructive text-xs">{serverError}</p>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className={BTN_CLS}
        >
          {isSubmitting ? 'Registrieren…' : 'Kostenlos registrieren'}
        </Button>
        <p className="text-sm text-center text-white/40">
          Bereits ein Konto?{' '}
          <Link href="/login" className="hover:text-white/70 transition-colors">Anmelden</Link>
        </p>
      </form>
    </div>
  )
}
