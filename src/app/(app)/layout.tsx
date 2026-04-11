import { AppShell } from '@/core/layout/AppShell'

// M2: RequireAuth-Wrapper kommt hier rein
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
