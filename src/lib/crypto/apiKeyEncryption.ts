/**
 * apiKeyEncryption — AES-256-GCM Verschlüsselung für BYOK-API-Schlüssel
 *
 * Läuft ausschließlich server-seitig. Die verschlüsselten Schlüssel werden
 * in der DB gespeichert; der Klartext verlässt den Server nie.
 *
 * Format: base64(iv[16 Bytes] || authTag[16 Bytes] || ciphertext)
 *
 * Benötigt: API_KEY_ENCRYPTION_SECRET — 32 Bytes, base64-kodiert.
 * Erzeugen: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGO    = 'aes-256-gcm'
const KEY_LEN = 32
const IV_LEN  = 16
const TAG_LEN = 16

function getKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET
  if (!secret) throw new Error('API_KEY_ENCRYPTION_SECRET ist nicht gesetzt')
  const buf = Buffer.from(secret, 'base64')
  if (buf.length !== KEY_LEN) {
    throw new Error('API_KEY_ENCRYPTION_SECRET muss genau 32 Bytes (base64-kodiert) sein')
  }
  return buf
}

/** Verschlüsselt einen API-Key. Gibt base64-String zurück. */
export function encryptApiKey(plaintext: string): string {
  const key = getKey()
  const iv  = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

/** Entschlüsselt einen gespeicherten API-Key. */
export function decryptApiKey(encoded: string): string {
  const key = getKey()
  const buf = Buffer.from(encoded, 'base64')
  const iv         = buf.subarray(0, IV_LEN)
  const tag        = buf.subarray(IV_LEN, IV_LEN + TAG_LEN)
  const ciphertext = buf.subarray(IV_LEN + TAG_LEN)
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

/**
 * Erstellt einen Anzeige-Hint: erste 6 Zeichen + "•••••" + letzte 4 Zeichen.
 * Beispiel: "sk-ant-api03-..." → "sk-ant•••••a03-"
 */
export function maskApiKey(key: string): string {
  if (key.length <= 10) return '••••••••'
  return `${key.slice(0, 6)}•••••${key.slice(-4)}`
}

/** Gibt true zurück wenn API_KEY_ENCRYPTION_SECRET korrekt konfiguriert ist. */
export function isEncryptionConfigured(): boolean {
  try { getKey(); return true } catch { return false }
}
