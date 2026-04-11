import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Standalone-Build für Docker/Hetzner-Deployment
  output: 'standalone',
}

export default nextConfig
