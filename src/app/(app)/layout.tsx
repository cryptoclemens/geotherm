import { AppShell } from '@/core/layout/AppShell'
import { RequireAuth } from '@/core/auth/RequireAuth'
import { SwCleanup } from '@/app/sw-cleanup'
import { QueryProvider } from '@/core/providers/QueryProvider'
import { GlobalFeedbackButton } from '@/core/layout/GlobalFeedbackButton'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <RequireAuth>
        <SwCleanup />
        <AppShell>{children}</AppShell>
        <GlobalFeedbackButton />
      </RequireAuth>
    </QueryProvider>
  )
}
