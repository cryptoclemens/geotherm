import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  // Serwist deaktiviert: @serwist/next unterstützt kein Turbopack (Next.js 16 Default).
  // Der Webpack-Plugin läuft nicht → kein sw.js wird generiert → alte gecachte SWs
  // servieren falsche Assets nach Redeployments → "This page couldn't load".
  // Reaktivieren wenn @serwist/turbopack stabil ist: https://serwist.pages.dev/docs/next/turbo
  disable: true,
})

const nextConfig: NextConfig = {
  // Standalone-Build für Docker/Hetzner-Deployment
  output: 'standalone',
  // Leeres turbopack-Config: behebt "webpack config but no turbopack config"-Fehler in Next.js 16
  turbopack: {},
  // Sicherheits-Header + Performance
  poweredByHeader: false,
  compress: true,
  // Moderne Bildformate
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
  // Build-Zeit Env-Vars — VERCEL_GIT_COMMIT_SHA wird von Vercel automatisch gesetzt
  env: {
    NEXT_PUBLIC_GIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
  },
}

export default withSerwist(nextConfig)
