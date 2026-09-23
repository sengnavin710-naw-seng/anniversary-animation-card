const STORAGE_KEY = 'cute-template-history'
const MAX_HISTORY = 10

export type CardHistory = {
  id: string
  title: string
  createdAt: number // timestamp
  link: string
}

export function saveToHistory(title: string, link: string): void {
  const history = getHistory()
  const entry: CardHistory = {
    id: crypto.randomUUID?.() ?? String(Date.now()),
    title,
    createdAt: Date.now(),
    link,
  }
  // Prepend new entry, remove duplicates by link, limit to MAX_HISTORY
  const filtered = history.filter((h) => h.link !== link)
  const updated = [entry, ...filtered].slice(0, MAX_HISTORY)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function getHistory(): CardHistory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CardHistory[]
  } catch {
    return []
  }
}

export function removeFromHistory(id: string): void {
  const history = getHistory().filter((h) => h.id !== id)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    // silently fail
  }
}
