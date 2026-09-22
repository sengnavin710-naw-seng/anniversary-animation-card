import { useState } from 'react'
import { CuteUnlockSlider } from './components/CuteUnlockSlider'
import { AnimatedBackground, type BackgroundPhase } from './components/AnimatedBackground'
import { LoadingScreen } from './components/LoadingScreen'
import { CardStack } from './components/CardStack'

function App() {
  const [hasLoaded, setHasLoaded] = useState(false)
  const [hasFinishedSequence, setHasFinishedSequence] = useState(false)
  const [backgroundPhase, setBackgroundPhase] = useState<BackgroundPhase>('loading')

  const handleLoadingComplete = () => {
    setHasLoaded(true)
    setBackgroundPhase('home')
  }

  return (
    <>
      <AnimatedBackground phase={backgroundPhase} />
      <LoadingScreen onComplete={handleLoadingComplete} />
      {hasLoaded && !hasFinishedSequence && (
        <CardStack onComplete={() => setHasFinishedSequence(true)} />
      )}
      {hasFinishedSequence && <CuteUnlockSlider />}
    </>
  )
}

export default App
