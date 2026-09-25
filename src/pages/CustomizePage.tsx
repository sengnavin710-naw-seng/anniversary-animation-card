import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Photoshop from '@uiw/react-color-colorful'
import type { ColorTheme } from '../utils/colorTheme'
import { DEFAULT_THEME, generateThemeFromColor, normalizeColorTheme } from '../utils/colorTheme'
import { resizeImage } from '../utils/imageUtils'
import { saveToHistory } from '../utils/history'
import { saveSharedCard } from '../utils/supabase'
import { AnimatedBackground } from '../components/AnimatedBackground'
import { LoadingScreen } from '../components/LoadingScreen'
import { CardStack } from '../components/CardStack'
import { CuteUnlockSlider } from '../components/CuteUnlockSlider'
import anniversaryPhoto from '../assets/anniversary-photo.jpg'

type DraftData = {
  title: string
  noteText: string
  cardFiles: string[]
  mainFile: string
  cardBlobs: string[]
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

type ColorMenuKey = 'background' | 'orbitStars' | 'photoFrame' | 'heartReveal'

export function CustomizePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isSaveMode = (location.state as { mode?: string })?.mode === 'save'

  const [colors, setColors] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem('cute-template-colors')
    if (saved) {
      try { return normalizeColorTheme(JSON.parse(saved)) } catch { /* ignore */ }
    }
    return DEFAULT_THEME
  })
  const [colorMenu, setColorMenu] = useState<ColorMenuKey>('background')
  const [primaryColor, setPrimaryColor] = useState(() => colors.titleCardBg)
  const [draft, setDraft] = useState<DraftData>(DEMO_DRAFT)
  const [isGenerating, setIsGenerating] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [showPopup, setShowPopup] = useState(false)
  const [copied, setCopied] = useState(false)
  const [hexInput, setHexInput] = useState(() => colors.titleCardBg)

  const [toast, setToast] = useState('')
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (isSaveMode) return
    const raw = localStorage.getItem('cute-template-draft')
    if (raw) {
      try { setDraft(JSON.parse(raw)) } catch { /* */ }
    }
  }, [isSaveMode])

  const handleAutoGenerate = (hex: string) => {
    setPrimaryColor(hex)
    try {
      const generated = generateThemeFromColor(hex)
      setColors(generated)
    } catch { /* invalid color */ }
  }

  const colorMenus: { key: ColorMenuKey; label: string; icon: string; themeKey?: keyof ColorTheme }[] = [
    { key: 'background', label: 'Background', icon: '🌈' },
    { key: 'orbitStars', label: 'Orbit Stars', icon: '✨', themeKey: 'orbitStarColor' },
    { key: 'photoFrame', label: 'Photo Frame', icon: '🖼️', themeKey: 'photoBorder' },
    { key: 'heartReveal', label: 'Heart Reveal', icon: '💗', themeKey: 'revealOverlay' },
  ]
  const selectedColorMenu = colorMenus.find((item) => item.key === colorMenu)!
  const selectedColor = colorMenu === 'background'
    ? primaryColor
    : colors[selectedColorMenu.themeKey!]

  const updateSelectedColor = (hex: string) => {
    setHexInput(hex)
    if (colorMenu === 'background') {
      setPrimaryColor(hex)
      if (/^#[0-9a-f]{6}$/i.test(hex)) handleAutoGenerate(hex)
      return
    }

    setColors((prev) => ({ ...prev, [selectedColorMenu.themeKey!]: hex }))
  }

  const handleSaveColors = () => {
    localStorage.setItem('cute-template-colors', JSON.stringify(colors))
    setToast('Colors saved! ✅')
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
      const title = draft.title?.trim() ? draft.title.trim() : 'Happy Anniversary 3Years'
      const cardData = {
        title,
        noteText: draft.noteText,
        cardImages,
        mainPhoto,
        colors: useColors,
      }

      const id = await saveSharedCard(cardData)
      const link = `${window.location.origin}${window.location.pathname}#/view/${id}`

      setShareLink(link)
      saveToHistory(title, link)
      setShowPopup(true)
      setCopied(false)
    } catch (err) {
      console.error(err)
      const detail = err instanceof Error ? err.message : String(err)
      alert(`Could not create the short share link. Check the Cloudflare Worker runtime variables and Supabase setup, then try again.\n\nDetails: ${detail.slice(0, 400)}`)
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

  return (
    <div className="min-h-screen font-sans text-blossom-900 antialiased" style={{ background: `linear-gradient(to bottom, ${colors.bgFrom}, ${colors.bgTo})` }}>
      <div className="mx-auto max-w-lg px-4 py-5">
        {/* Navbar */}
        <nav className="mb-5 flex items-center">
          <button
            onClick={() => navigate(isSaveMode ? '/' : '/create')}
            className="flex items-center gap-1 rounded-full bg-white/80 px-3.5 py-2 text-sm font-semibold text-blossom-500 shadow-sm backdrop-blur-sm transition hover:shadow-md"
          >
            <span className="text-lg">←</span> Back
          </button>
          <h1 className="flex-1 text-center font-display text-lg font-bold text-blossom-600 sm:text-xl">
            {isSaveMode ? 'Customize Template 🎨' : 'Customize Colors 🎨'}
          </h1>
          <div className="w-[4.5rem]" />
        </nav>

        {/* ═══ Live Preview Carousel ═══ */}
        <div className="mb-5 overflow-hidden rounded-[1.5rem] bg-white/30 p-3 shadow-inner backdrop-blur-sm">
          <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-widest text-blossom-400">Live Preview</p>
          <PreviewCarousel colors={colors} draft={draft} />
        </div>

        {/* ═══ Color Menu ═══ */}
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-white/50 p-2 backdrop-blur-sm">
          {colorMenus.map((item) => {
            const swatch = item.key === 'background' ? primaryColor : colors[item.themeKey!]
            return (
              <button
                key={item.key}
                onClick={() => { setColorMenu(item.key); setHexInput(swatch) }}
                aria-pressed={colorMenu === item.key}
                className={`flex min-h-12 items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold transition ${
                  colorMenu === item.key
                    ? 'bg-white text-blossom-600 shadow-md ring-1 ring-blossom-200'
                    : 'text-blossom-500 hover:bg-white/60'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="flex-1 leading-tight">{item.label}</span>
                <span className="h-5 w-5 shrink-0 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: swatch }} />
              </button>
            )
          })}
        </div>

        <div className="mb-6 rounded-2xl bg-white/60 p-4 shadow-sm backdrop-blur-sm">
          <p className="mb-1 text-center text-xs font-bold text-blossom-600">{selectedColorMenu.label}</p>
          <p className="mb-3 text-center text-[11px] text-blossom-400">
            {colorMenu === 'background'
              ? 'Choose a color to generate a matching theme.'
              : 'Choose a color and see it update in the preview.'}
          </p>
          <div className="flex flex-col items-center gap-3">
            <Photoshop
              color={selectedColor}
              onChange={(color) => updateSelectedColor(color.hex)}
              style={{ width: '100%', maxWidth: 280 }}
            />
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: selectedColor }} />
              <input
                type="text"
                value={hexInput}
                onChange={(e) => {
                  const value = e.target.value
                  setHexInput(value)
                  if (/^#[0-9a-f]{6}$/i.test(value)) updateSelectedColor(value)
                }}
                onBlur={() => setHexInput(selectedColor)}
                className="w-24 rounded-lg border border-blossom-200 px-2 py-1.5 text-center font-mono text-xs font-bold text-blossom-700 focus:outline-none focus:ring-2 focus:ring-blossom-300"
                aria-label={`${selectedColorMenu.label} hex color`}
              />
            </div>
          </div>
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

// ─── Preview Carousel ─────────────────────────────────────────
const SLIDE_LABELS = ['Loading', 'Cards', 'Unlock', 'Unlocked']
const FRAME_W = 375
const FRAME_H = 667

function PreviewCarousel({ colors, draft }: { colors: ColorTheme; draft: { title: string; noteText: string; cardFiles: string[]; mainFile: string } }) {
  const [active, setActive] = useState(0)
  const total = 4
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  const startX = useRef(0)
  const isDragging = useRef(false)

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth
        setScale(w / FRAME_W)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const goTo = useCallback((i: number) => {
    setActive(Math.max(0, Math.min(total - 1, i)))
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX
    isDragging.current = true
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    isDragging.current = false
    const diff = e.clientX - startX.current
    if (Math.abs(diff) > 40) {
      goTo(active + (diff < 0 ? 1 : -1))
    }
  }

  const scaledH = FRAME_H * scale

  return (
    <div className="relative select-none">
      <p className="mb-1.5 text-center text-[9px] font-bold uppercase tracking-wider text-blossom-400/70">
        {SLIDE_LABELS[active]}
      </p>

      <div
        ref={containerRef}
        className="overflow-hidden rounded-2xl"
        style={{ height: scaledH }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { isDragging.current = false }}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {/* Slide 1: Loading */}
          <div className="w-full shrink-0 overflow-hidden">
            <MiniFrame scale={scale} colors={colors}>
              <AnimatedBackground phase="loading" colors={colors} />
              <LoadingScreen fixedProgress={50} soundEnabled={false} orbitStarColor={colors.orbitStarColor} />
            </MiniFrame>
          </div>

          {/* Slide 2: Card Swipe */}
          <div className="w-full shrink-0 overflow-hidden">
            <MiniFrame scale={scale} colors={colors}>
              <AnimatedBackground phase="home" colors={colors} />
              <CardStack cardImages={draft.cardFiles} colors={colors} soundEnabled={false} />
            </MiniFrame>
          </div>

          {/* Slide 3: Unlock Button */}
          <div className="w-full shrink-0 overflow-hidden">
            <MiniFrame scale={scale} colors={colors}>
              <AnimatedBackground phase="home" colors={colors} />
              <div className="absolute inset-0 z-20 grid place-items-center">
                <div
                  className="rounded-2xl px-10 py-5 text-center shadow-2xl"
                  style={{ backgroundColor: colors.foregroundBg }}
                >
                  <p className="font-display text-xl font-bold tracking-wide text-white">
                    Slide down to unlock ♡
                  </p>
                  <p className="mt-1 font-sans text-xs font-semibold text-white/70">
                    ลากลงให้สุดเพื่อปลดล็อก
                  </p>
                </div>
              </div>
            </MiniFrame>
          </div>

          {/* Slide 4: After Unlock (Title + Photo + Message) */}
          <div className="w-full shrink-0 overflow-hidden">
            <MiniFrame scale={scale} colors={colors}>
              <AnimatedBackground phase="home" colors={colors} />
              <div className="absolute inset-0 z-20 overflow-hidden">
                <div
                  style={{
                    position: 'absolute',
                    width: FRAME_W,
                    height: FRAME_H,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) scale(0.7)',
                  }}
                >
                  <CuteUnlockSlider
                    title={draft.title}
                    noteText={draft.noteText}
                    mainPhoto={draft.mainFile}
                    colors={colors}
                    initiallyUnlocked
                  />
                </div>
              </div>
            </MiniFrame>
          </div>
        </div>
      </div>

      {/* Navigation: Arrows + Scaling Dots */}
      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          onClick={() => goTo(active - 1)}
          disabled={active === 0}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-lg font-bold shadow-sm transition hover:bg-white disabled:opacity-25"
          style={{ color: colors.titleCardBg }}
        >
          ‹
        </button>
        <div className="flex items-center gap-2">
          {Array.from({ length: total }).map((_, i) => {
            const dist = Math.abs(active - i)
            const size = dist === 0 ? 10 : dist === 1 ? 7 : 5
            const opacity = dist === 0 ? 1 : dist === 1 ? 0.6 : 0.3
            return (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="rounded-full transition-all duration-300"
                style={{ width: size, height: size, backgroundColor: colors.titleCardBg, opacity }}
              />
            )
          })}
        </div>
        <button
          onClick={() => goTo(active + 1)}
          disabled={active === total - 1}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-lg font-bold shadow-sm transition hover:bg-white disabled:opacity-25"
          style={{ color: colors.titleCardBg }}
        >
          ›
        </button>
      </div>
    </div>
  )
}

function MiniFrame({ scale, colors, children }: { scale: number; colors: ColorTheme; children: React.ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{ width: FRAME_W * scale, height: FRAME_H * scale }}
    >
      <div
        className="pointer-events-none relative overflow-hidden"
        style={{
          width: FRAME_W,
          height: FRAME_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          background: `linear-gradient(to bottom, ${colors.bgFrom}, ${colors.bgTo})`,
        }}
      >
        {/* Override viewport units: transform creates containing block for fixed elements */}
        <div className="absolute inset-0" style={{ containerType: 'size' as never }}>
          {children}
        </div>
      </div>
    </div>
  )
}
