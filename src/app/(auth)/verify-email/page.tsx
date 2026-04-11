export const metadata = { title: 'E-Mail bestätigen – Geotherm' }

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-900">E-Mail bestätigen</h1>
      <p className="mt-2 text-sm text-gray-500">
        Wir haben dir einen Bestätigungslink per E-Mail geschickt.
        Bitte prüfe deinen Posteingang.
      </p>
    </div>
  )
}
