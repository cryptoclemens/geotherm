'use client'

import { usePathname } from 'next/navigation'
import { FeedbackModal } from '@/core/ui/FeedbackModal'
import { deriveInApp } from '@/core/ui/FeedbackTrigger'

export function GlobalFeedbackButton() {
  const pathname = usePathname()
  return <FeedbackModal defaultInApp={deriveInApp(pathname)} />
}
