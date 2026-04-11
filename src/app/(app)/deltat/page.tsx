'use client'

import dynamic from 'next/dynamic'

const DeltaTApp = dynamic(() => import('@/apps/deltat'), { ssr: false })

export default function DeltaTPage() {
  return <DeltaTApp />
}
