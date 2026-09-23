import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { decodeCardData } from '../utils/cardData'
import { DEFAULT_THEME } from '../utils/colorTheme'
import { LoadingScreen } from '../components/LoadingScreen'
import { CardStack } from '../components/CardStack'
import { CuteUnlockSlider } from '../components/CuteUnlockSlider'
import { AnimatedBackground } from '../components/AnimatedBackground'

export function ViewerPage() {
  const { data } = useParams<{ data: string }>()
  const [hasLoaded, setHasLoaded] = useState(false)
  const [hasFinishedSequence, setHasFinishedSequence] = useState(false)

  // Decode card data from URL
  const cardData = data ? decodeCardData(data) : null
  const colors = cardData?.colors ?? DEFAULT_THEME

  if (!cardData) {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-b from-[#fff5f9] to-[#ffe4ef] font-sans text-blossom-900">
        <div className="text-center">
          <p className="mb-4 text-5xl">💔</p>
          <h1 className="font-display text-2xl font-bold text-blossom-600">
            Invalid Card Link
          </h1>
          <p className="mt-2 text-sm text-blossom-400">
            This link might be broken or expired.
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
      {!hasLoaded && <LoadingScreen onComplete={() => setHasLoaded(true)} />}
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
