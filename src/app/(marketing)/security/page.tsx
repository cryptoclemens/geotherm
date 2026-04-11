import { readFile } from 'fs/promises'
import { join } from 'path'

export const metadata = { title: 'Security – Geotherm' }

export default async function SecurityPage() {
  const content = await readFile(join(process.cwd(), 'content/legal/security.mdx'), 'utf8')
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose">
      <pre className="whitespace-pre-wrap font-sans text-sm">{content}</pre>
    </div>
  )
}
