export const metadata = { title: 'Anmelden – Geotherm' }

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-900">Anmelden</h1>
      <p className="mt-1 text-sm text-gray-500">
        Noch kein Konto?{' '}
        <a href="/signup" className="text-blue-700 hover:underline">
          Registrieren
        </a>
      </p>
      {/* Auth-Formular wird in M2 implementiert */}
      <div className="mt-6 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
        Auth-Implementation folgt in Milestone 2.
      </div>
    </div>
  )
}
