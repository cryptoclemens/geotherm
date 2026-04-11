import { AppShell } from '@/core/layout/AppShell'

// TODO M2: RequireAuth-Wrapper hier einbinden
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
