'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/core/ui/button'
import { Input } from '@/core/ui/input'
import { useAuth } from '@/core/auth/useAuth'
import { useState } from 'react'

const schema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Mindestens 8 Zeichen'),
  agb: z.boolean().refine(val => val, 'AGB müssen akzeptiert werden'),
  datenschutz: z.boolean().refine(val => val, 'Datenschutzerklärung muss akzeptiert werden'),
})

type FormData = z.infer<typeof schema>

export default function SignupPage() {
  const { signUp } = useAuth()
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

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
      router.push('/verify-email')
    } catch {
      setServerError('Verbindungsfehler. Bitte Seite neu laden.')
    }
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
            className="bg-white/[0.08] border-white/15 text-white placeholder:text-white/35 focus-visible:border-[oklch(0.72_0.15_195)] focus-visible:ring-[oklch(0.72_0.15_195/0.3)] h-11"
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
            className="bg-white/[0.08] border-white/15 text-white placeholder:text-white/35 focus-visible:border-[oklch(0.72_0.15_195)] focus-visible:ring-[oklch(0.72_0.15_195/0.3)] h-11"
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
          className="mt-1 h-11 bg-[oklch(0.62_0.14_195)] hover:bg-[oklch(0.68_0.15_195)] text-white font-medium border-0"
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
