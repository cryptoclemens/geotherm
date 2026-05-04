export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="dark geo-bg min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Dekorative Orbs – CSS-only, kein JS */}
      <div
        className="geo-orb w-96 h-96 bg-[oklch(0.62_0.14_195/0.25)] -top-24 -left-24"
        style={{ animationDelay: '0s' }}
        aria-hidden="true"
      />
      <div
        className="geo-orb w-80 h-80 bg-[oklch(0.72_0.14_60/0.20)] bottom-0 right-0"
        style={{ animationDelay: '4s' }}
        aria-hidden="true"
      />
      <div
        className="geo-orb w-64 h-64 bg-[oklch(0.55_0.16_160/0.15)] top-1/2 left-1/3"
        style={{ animationDelay: '8s' }}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full flex flex-col items-center gap-6">
        {/* Brand */}
        <div className="text-center">
          <span className="text-2xl font-bold tracking-tight text-white">Geotherm</span>
          <span className="ml-2 text-sm text-white/50 font-normal">by Vencly</span>
        </div>
        {children}
      </div>
    </main>
  )
}
