export const metadata = { title: 'DeltaT – Dubletten-Rechner' }

export default function DeltaTPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem-5rem)] items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">DeltaT – Dubletten-Auslegungsrechner</h1>
        <p className="mt-2 text-sm text-gray-500">Migration aus vencly-delta-t folgt in Milestone 4.</p>
      </div>
    </div>
  )
}
