import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/core/ui/card'
import { Input } from '@/core/ui/input'
import Link from 'next/link'
import { buttonVariants } from '@/core/ui/button'
import { cn } from '@/core/ui/utils'

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Anmelden</CardTitle>
        <CardDescription>Mit deinem Geotherm-Konto anmelden</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* TODO M2: LoginForm-Komponente mit useAuth() */}
        <Input type="email" placeholder="E-Mail" disabled />
        <Input type="password" placeholder="Passwort" disabled />
        <span className={cn(buttonVariants(), 'opacity-50 pointer-events-none')}>
          Anmelden (kommt in M2)
        </span>
        <div className="text-sm text-center text-muted-foreground">
          <Link href="/forgot-password" className="hover:underline">Passwort vergessen?</Link>
          {' · '}
          <Link href="/signup" className="hover:underline">Registrieren</Link>
        </div>
      </CardContent>
    </Card>
  )
}
