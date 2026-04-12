'use client'
import { useEffect } from 'react'

/**
 * Unregisters stale service workers on every page load.
 * Belt-and-suspenders for the @serwist/next → Turbopack migration:
 * old Serwist SWs cached broken asset hashes → "This page couldn't load".
 * The sw.js at /sw.js handles this via skipWaiting + cache clear,
 * but this component covers the case where JS actually runs.
 */
export function SwCleanup() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => reg.unregister())
      })
    }
  }, [])
  return null
}
