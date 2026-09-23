import { deflate, inflate } from 'pako'
import type { ColorTheme } from './colorTheme'

export type CardData = {
  title: string
  noteText: string
  cardImages: string[] // 3 data URLs for swipeable cards
  mainPhoto: string    // 1 data URL for the main photo
  colors?: ColorTheme  // optional — backward compatible
}

// ─── Helpers ──────────────────────────────────────────────────
function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(str: string): Uint8Array {
  // Restore standard base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  // Add padding
  while (base64.length % 4) base64 += '='
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// ─── Encode / Decode ──────────────────────────────────────────
export function encodeCardData(data: CardData): string {
  const json = JSON.stringify(data)
  const compressed = deflate(json)
  return toBase64Url(compressed)
}

export function decodeCardData(encoded: string): CardData | null {
  try {
    const bytes = fromBase64Url(encoded)
    const inflated = inflate(bytes)
    const json = new TextDecoder().decode(inflated)
    return JSON.parse(json) as CardData
  } catch {
    return null
  }
}
