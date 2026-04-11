export const metadata = { title: 'Registrieren – Geotherm' }

export default function SignupPage() {
  return (
    <div className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-900">Konto erstellen</h1>
      <p className="mt-1 text-sm text-gray-500">
        Bereits registriert?{' '}
        <a href="/login" className="text-blue-700 hover:underline">
          Anmelden
        </a>
      </p>
      {/* Auth-Formular wird in M2 implementiert */}
      <div className="mt-6 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
        Auth-Implementation folgt in Milestone 2.
      </div>
    </div>
  )
}
