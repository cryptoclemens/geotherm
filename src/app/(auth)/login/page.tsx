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
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { signIn } = useAuth()
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setServerError(null)
    try {
      const { error } = await signIn(data.email, data.password)
      if (error) {
        const msg = error.message ?? ''
        if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) {
          setServerError('E-Mail-Adresse noch nicht bestätigt. Bitte prüfe dein Postfach.')
        } else if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) {
          setServerError('E-Mail oder Passwort falsch.')
        } else {
          setServerError(msg || 'Anmeldung fehlgeschlagen. Bitte erneut versuchen.')
        }
        return
      }
      // Session-Cookies sind jetzt gesetzt – Router-Cache leeren bevor Weiterleitung
      router.refresh()
      router.push('/dashboard')
    } catch {
      setServerError('Verbindungsfehler. Bitte Seite neu laden.')
    }
  }

  return (
    <div className="glass-card-strong glow-teal w-full max-w-sm rounded-2xl p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Anmelden</h1>
        <p className="text-sm text-white/50 mt-1">Mit deinem Geotherm-Konto anmelden</p>
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
            placeholder="Passwort"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            className="bg-white/[0.08] border-white/15 text-white placeholder:text-white/35 focus-visible:border-[oklch(0.72_0.15_195)] focus-visible:ring-[oklch(0.72_0.15_195/0.3)] h-11"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-destructive text-xs">{errors.password.message}</p>
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
          {isSubmitting ? 'Anmelden…' : 'Anmelden'}
        </Button>
        <div className="text-sm text-center text-white/40">
          <Link href="/forgot-password" className="hover:text-white/70 transition-colors">Passwort vergessen?</Link>
          {' · '}
          <Link href="/signup" className="hover:text-white/70 transition-colors">Registrieren</Link>
        </div>
      </form>
    </div>
  )
}
