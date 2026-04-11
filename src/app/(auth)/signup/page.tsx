import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/core/ui/card'
import Link from 'next/link'
import { buttonVariants } from '@/core/ui/button'
import { cn } from '@/core/ui/utils'

export default function SignupPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Registrieren</CardTitle>
        <CardDescription>Kostenloses Geotherm-Konto erstellen</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* TODO M2: SignupForm mit AGB + Datenschutz-Checkboxen */}
        <span className={cn(buttonVariants(), 'opacity-50 pointer-events-none')}>
          Registrierung (kommt in M2)
        </span>
        <p className="text-sm text-center text-muted-foreground">
          Bereits ein Konto? <Link href="/login" className="hover:underline">Anmelden</Link>
        </p>
      </CardContent>
    </Card>
  )
}
