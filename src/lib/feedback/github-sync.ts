// GitHub Contents API Helper — server-only!
// GITHUB_FEEDBACK_TOKEN darf NIEMALS im Frontend-Bundle landen.

interface FeedbackEntry {
  timestamp: string
  inApp: string
  category: string
  stars: number | null
  message: string
  email: string
  version: string
  userAgent: string
}

function formatEntry(e: FeedbackEntry): string {
  const stars = e.stars
    ? '★'.repeat(e.stars) + '☆'.repeat(5 - e.stars)
    : null

  return [
    `## ${e.timestamp} · ${e.inApp} · ${e.category} · [offen]`,
    `**Nutzer:** ${e.email}`,
    `**Version:** ${e.version}`,
    stars ? `**Sterne:** ${stars}` : null,
    `**Gerät:** ${e.userAgent}`,
    '',
    `> ${e.message.replace(/\n/g, '\n> ')}`,
    '',
    '---',
    '',
  ].filter(l => l !== null).join('\n')
}

export async function appendToFeedbackMd(entry: FeedbackEntry): Promise<boolean> {
  const token = process.env.GITHUB_FEEDBACK_TOKEN
  const repo = process.env.GITHUB_FEEDBACK_REPO

  if (!token || !repo) return false

  const apiUrl = `https://api.github.com/repos/${repo}/contents/feedback.md`
  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }

  try {
    // Aktuelle Datei + SHA lesen
    const getRes = await fetch(apiUrl, { headers })
    if (!getRes.ok) return false

    const data = await getRes.json()
    const existing = Buffer.from(data.content, 'base64').toString('utf-8')
    const sha: string = data.sha

    // Neuen Eintrag vor dem Format-Beispiel einfügen
    const separator = '---\n\n## Format-Beispiel'
    const insertPoint = existing.indexOf(separator)
    const newBlock = formatEntry(entry)

    let newContent: string
    if (insertPoint !== -1) {
      newContent = existing.slice(0, insertPoint) + newBlock + '\n' + existing.slice(insertPoint)
    } else {
      newContent = existing + '\n' + newBlock
    }

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `feedback: ${entry.inApp} · ${entry.category} (${entry.timestamp.slice(0, 10)})`,
        content: Buffer.from(newContent, 'utf-8').toString('base64'),
        sha,
      }),
    })

    return putRes.ok
  } catch {
    return false
  }
}
