'use client'
import { useEffect } from 'react'

/**
 * Unregisters stale service workers and force-reloads once to clear broken caches.
 * Belt-and-suspenders for the @serwist/next → Turbopack migration:
 * old Serwist SWs cached RSC payloads + asset hashes → navigation fails with
 * "This page couldn't load" after redeployments.
 *
 * Flow: page loads from SW cache (old HTML) → JS runs → SW found → unregister
 * → force-reload → no SW → page loads fresh from network → all navigation works.
 */
export function SwCleanup() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.getRegistrations().then(registrations => {
      if (registrations.length === 0) return
      Promise.all(registrations.map(reg => reg.unregister())).then(() => {
        // Force-reload so the browser fetches everything fresh (no more SW cache)
        window.location.reload()
      })
    })
  }, [])
  return null
}
