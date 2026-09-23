import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { HexColorPicker } from 'react-colorful'
import type { ColorTheme } from '../utils/colorTheme'
import { DEFAULT_THEME, PRESET_THEMES, COLOR_LABELS } from '../utils/colorTheme'
import { resizeImage } from '../utils/imageUtils'
import { encodeCardData } from '../utils/cardData'
import { saveToHistory } from '../utils/history'
import anniversaryPhoto from '../assets/anniversary-photo.jpg'

type DraftData = {
  title: string
  noteText: string
  cardFiles: string[]   // preview URLs
  mainFile: string      // preview URL
  cardBlobs: string[]   // base64 data URLs
  mainBlob: string
  isDemo?: boolean
}

const DEMO_DRAFT: DraftData = {
  title: 'Happy Anniversary 3Years',
  noteText: 'Lorem ipsum dolor sit amet.\nConsectetur adipiscing elit.\nA little note written with love.\nHappy anniversary, always. ♡',
  cardFiles: [anniversaryPhoto, anniversaryPhoto, anniversaryPhoto],
  mainFile: anniversaryPhoto,
  cardBlobs: [],
  mainBlob: '',
  isDemo: true,
}

export function CustomizePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isSaveMode = (location.state as { mode?: string })?.mode === 'save'

  const [colors, setColors] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem('cute-template-colors')
    if (saved) {
      try { return JSON.parse(saved) } catch { /* ignore */ }
    }
    return DEFAULT_THEME
  })
  const [activeKey, setActiveKey] = useState<keyof ColorTheme | null>(null)
  const [draft, setDraft] = useState<DraftData>(DEMO_DRAFT)
  const [isGenerating, setIsGenerating] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [showPopup, setShowPopup] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Only load draft if NOT in save mode (i.e. came from Editor)
    if (isSaveMode) return
    const raw = localStorage.getItem('cute-template-draft')
    if (raw) {
      try {
        setDraft(JSON.parse(raw))
      } catch {
        // Keep demo draft
      }
    }
  }, [])

  const updateColor = (key: keyof ColorTheme, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }))
  }

  const [toast, setToast] = useState('')

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const handleSaveColors = () => {
    localStorage.setItem('cute-template-colors', JSON.stringify(colors))
    setToast('Colors saved! ✅ Your template will use these colors.')
  }

  const createCard = async (useColors: ColorTheme) => {
    setIsGenerating(true)
    try {
      const cardImages = await Promise.all(
        draft.cardBlobs.map(async (b64) => {
          const resp = await fetch(b64)
          const blob = await resp.blob()
          const file = new File([blob], 'card.jpg', { type: blob.type })
          return resizeImage(file)
        }),
      )
      const mainResp = await fetch(draft.mainBlob)
      const mainBlobData = await mainResp.blob()
      const mainFile = new File([mainBlobData], 'main.jpg', { type: mainBlobData.type })
      const mainPhoto = await resizeImage(mainFile)

      const encoded = encodeCardData({
        title: draft.title,
        noteText: draft.noteText,
        cardImages,
        mainPhoto,
        colors: useColors,
      })
      const link = `${window.location.origin}${window.location.pathname}#/view/${encoded}`
      setShareLink(link)
      saveToHistory(draft.title, link)
      setShowPopup(true)
      setCopied(false)
    } catch (err) {
      console.error(err)
      alert('Failed to process. Please go back and try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreate = async () => {
    if (isSaveMode) {
      handleSaveColors()
      return
    }
    await createCard(colors)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
    } catch {
      const input = document.createElement('input')
      input.value = shareLink
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const colorKeys = Object.keys(COLOR_LABELS) as (keyof ColorTheme)[]

  return (
    <div className="min-h-screen font-sans text-blossom-900 antialiased" style={{ background: `linear-gradient(to bottom, ${colors.bgFrom}, ${colors.bgTo})` }}>
      <div className="mx-auto max-w-lg px-4 py-5">
        {/* Navbar */}
        <nav className="mb-5 flex items-center">
          <button
            onClick={() => navigate('/create')}
            className="flex items-center gap-1 rounded-full bg-white/80 px-3.5 py-2 text-sm font-semibold text-blossom-500 shadow-sm backdrop-blur-sm transition hover:shadow-md"
          >
            <span className="text-lg">←</span> Back
          </button>
          <h1 className="flex-1 text-center font-display text-lg font-bold text-blossom-600 sm:text-xl">
            Customize Colors 🎨
          </h1>
          <div className="w-[4.5rem]" />
        </nav>

        {/* ═══ Live Preview ═══ */}
        <div className="mb-5 overflow-hidden rounded-[1.5rem] bg-white/30 p-3 shadow-inner backdrop-blur-sm">
          <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-widest text-blossom-400">Live Preview</p>
          <div className="relative mx-auto flex max-w-[16rem] flex-col items-center gap-2.5">
            {/* Mini Card */}
            <div
              className="h-24 w-16 rounded-lg border-2 bg-cover bg-center shadow-md"
              style={{
                borderColor: colors.cardBorder,
                backgroundColor: colors.cardBg,
                backgroundImage: draft.cardFiles[0] ? `url(${draft.cardFiles[0]})` : undefined,
              }}
            />

            {/* Title Card */}
            <div
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 shadow-md"
              style={{ background: `linear-gradient(120deg, ${colors.titleCardBg}88, ${colors.titleCardBg})` }}
            >
              <p className="text-xs font-bold" style={{ color: colors.titleText }}>
                {draft.title}
              </p>
              <span className="text-sm">♡</span>
            </div>

            {/* Main Photo */}
            <div
              className="aspect-square w-28 overflow-hidden rounded-xl border-[3px] shadow-lg"
              style={{ borderColor: colors.photoBorder }}
            >
              {draft.mainFile && (
                <img src={draft.mainFile} alt="Preview" className="h-full w-full object-cover" />
              )}
            </div>

            {/* Notebook */}
            <div
              className="w-full rounded-xl px-3 py-2.5 shadow-md"
              style={{ backgroundColor: colors.notebookBg }}
            >
              <p className="text-[10px] font-medium leading-relaxed" style={{ color: colors.noteText }}>
                {draft.noteText.slice(0, 60)}...
              </p>
            </div>
          </div>
        </div>

        {/* ═══ Preset Themes ═══ */}
        <div className="mb-4">
          <p className="mb-2 text-center text-xs font-semibold text-blossom-500">Preset Themes</p>
          <div className="flex justify-center gap-3">
            {PRESET_THEMES.map((preset) => {
              const isActive = colors.titleCardBg === preset.theme.titleCardBg
              return (
                <button
                  key={preset.name}
                  onClick={() => { setColors(preset.theme); setActiveKey(null) }}
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-lg shadow-md transition hover:scale-110 ${
                    isActive ? 'ring-2 ring-offset-2 ring-blossom-500' : ''
                  }`}
                  style={{ background: `linear-gradient(135deg, ${preset.theme.bgFrom}, ${preset.theme.titleCardBg})` }}
                  title={preset.name}
                >
                  {preset.emoji}
                </button>
              )
            })}
          </div>
        </div>

        {/* ═══ Custom Colors ═══ */}
        <div className="mb-6 rounded-2xl bg-white/60 p-4 shadow-sm backdrop-blur-sm">
          <p className="mb-3 text-center text-xs font-semibold text-blossom-500">Custom Colors</p>
          <div className="grid grid-cols-2 gap-2">
            {colorKeys.map((key) => (
              <button
                key={key}
                onClick={() => setActiveKey(activeKey === key ? null : key)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left transition ${
                  activeKey === key ? 'bg-blossom-100 ring-1 ring-blossom-300' : 'hover:bg-blossom-50'
                }`}
              >
                <div
                  className="h-6 w-6 shrink-0 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: colors[key] }}
                />
                <span className="text-[10px] font-semibold text-blossom-600">{COLOR_LABELS[key]}</span>
              </button>
            ))}
          </div>

          {/* Color Picker */}
          {activeKey && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="text-xs font-bold text-blossom-600">{COLOR_LABELS[activeKey]}</p>
              <HexColorPicker
                color={colors[activeKey]}
                onChange={(val) => updateColor(activeKey, val)}
                style={{ width: '100%', maxWidth: 240, height: 160 }}
              />
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full border shadow-sm" style={{ backgroundColor: colors[activeKey] }} />
                <span className="text-xs font-mono font-medium text-blossom-500">{colors[activeKey]}</span>
              </div>
            </div>
          )}
        </div>

        {/* ═══ Actions ═══ */}
        {isSaveMode ? (
          <button
            onClick={handleSaveColors}
            className="w-full rounded-full bg-gradient-to-r from-blossom-500 to-blossom-600 px-8 py-4 text-base font-bold tracking-wide text-white shadow-lg shadow-blossom-300/40 transition hover:-translate-y-1 hover:shadow-xl"
          >
            Save Colors 💾
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={isGenerating}
            className="w-full rounded-full bg-gradient-to-r from-blossom-500 to-blossom-600 px-8 py-4 text-base font-bold tracking-wide text-white shadow-lg shadow-blossom-300/40 transition hover:-translate-y-1 hover:shadow-xl disabled:opacity-50"
          >
            {isGenerating ? 'Creating...' : 'Create ♡'}
          </button>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
            <div className="animate-[popup_0.25s_ease-out] rounded-2xl bg-white px-5 py-3 shadow-lg shadow-blossom-300/20 border border-blossom-200">
              <p className="text-sm font-medium text-blossom-700">{toast}</p>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Share Popup ═══ */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowPopup(false)} />
          <div className="relative z-10 w-full max-w-sm animate-[popup_0.3s_ease-out] overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="px-6 py-5 text-center" style={{ background: `linear-gradient(to right, ${colors.titleCardBg}, ${colors.foregroundBg})` }}>
              <p className="mb-1 text-3xl">🎉</p>
              <h2 className="font-display text-xl font-bold text-white">Card Created!</h2>
              <p className="mt-1 text-xs text-white/80">Share the link with your loved one ♡</p>
            </div>
            <div className="px-6 py-5">
              <label className="mb-1.5 block text-xs font-semibold text-blossom-500">Share Link</label>
              <div className="mb-4 flex items-center gap-2">
                <div className="min-w-0 flex-1 overflow-hidden rounded-xl border-2 border-blossom-100 bg-blossom-50/50 px-3 py-2.5">
                  <p className="truncate text-xs font-medium text-blossom-700">{shareLink}</p>
                </div>
                <button
                  onClick={handleCopy}
                  className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                    copied ? 'bg-green-100 text-green-600' : 'bg-blossom-100 text-blossom-600 hover:bg-blossom-200'
                  }`}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <a href={shareLink} target="_blank" rel="noopener noreferrer" className="mb-3 block w-full rounded-full py-3.5 text-center text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5" style={{ background: `linear-gradient(to right, ${colors.titleCardBg}, ${colors.foregroundBg})` }}>
                Preview Card ♡
              </a>
              <button onClick={() => setShowPopup(false)} className="w-full rounded-full border-2 border-blossom-200 py-3 text-sm font-semibold text-blossom-400 transition hover:bg-blossom-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
