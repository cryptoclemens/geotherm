import { readFile } from 'fs/promises'
import { join } from 'path'

export const metadata = { title: 'Impressum – Geotherm' }

export default async function ImpressumPage() {
  // MDX wird in M1 als plain Markdown gerendert; ab M2 mit @next/mdx
  const content = await readFile(join(process.cwd(), 'content/legal/impressum.mdx'), 'utf8')
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose">
      <pre className="whitespace-pre-wrap font-sans text-sm">{content}</pre>
    </div>
  )
}
