import dynamic from 'next/dynamic'

// Leaflet braucht ssr: false (window is not defined)
const GpaApp = dynamic(() => import('@/apps/gpa'), { ssr: false })

export default function AtlasPage() {
  return <GpaApp />
}
