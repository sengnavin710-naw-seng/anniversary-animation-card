import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { decodeCardData, type CardData } from '../utils/cardData'
import { normalizeColorTheme } from '../utils/colorTheme'
import { fetchSharedCard, isSupabaseConfigured } from '../utils/supabase'
import { LoadingScreen } from '../components/LoadingScreen'
import { CardStack } from '../components/CardStack'
import { CuteUnlockSlider } from '../components/CuteUnlockSlider'
import { AnimatedBackground } from '../components/AnimatedBackground'
import { resumeAudio } from '../utils/sounds'

export function ViewerPage() {
  const { data } = useParams<{ data: string }>()
  const [cardData, setCardData] = useState<CardData | null>(() => data ? decodeCardData(data) : null)
  const [isLoadingSharedCard, setIsLoadingSharedCard] = useState(() => Boolean(data && !decodeCardData(data)))
  const [shareLoadError, setShareLoadError] = useState('')
  const [hasStarted, setHasStarted] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [hasFinishedSequence, setHasFinishedSequence] = useState(false)

  useEffect(() => {
    let cancelled = false
    const embeddedData = data ? decodeCardData(data) : null

    if (embeddedData) {
      setCardData(embeddedData)
      setShareLoadError('')
      setIsLoadingSharedCard(false)
      return () => { cancelled = true }
    }

    setCardData(null)
    if (!data || !/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{10}$/.test(data)) {
      setShareLoadError('This card link is invalid or expired.')
      setIsLoadingSharedCard(false)
      return () => { cancelled = true }
    }
    if (!isSupabaseConfigured()) {
      setShareLoadError('Shared cards are not configured yet.')
      setIsLoadingSharedCard(false)
      return () => { cancelled = true }
    }

    setIsLoadingSharedCard(true)
    setShareLoadError('')
    void fetchSharedCard(data)
      .then((sharedCard) => {
        if (cancelled) return
        setCardData(sharedCard)
        if (!sharedCard) setShareLoadError('This card link is invalid or expired.')
      })
      .catch(() => {
        if (!cancelled) setShareLoadError('Could not load this card. Please try again later.')
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSharedCard(false)
      })

    return () => { cancelled = true }
  }, [data])

  const colors = normalizeColorTheme(cardData?.colors)

  if (!cardData) {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-b from-[#fff5f9] to-[#ffe4ef] font-sans text-blossom-900">
        <div className="text-center">
          <p className="mb-4 text-5xl">{isLoadingSharedCard ? '💗' : '💔'}</p>
          <h1 className="font-display text-2xl font-bold text-blossom-600">
            {isLoadingSharedCard ? 'Loading Card…' : 'Card Unavailable'}
          </h1>
          <p className="mt-2 text-sm text-blossom-400">
            {isLoadingSharedCard ? 'Please wait while we open this card.' : shareLoadError || 'This card link might be broken or expired.'}
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-full bg-blossom-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-1"
          >
            Create Your Own ♡
          </Link>
        </div>
      </div>
    )
  }

  // Handle tap to start — resume AudioContext + start loading
  const handleStart = () => {
    resumeAudio()
    setHasStarted(true)
  }

  return (
    <>
      <AnimatedBackground phase={hasLoaded ? 'home' : 'loading'} colors={colors} />
      {/* Floating back button */}
      <Link
        to="/"
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/30 text-lg text-white backdrop-blur-sm transition hover:bg-white/50"
        aria-label="Back to home"
      >
        ←
      </Link>

      {/* Tap to Start — ensures AudioContext is resumed before any sounds */}
      {!hasStarted && (
        <div
          className="fixed inset-0 z-50 grid cursor-pointer place-items-center"
          onClick={handleStart}
          onTouchEnd={handleStart}
        >
          <div className="flex flex-col items-center gap-6 text-center">
            <span className="animate-pulse text-7xl drop-shadow-lg">💗</span>
            <div>
              <p className="font-display text-2xl font-bold text-white drop-shadow-md">
                Tap to Start
              </p>
              <p className="mt-1 text-sm text-white/70 drop-shadow-sm">
                ✨ แตะเพื่อเริ่มต้น ✨
              </p>
            </div>
          </div>
        </div>
      )}

      {hasStarted && !hasLoaded && <LoadingScreen orbitStarColor={colors.orbitStarColor} onComplete={() => setHasLoaded(true)} />}
      {hasLoaded && !hasFinishedSequence && (
        <CardStack
          cardImages={cardData.cardImages}
          colors={colors}
          onComplete={() => setHasFinishedSequence(true)}
        />
      )}
      {hasFinishedSequence && (
        <CuteUnlockSlider
          title={cardData.title}
          noteText={cardData.noteText}
          mainPhoto={cardData.mainPhoto}
          colors={colors}
        />
      )}
    </>
  )
}
