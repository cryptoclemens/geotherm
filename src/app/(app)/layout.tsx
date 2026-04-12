import { AppShell } from '@/core/layout/AppShell'
import { RequireAuth } from '@/core/auth/RequireAuth'
import { SwCleanup } from '@/app/sw-cleanup'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <SwCleanup />
      <AppShell>{children}</AppShell>
    </RequireAuth>
  )
}
