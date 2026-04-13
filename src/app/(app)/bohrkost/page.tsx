import dynamic from 'next/dynamic'

const BohrkostApp = dynamic(() => import('@/apps/bohrkost'), { ssr: false })

export default function BohrkostPage() {
  return <BohrkostApp />
}
