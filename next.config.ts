import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {
  // Standalone-Build für Docker/Hetzner-Deployment
  output: 'standalone',
  // Leeres turbopack-Config: behebt "webpack config but no turbopack config"-Fehler in Next.js 16
  turbopack: {},
  // Build-Zeit Env-Vars — VERCEL_GIT_COMMIT_SHA wird von Vercel automatisch gesetzt
  env: {
    NEXT_PUBLIC_GIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
  },
}

export default withSerwist(nextConfig)
