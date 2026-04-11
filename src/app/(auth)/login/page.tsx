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
    const { error } = await signIn(data.email, data.password)
    if (error) {
      setServerError('E-Mail oder Passwort falsch.')
      return
    }
    router.push('/atlas')
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Anmelden</CardTitle>
        <CardDescription>Mit deinem Geotherm-Konto anmelden</CardDescription>
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
              placeholder="Passwort"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-destructive text-xs">{errors.password.message}</p>
            )}
          </div>
          {serverError && (
            <p className="text-destructive text-xs">{serverError}</p>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Anmelden…' : 'Anmelden'}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            <Link href="/forgot-password" className="hover:underline">Passwort vergessen?</Link>
            {' · '}
            <Link href="/signup" className="hover:underline">Registrieren</Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
