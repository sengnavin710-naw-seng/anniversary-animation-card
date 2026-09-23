import { animated, useSpring, useSprings } from '@react-spring/web'
import type { ColorTheme } from '../utils/colorTheme'
import { DEFAULT_THEME } from '../utils/colorTheme'

export type BackgroundPhase = 'loading' | 'home'

type AnimatedBackgroundProps = {
  phase: BackgroundPhase
  colors?: ColorTheme
}

const PHASES: BackgroundPhase[] = ['loading', 'home']

function getGradients(c: ColorTheme): Record<BackgroundPhase, string> {
  return {
    loading: `radial-gradient(circle at 50% 42%, rgba(255,255,255,0.8), transparent 32%), linear-gradient(135deg, ${c.bgFrom}, ${c.bgTo})`,
    home: `radial-gradient(circle at 50% 44%, rgba(255,255,255,0.9), transparent 32%), linear-gradient(135deg, ${c.bgFrom}, ${c.bgTo})`,
  }
}

export function AnimatedBackground({ phase, colors }: AnimatedBackgroundProps) {
  const c = colors ?? DEFAULT_THEME
  const gradients = getGradients(c)

  const layers = useSprings(
    PHASES.length,
    PHASES.map((item) => ({
      opacity: phase === item ? 1 : 0,
      config: { tension: 70, friction: 24 },
    })),
  )

  const driftStyle = useSpring({
    from: { position: '0% 50%' },
    to: { position: '100% 50%' },
    loop: { reverse: true },
    config: { duration: 9000 },
  })

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {layers.map((style, index) => (
        <animated.div
          key={PHASES[index]}
          style={{
            opacity: style.opacity,
            backgroundImage: gradients[PHASES[index]],
            backgroundPosition: driftStyle.position,
            backgroundSize: '180% 180%',
          }}
          className="absolute inset-0"
        />
      ))}
    </div>
  )
}
