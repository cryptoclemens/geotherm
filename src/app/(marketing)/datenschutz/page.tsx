import { readFile } from 'fs/promises'
import { join } from 'path'

export const metadata = { title: 'Datenschutz – Geotherm' }

export default async function DatenschutzPage() {
  const content = await readFile(join(process.cwd(), 'content/legal/datenschutz.mdx'), 'utf8')
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose">
      <pre className="whitespace-pre-wrap font-sans text-sm">{content}</pre>
    </div>
  )
}
