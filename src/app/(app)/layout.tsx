import { AppShell } from '@/core/layout/AppShell'
import { RequireAuth } from '@/core/auth/RequireAuth'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  )
}
