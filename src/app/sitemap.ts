import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://geotherm.vencly.com', changeFrequency: 'weekly', priority: 1 },
    { url: 'https://geotherm.vencly.com/impressum', changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://geotherm.vencly.com/datenschutz', changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://geotherm.vencly.com/agb', changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://geotherm.vencly.com/security', changeFrequency: 'yearly', priority: 0.3 },
  ]
}
