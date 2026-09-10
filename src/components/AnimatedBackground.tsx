import { animated, useSpring, useSprings } from '@react-spring/web'

export type BackgroundPhase = 'loading' | 'one' | 'two' | 'three' | 'home'

type AnimatedBackgroundProps = {
  phase: BackgroundPhase
}

const PHASES: BackgroundPhase[] = ['loading', 'one', 'two', 'three', 'home']

const GRADIENTS: Record<BackgroundPhase, string> = {
  loading:
    'radial-gradient(circle at 50% 42%, rgba(255,255,255,0.8), transparent 32%), linear-gradient(135deg, #ffe4ee, #fbcfe8, #f9a8c3)',
  one:
    'radial-gradient(circle at 50% 42%, rgba(255,255,255,0.86), transparent 30%), linear-gradient(135deg, #fff1f6, #fce7f3, #fbcfe8)',
  two:
    'radial-gradient(circle at 50% 42%, rgba(255,255,255,0.82), transparent 30%), linear-gradient(135deg, #ffe4ee, #fce7f3, #f9a8c3)',
  three:
    'radial-gradient(circle at 50% 42%, rgba(255,255,255,0.84), transparent 30%), linear-gradient(135deg, #fff1f6, #fecdd3, #f9a8c3)',
  home:
    'radial-gradient(circle at 50% 44%, rgba(255,255,255,0.9), transparent 32%), linear-gradient(135deg, #fff1f6, #ffe4ee, #fce7f3)',
}

export function AnimatedBackground({ phase }: AnimatedBackgroundProps) {
  // แต่ละ gradient crossfade กันบน layer เดิม จึงเปลี่ยน phase โดยไม่มีรอยต่อ
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
            backgroundImage: GRADIENTS[PHASES[index]],
            backgroundPosition: driftStyle.position,
            backgroundSize: '180% 180%',
          }}
          className="absolute inset-0"
        />
      ))}
    </div>
  )
}
