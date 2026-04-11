import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/core/ui/card'
import { Input } from '@/core/ui/input'
import Link from 'next/link'
import { buttonVariants } from '@/core/ui/button'
import { cn } from '@/core/ui/utils'

export default function ForgotPasswordPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Passwort zurücksetzen</CardTitle>
        <CardDescription>Wir senden dir einen Reset-Link per E-Mail</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Input type="email" placeholder="E-Mail" disabled />
        <span className={cn(buttonVariants(), 'opacity-50 pointer-events-none')}>
          Link senden (kommt in M2)
        </span>
        <p className="text-sm text-center text-muted-foreground">
          <Link href="/login" className="hover:underline">Zurück zum Login</Link>
        </p>
      </CardContent>
    </Card>
  )
}
