import { animated, useSpring, useSprings } from '@react-spring/web'

type NumberTrailProps = {
  activeNumber: 1 | 2 | 3 | null
}

type CandyHeart = {
  x: number
  y: number
  size: string
  color: string
  delay: number
  visible: boolean
}

// ทุกเลขใช้ภาษาภาพเดียวกัน: หัวใจ pastel pop รอบตัวเลขในตำแหน่งสมมาตร
const HEART_LAYOUTS: Record<1 | 2 | 3, CandyHeart[]> = {
  1: [
    { x: 0, y: -82, size: 'text-3xl', color: 'text-blossom-400', delay: 0, visible: true },
    { x: -84, y: 18, size: 'text-2xl', color: 'text-pink-300', delay: 100, visible: true },
    { x: 84, y: 18, size: 'text-2xl', color: 'text-pink-300', delay: 200, visible: true },
    { x: 0, y: 0, size: 'text-xl', color: 'text-blossom-400', delay: 0, visible: false },
    { x: 0, y: 0, size: 'text-xl', color: 'text-blossom-400', delay: 0, visible: false },
  ],
  2: [
    { x: -78, y: -54, size: 'text-2xl', color: 'text-blossom-400', delay: 0, visible: true },
    { x: 78, y: -54, size: 'text-2xl', color: 'text-blossom-400', delay: 80, visible: true },
    { x: -78, y: 58, size: 'text-3xl', color: 'text-pink-300', delay: 160, visible: true },
    { x: 78, y: 58, size: 'text-3xl', color: 'text-pink-300', delay: 240, visible: true },
    { x: 0, y: 0, size: 'text-xl', color: 'text-blossom-400', delay: 0, visible: false },
  ],
  3: [
    { x: 0, y: -96, size: 'text-3xl', color: 'text-blossom-400', delay: 0, visible: true },
    { x: -92, y: -32, size: 'text-2xl', color: 'text-pink-300', delay: 80, visible: true },
    { x: 92, y: -32, size: 'text-2xl', color: 'text-pink-300', delay: 160, visible: true },
    { x: -62, y: 78, size: 'text-3xl', color: 'text-blossom-500', delay: 240, visible: true },
    { x: 62, y: 78, size: 'text-3xl', color: 'text-blossom-500', delay: 320, visible: true },
  ],
}

export function NumberTrail({ activeNumber }: NumberTrailProps) {
  const currentHearts = activeNumber === null ? null : HEART_LAYOUTS[activeNumber]
  const numberStyle = useSpring({
    opacity: activeNumber === null ? 0 : 1,
    transform: activeNumber === null ? 'scale(0.65)' : 'scale(1)',
    config: { tension: 290, friction: 13 },
  })

  // หัวใจป๊อปทีละดวงในทุก phase เพื่อให้ 1 → 2 → 3 ต่อเนื่องเป็นชุดเดียวกัน
  const candyHeartStyles = useSprings(
    5,
    Array.from({ length: 5 }, (_, index) => {
      const heart = currentHearts?.[index]
      const isVisible = Boolean(heart?.visible)

      return {
      opacity: isVisible ? 1 : 0,
      transform:
        isVisible && heart
          ? `translate(${heart.x}px, ${heart.y}px) scale(1) rotate(0deg)`
          : 'translate(0px, 0px) scale(0.12) rotate(-16deg)',
      delay: isVisible && heart ? heart.delay : 0,
      config: { tension: 360, friction: 12 },
      }
    }),
  )

  return (
    <section className="relative z-10 grid min-h-screen place-items-center" aria-live="polite">
      <div className="relative">
        <animated.span
          style={numberStyle}
          className="relative z-10 grid h-28 w-28 place-items-center rounded-full bg-white font-display text-6xl font-bold text-blossom-500 shadow-xl shadow-blossom-300/50"
        >
          {activeNumber}
        </animated.span>
        <div className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden="true">
          {candyHeartStyles.map((style, index) => (
            <animated.span
              key={index}
              style={style}
              className={`absolute left-0 top-0 select-none ${currentHearts?.[index]?.size ?? 'text-xl'} ${currentHearts?.[index]?.color ?? 'text-blossom-400'} drop-shadow-[0_4px_5px_rgba(236,95,143,0.28)] [text-shadow:1px_1px_0_white,-1px_-1px_0_white,1px_-1px_0_white,-1px_1px_0_white]`}
            >
              ♥
            </animated.span>
          ))}
        </div>
      </div>
    </section>
  )
}
