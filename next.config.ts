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
}

export default withSerwist(nextConfig)
