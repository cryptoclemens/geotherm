'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/core/ui/button'
import { Input } from '@/core/ui/input'
import { useAuth } from '@/core/auth/useAuth'
import { useState } from 'react'

const schema = z.object({
  password: z.string().min(8, 'Mindestens 8 Zeichen'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirm'],
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setServerError(null)
    const { error } = await updatePassword(data.password)
    if (error) {
      setServerError(error.message || 'Passwort konnte nicht geändert werden.')
      return
    }
    router.push('/login?message=password_updated')
  }

  return (
    <div className="glass-card-strong glow-teal w-full max-w-sm rounded-2xl p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Neues Passwort</h1>
        <p className="text-sm text-white/50 mt-1">Bitte gib dein neues Passwort ein</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Input
            type="password"
            placeholder="Neues Passwort (mind. 8 Zeichen)"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            className="bg-white/[0.08] border-white/15 text-white placeholder:text-white/35 focus-visible:border-[oklch(0.72_0.15_195)] focus-visible:ring-[oklch(0.72_0.15_195/0.3)] h-11"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-destructive text-xs">{errors.password.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Input
            type="password"
            placeholder="Passwort wiederholen"
            autoComplete="new-password"
            aria-invalid={!!errors.confirm}
            className="bg-white/[0.08] border-white/15 text-white placeholder:text-white/35 focus-visible:border-[oklch(0.72_0.15_195)] focus-visible:ring-[oklch(0.72_0.15_195/0.3)] h-11"
            {...register('confirm')}
          />
          {errors.confirm && (
            <p className="text-destructive text-xs">{errors.confirm.message}</p>
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
          {isSubmitting ? 'Speichern…' : 'Passwort speichern'}
        </Button>
      </form>
    </div>
  )
}
