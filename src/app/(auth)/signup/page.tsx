'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/core/ui/card'
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
    const { error } = await signUp(data.email, data.password)
    if (error) {
      setServerError(error.message)
      return
    }
    router.push('/verify-email')
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Registrieren</CardTitle>
        <CardDescription>Kostenloses Geotherm-Konto erstellen</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Input
              type="email"
              placeholder="E-Mail"
              autoComplete="email"
              aria-invalid={!!errors.email}
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
              {...register('password')}
            />
            {errors.password && (
              <p className="text-destructive text-xs">{errors.password.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-0.5" {...register('agb')} />
              <span>
                Ich akzeptiere die{' '}
                <Link href="/agb" className="underline" target="_blank">AGB</Link>
              </span>
            </label>
            {errors.agb && <p className="text-destructive text-xs">{errors.agb.message}</p>}
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-0.5" {...register('datenschutz')} />
              <span>
                Ich habe die{' '}
                <Link href="/datenschutz" className="underline" target="_blank">Datenschutzerklärung</Link>
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Registrieren…' : 'Kostenlos registrieren'}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Bereits ein Konto?{' '}
            <Link href="/login" className="hover:underline">Anmelden</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
