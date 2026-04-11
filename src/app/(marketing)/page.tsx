import Link from 'next/link'
import { buttonVariants } from '@/core/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/core/ui/card'
import { cn } from '@/core/ui/utils'

export default function LandingPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">
          Vom Standort zum Bohrplan
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Die erste modulare Geothermie-Suite im Web — alle Werkzeuge
          entlang des Projektlebenszyklus in einem Workflow.
        </p>
        <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }))}>
          Kostenlos registrieren
        </Link>
      </section>

      <section className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>GPA – Geothermie-Potenzial-Atlas</CardTitle>
            <CardDescription>
              Interaktive Karte des norddeutschen Tieflandes mit Overlays
              für Lockergestein, Fernwärme-Städte und Industriewärmequellen.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>DeltaT – Dubletten-Auslegungsrechner</CardTitle>
            <CardDescription>
              Echtzeit-Rechner für geothermische Dubletten-Systeme mit
              Wärmepumpen-Dimensionierung.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  )
}
