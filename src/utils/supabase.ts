import type { CardData } from './cardData'
import { normalizeColorTheme } from './colorTheme'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const STORAGE_BUCKET = 'card-media'
const REQUEST_TIMEOUT_MS = 12_000
const ID_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const WORKER_PROXY_PREFIX = '/api/supabase'

type SharedCardRow = {
  title: string
  note_text: string
  card_images: string[]
  main_photo: string
  colors: CardData['colors']
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

function getConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }
  return { url: SUPABASE_URL, key: SUPABASE_ANON_KEY }
}

function useWorkerProxy(): boolean {
  return window.location.hostname.endsWith('.workers.dev')
}

function getEndpoint(config: { url: string }, path: string): string {
  return useWorkerProxy()
    ? `${window.location.origin}${WORKER_PROXY_PREFIX}${path}`
    : `${config.url}${path}`
}

function getPublicImageUrl(config: { url: string }, id: string, filename: string): string {
  const path = `/storage/v1/object/public/${STORAGE_BUCKET}/${id}/${filename}`
  return getEndpoint(config, path)
}

function makeShortId(): string {
  const values = crypto.getRandomValues(new Uint8Array(10))
  return Array.from(values, (value) => ID_ALPHABET[value % ID_ALPHABET.length]).join('')
}

async function responseError(response: Response): Promise<Error> {
  const detail = await response.text().catch(() => '')
  return new Error(`Supabase request failed (${response.status})${detail ? `: ${detail.slice(0, 300)}` : ''}`)
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Supabase request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds.`)
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

async function uploadImage(
  id: string,
  filename: string,
  dataUrl: string,
  config: { url: string; key: string },
): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob()
  const objectPath = `${id}/${filename}`
  const response = await fetchWithTimeout(
    getEndpoint(config, `/storage/v1/object/${STORAGE_BUCKET}/${objectPath.split('/').map(encodeURIComponent).join('/')}`),
    {
      method: 'POST',
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        'Content-Type': blob.type || 'image/jpeg',
        'Cache-Control': '3600',
        'x-upsert': 'false',
      },
      body: blob,
    },
  )
  if (!response.ok) throw await responseError(response)
  return getPublicImageUrl(config, id, filename)
}

export async function saveSharedCard(data: CardData): Promise<string> {
  const config = getConfig()
  const id = makeShortId()
  const imageNames = ['card-1.jpg', 'card-2.jpg', 'card-3.jpg']
  const [cardImages, mainPhoto] = await Promise.all([
    Promise.all(data.cardImages.map((image, index) => uploadImage(id, imageNames[index], image, config))),
    uploadImage(id, 'main-photo.jpg', data.mainPhoto, config),
  ])

  const row: SharedCardRow = {
    title: data.title,
    note_text: data.noteText,
    card_images: cardImages,
    main_photo: mainPhoto,
    colors: normalizeColorTheme(data.colors),
  }
  const response = await fetchWithTimeout(getEndpoint(config, '/rest/v1/rpc/create_shared_card'), {
    method: 'POST',
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_id: id,
      p_title: row.title,
      p_note_text: row.note_text,
      p_card_images: row.card_images,
      p_main_photo: row.main_photo,
      p_colors: row.colors,
    }),
  })
  if (!response.ok) throw await responseError(response)
  return id
}

export async function fetchSharedCard(id: string): Promise<CardData | null> {
  if (!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{10}$/.test(id)) return null
  const config = getConfig()
  const response = await fetchWithTimeout(getEndpoint(config, '/rest/v1/rpc/get_shared_card'), {
    method: 'POST',
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_id: id }),
  })
  if (!response.ok) throw await responseError(response)
  const rows = await response.json() as SharedCardRow[]
  const row = rows[0]
  if (!row || row.card_images?.length !== 3) return null
  return {
    title: row.title,
    noteText: row.note_text,
    cardImages: row.card_images,
    mainPhoto: row.main_photo,
    colors: normalizeColorTheme(row.colors),
  }
}
