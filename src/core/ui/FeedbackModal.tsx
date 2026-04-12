'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MessageSquare, X } from 'lucide-react'
import { Button } from './button'
import { Textarea } from './textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { useAuth } from '@/core/auth/useAuth'

const IN_APP_OPTIONS = [
  { value: 'allgemein', label: 'Allgemein' },
  { value: 'gpa', label: 'GPA – Atlas' },
  { value: 'deltat', label: 'DeltaT – Rechner' },
  { value: 'docs', label: 'Dokumentation' },
] as const

const CATEGORY_OPTIONS = [
  { value: 'bug', label: 'Fehler / Bug' },
  { value: 'ui-design', label: 'UI / Design' },
  { value: 'feature-wunsch', label: 'Feature-Wunsch' },
  { value: 'performance', label: 'Performance' },
  { value: 'datenqualitaet', label: 'Datenqualität' },
  { value: 'sonstiges', label: 'Sonstiges' },
] as const

const schema = z.object({
  inApp: z.enum(['allgemein', 'gpa', 'deltat', 'docs']),
  category: z.enum(['bug', 'ui-design', 'feature-wunsch', 'performance', 'datenqualitaet', 'sonstiges']),
  stars: z.number().int().min(1).max(5).nullable(),
  message: z.string().min(5, 'Bitte mindestens 5 Zeichen eingeben').max(2000),
  consent: z.boolean().refine(v => v, 'Zustimmung erforderlich'),
})

type FormData = z.infer<typeof schema>

interface FeedbackModalProps {
  defaultInApp?: FormData['inApp']
}

export function FeedbackModal({ defaultInApp = 'allgemein' }: FeedbackModalProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [stars, setStars] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { inApp: defaultInApp, stars: null, consent: false },
  })

  if (!user) return null

  async function onSubmit(data: FormData) {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      setSubmitted(true)
      setTimeout(() => {
        setOpen(false)
        setSubmitted(false)
        setStars(0)
        reset()
      }, 2000)
    }
  }

  function handleStarClick(s: number) {
    setStars(s)
    setValue('stars', s)
  }

  return (
    <>
      {/* Pill-Button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Feedback-Dialog öffnen"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors min-h-[44px]"
      >
        <MessageSquare className="size-4" aria-hidden="true" />
        Feedback
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Modal */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-modal-title"
          className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span id="feedback-modal-title" className="font-semibold text-sm">Feedback geben</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Feedback-Dialog schließen"
              className="text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          {submitted ? (
            <div className="px-4 py-10 text-center">
              <div className="text-3xl mb-2">✓</div>
              <p className="text-sm text-green-600 font-medium">Vielen Dank für dein Feedback!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 p-4">
              {/* Sterne */}
              <div className="flex justify-center gap-1" role="group" aria-label="Bewertung auswählen">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStarClick(s)}
                    aria-label={`${s} ${s === 1 ? 'Stern' : 'Sterne'}`}
                    aria-pressed={s <= stars}
                    className={`text-2xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${s <= stars ? 'text-yellow-400' : 'text-muted-foreground/30'}`}
                  ><span aria-hidden="true">★</span></button>
                ))}
              </div>

              {/* In-App */}
              <Select defaultValue={defaultInApp} onValueChange={v => setValue('inApp', v as FormData['inApp'])}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="App auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {IN_APP_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Kategorie */}
              <Select onValueChange={v => setValue('category', v as FormData['category'])}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-destructive text-xs">{errors.category.message}</p>}

              {/* Nachricht */}
              <Textarea
                placeholder="Dein Feedback…"
                rows={3}
                className="text-xs resize-none"
                {...register('message')}
              />
              {errors.message && <p className="text-destructive text-xs">{errors.message.message}</p>}

              {/* Consent */}
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input type="checkbox" className="mt-0.5" {...register('consent')} />
                Ich bin einverstanden, dass mein Feedback inkl. E-Mail für Produktverbesserungen gespeichert wird.
              </label>
              {errors.consent && <p className="text-destructive text-xs">{errors.consent.message}</p>}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Sende…' : 'Absenden'}
              </Button>
            </form>
          )}
        </div>
      )}
    </>
  )
}
