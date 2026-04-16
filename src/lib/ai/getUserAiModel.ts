/**
 * getUserAiModel — Server-seitige Hilfsfunktion für BYOK-fähige KI-Modelle
 *
 * Liest den verschlüsselten API-Key des aktuellen Nutzers aus der DB,
 * entschlüsselt ihn und gibt ein fertiges AI-SDK-Modell zurück.
 * Fallback auf Server-seitige Umgebungsvariablen wenn kein Nutzer-Key vorhanden.
 */

import { createClient } from '@/lib/supabase/server'
import { decryptApiKey } from '@/lib/crypto/apiKeyEncryption'
import { anthropic, createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'

export type Provider = 'anthropic' | 'openai' | 'azure_openai' | 'perplexity'

interface UserApiKeyRow {
  provider: Provider
  key_encrypted: string
  azure_endpoint: string | null
  is_active: boolean
}

/**
 * Gibt ein AI-SDK-Modell zurück, das den API-Key des eingeloggten Nutzers nutzt.
 * Kein Nutzer-Key vorhanden → Fallback auf Server-Key (ANTHROPIC_API_KEY / OPENAI_API_KEY).
 *
 * @param modelId  z.B. 'claude-haiku-4-5-20251001' oder 'gpt-4o-mini'
 * @param preferredProvider  Welchen Provider bevorzugen (default: 'anthropic')
 */
export async function getUserAiModel(
  modelId: string,
  preferredProvider: Provider = 'anthropic',
): Promise<LanguageModel> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: keyRow } = await supabase
        .from('user_api_keys')
        .select('provider, key_encrypted, azure_endpoint, is_active')
        .eq('user_id', user.id)
        .eq('provider', preferredProvider)
        .eq('is_active', true)
        .single<UserApiKeyRow>()

      if (keyRow?.key_encrypted) {
        const plainKey = decryptApiKey(keyRow.key_encrypted)
        return buildModel(preferredProvider, modelId, plainKey, keyRow.azure_endpoint)
      }
    }
  } catch {
    // Fehler beim DB-Zugriff → Fallback auf Server-Key
  }

  // Fallback: Server-seitiger Key
  return buildModel(preferredProvider, modelId, null, null)
}

function buildModel(
  provider: Provider,
  modelId: string,
  apiKey: string | null,
  azureEndpoint: string | null,
): LanguageModel {
  switch (provider) {
    case 'anthropic': {
      if (apiKey) {
        const client = createAnthropic({ apiKey })
        return client(modelId) as LanguageModel
      }
      return anthropic(modelId) as LanguageModel
    }

    case 'openai': {
      const client = createOpenAI({ apiKey: apiKey ?? process.env.OPENAI_API_KEY ?? '' })
      return client(modelId) as LanguageModel
    }

    case 'azure_openai': {
      const baseURL = azureEndpoint
        ? `${azureEndpoint.replace(/\/$/, '')}/openai/deployments`
        : process.env.AZURE_OPENAI_ENDPOINT ?? ''
      const client = createOpenAI({
        apiKey: apiKey ?? process.env.AZURE_OPENAI_API_KEY ?? '',
        baseURL,
      })
      return client(modelId) as LanguageModel
    }

    case 'perplexity': {
      // Perplexity ist OpenAI-kompatibel
      const client = createOpenAI({
        apiKey: apiKey ?? process.env.PERPLEXITY_API_KEY ?? '',
        baseURL: 'https://api.perplexity.ai',
      })
      return client(modelId) as LanguageModel
    }

    default: {
      // TypeScript exhaustiveness — nie erreicht
      return anthropic(modelId) as LanguageModel
    }
  }
}
