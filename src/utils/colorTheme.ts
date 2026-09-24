export type ColorTheme = {
  bgFrom: string
  bgTo: string
  cardBorder: string
  cardBg: string
  titleCardBg: string
  titleText: string
  foregroundBg: string
  photoBorder: string
  notebookBg: string
  noteText: string
}

// Label mapping for UI display
export const COLOR_LABELS: Record<keyof ColorTheme, string> = {
  bgFrom: 'Background Start',
  bgTo: 'Background End',
  cardBorder: 'Card Border',
  cardBg: 'Card Overlay',
  titleCardBg: 'Title Card',
  titleText: 'Title Text',
  foregroundBg: 'Unlock Card',
  photoBorder: 'Photo Border',
  notebookBg: 'Notebook',
  noteText: 'Note Text',
}

export const PRESET_THEMES: { name: string; emoji: string; theme: ColorTheme }[] = [
  {
    name: 'Pink',
    emoji: '🩷',
    theme: {
      bgFrom: '#fce4ec',
      bgTo: '#f8bbd0',
      cardBorder: '#ffffff',
      cardBg: '#f48fb1',
      titleCardBg: '#ec5f8f',
      titleText: '#ffffff',
      foregroundBg: '#be185d',
      photoBorder: '#f472a4',
      notebookBg: '#fce4ec',
      noteText: '#9d174d',
    },
  },
  {
    name: 'Blue',
    emoji: '💙',
    theme: {
      bgFrom: '#e3f2fd',
      bgTo: '#bbdefb',
      cardBorder: '#ffffff',
      cardBg: '#90caf9',
      titleCardBg: '#5b8dee',
      titleText: '#ffffff',
      foregroundBg: '#1e40af',
      photoBorder: '#60a5fa',
      notebookBg: '#e3f2fd',
      noteText: '#1e3a5f',
    },
  },
  {
    name: 'Purple',
    emoji: '💜',
    theme: {
      bgFrom: '#f3e8ff',
      bgTo: '#e9d5ff',
      cardBorder: '#ffffff',
      cardBg: '#c4b5fd',
      titleCardBg: '#8b5cf6',
      titleText: '#ffffff',
      foregroundBg: '#6d28d9',
      photoBorder: '#a78bfa',
      notebookBg: '#f3e8ff',
      noteText: '#5b21b6',
    },
  },
  {
    name: 'Mint',
    emoji: '🌿',
    theme: {
      bgFrom: '#ecfdf5',
      bgTo: '#d1fae5',
      cardBorder: '#ffffff',
      cardBg: '#6ee7b7',
      titleCardBg: '#34d399',
      titleText: '#ffffff',
      foregroundBg: '#065f46',
      photoBorder: '#34d399',
      notebookBg: '#ecfdf5',
      noteText: '#065f46',
    },
  },
  {
    name: 'Peach',
    emoji: '🍑',
    theme: {
      bgFrom: '#fff7ed',
      bgTo: '#fed7aa',
      cardBorder: '#ffffff',
      cardBg: '#fdba74',
      titleCardBg: '#fb923c',
      titleText: '#ffffff',
      foregroundBg: '#9a3412',
      photoBorder: '#f97316',
      notebookBg: '#fff7ed',
      noteText: '#9a3412',
    },
  },
]

export const DEFAULT_THEME: ColorTheme = PRESET_THEMES[0].theme

// ─── Auto-generate full theme from a single primary color ────
import chroma from 'chroma-js'

export function generateThemeFromColor(primary: string): ColorTheme {
  const base = chroma(primary)
  const h = base.get('hsl.h') || 0

  return {
    bgFrom: chroma.hsl(h, 0.6, 0.95).hex(),
    bgTo: chroma.hsl(h, 0.55, 0.85).hex(),
    cardBorder: '#ffffff',
    cardBg: base.luminance(0.35).hex(),
    titleCardBg: base.hex(),
    titleText: '#ffffff',
    foregroundBg: base.darken(2).hex(),
    photoBorder: base.luminance(0.25).hex(),
    notebookBg: chroma.hsl(h, 0.6, 0.95).hex(),
    noteText: base.darken(2.5).hex(),
  }
}
