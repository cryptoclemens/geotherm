'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/core/ui/card'
import { Button } from '@/core/ui/button'
import { Input } from '@/core/ui/input'
import { useAuth } from '@/core/auth/useAuth'
import { useState } from 'react'

const schema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    await resetPassword(data.email)
    setSent(true)
  }

  if (sent) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>E-Mail gesendet</CardTitle>
          <CardDescription>
            Falls ein Konto mit dieser Adresse existiert, erhältst du einen Reset-Link.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Passwort zurücksetzen</CardTitle>
        <CardDescription>Wir senden dir einen Reset-Link per E-Mail</CardDescription>
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Senden…' : 'Reset-Link senden'}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            <Link href="/login" className="hover:underline">Zurück zum Login</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
