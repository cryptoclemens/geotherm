import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'
import { execSync } from 'child_process'

function getGitSha(): string {
  // Vercel setzt diese Variable automatisch bei jedem Deploy
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
  }
  // Lokale Entwicklung: aus git lesen
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return ''
  }
}

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
  // Build-Zeit Env-Vars (werden bei jedem Vercel-Deploy automatisch aktualisiert)
  env: {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    NEXT_PUBLIC_APP_VERSION: require('./package.json').version,
    // Git-SHA: auf Vercel automatisch via VERCEL_GIT_COMMIT_SHA, lokal via git
    NEXT_PUBLIC_GIT_SHA: getGitSha(),
  },
}

export default withSerwist(nextConfig)
