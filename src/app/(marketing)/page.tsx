import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Vom Standort zum Bohrplan
        </h1>
        <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
          Geotherm ist die erste modulare Geothermie-Suite im Web — alle Werkzeuge
          entlang des Projektlebenszyklus in einem durchgängigen digitalen Workflow.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-md bg-blue-700 px-6 py-3 text-base font-medium text-white hover:bg-blue-800"
          >
            Kostenlos registrieren
          </Link>
          <Link
            href="/atlas"
            className="rounded-md border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            Atlas ansehen
          </Link>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900">GPA – Geothermie-Potenzial-Atlas</h2>
          <p className="mt-2 text-sm text-gray-500">
            Interaktive Karte des norddeutschen Tieflandes mit Overlays für
            Geologie, Fernwärme-Städte und Wärmequellen.
          </p>
          <Link href="/atlas" className="mt-4 inline-block text-sm text-blue-700 hover:underline">
            Zum Atlas →
          </Link>
        </div>
        <div className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900">DeltaT – Dubletten-Rechner</h2>
          <p className="mt-2 text-sm text-gray-500">
            Echtzeit-Rechner für geothermische Dubletten-Systeme mit
            Wärmepumpen-Dimensionierung und Durchbruchszeit-Prognose.
          </p>
          <Link href="/deltat" className="mt-4 inline-block text-sm text-blue-700 hover:underline">
            Zum Rechner →
          </Link>
        </div>
      </div>
    </div>
  )
}
