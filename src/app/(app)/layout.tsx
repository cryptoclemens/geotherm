import { AppShell } from '@/core/layout/AppShell'
import { RequireAuth } from '@/core/auth/RequireAuth'
import { SwCleanup } from '@/app/sw-cleanup'
import { QueryProvider } from '@/core/providers/QueryProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <RequireAuth>
        <SwCleanup />
        <AppShell>{children}</AppShell>
      </RequireAuth>
    </QueryProvider>
  )
}
