import { useEffect, useState } from 'react'
import { CuteUnlockSlider } from './components/CuteUnlockSlider'
import { AnimatedBackground, type BackgroundPhase } from './components/AnimatedBackground'
import { LoadingScreen } from './components/LoadingScreen'
import { NumberTrail } from './components/NumberTrail'

function App() {
  const [hasLoaded, setHasLoaded] = useState(false)
  const [hasFinishedSequence, setHasFinishedSequence] = useState(false)
  const [activeNumber, setActiveNumber] = useState<1 | 2 | 3 | null>(null)
  const [backgroundPhase, setBackgroundPhase] = useState<BackgroundPhase>('loading')

  useEffect(() => {
    if (!hasLoaded) return

    let isCancelled = false
    const timerIds = new Set<number>()
    const wait = (duration: number) =>
      new Promise<void>((resolve) => {
        const timerId = window.setTimeout(() => {
          timerIds.delete(timerId)
          resolve()
        }, duration)
        timerIds.add(timerId)
      })

    const playNumbers = async () => {
      for (const number of [1, 2, 3] as const) {
        if (isCancelled) return
        setActiveNumber(number)
        setBackgroundPhase(number === 1 ? 'one' : number === 2 ? 'two' : 'three')
        await wait(1000)

        if (isCancelled) return
        setActiveNumber(null)
        await wait(350)
      }

      if (!isCancelled) {
        setBackgroundPhase('home')
        setHasFinishedSequence(true)
      }
    }

    void playNumbers()

    return () => {
      isCancelled = true
      timerIds.forEach((timerId) => window.clearTimeout(timerId))
    }
  }, [hasLoaded])

  return (
    <>
      <AnimatedBackground phase={backgroundPhase} />
      <LoadingScreen onComplete={() => setHasLoaded(true)} />
      {hasLoaded && !hasFinishedSequence && (
        <NumberTrail activeNumber={activeNumber} />
      )}
      {hasFinishedSequence && <CuteUnlockSlider />}
    </>
  )
}

export default App
