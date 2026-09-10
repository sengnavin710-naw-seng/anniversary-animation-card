import { animated, useSpring, useTrail } from '@react-spring/web'

const floatingHearts = [
  { left: '12%', top: '18%', size: 'text-3xl', delay: 150 },
  { left: '82%', top: '14%', size: 'text-5xl', delay: 250 },
  { left: '18%', top: '76%', size: 'text-4xl', delay: 350 },
  { left: '78%', top: '72%', size: 'text-3xl', delay: 450 },
]

export function AnniversaryScreen() {
  const content = useSpring({
    // เริ่มจากตำแหน่งต่ำ เพื่อให้รู้สึกว่าการ์ด Slide down ถูกขยายเป็นการ์ดนี้
    from: { opacity: 0, y: 120, scale: 0.95 },
    to: { opacity: 1, y: 0, scale: 1 },
    config: { tension: 180, friction: 18 },
  })

  const hearts = useTrail(floatingHearts.length, {
    from: { opacity: 0, y: 16, scale: 0.5 },
    to: { opacity: 0.85, y: 0, scale: 1 },
    config: { tension: 210, friction: 16 },
  })

  return (
    <main className="relative z-10 grid min-h-screen place-items-center overflow-hidden p-6 text-center">
      {hearts.map((style, index) => {
        const heart = floatingHearts[index]

        return (
          <animated.span
            key={`${heart.left}-${heart.top}`}
            style={{ ...style, left: heart.left, top: heart.top, animationDelay: `${heart.delay}ms` }}
            className={`absolute ${heart.size} animate-[pulse_2.5s_ease-in-out_infinite] text-blossom-300 drop-shadow-md`}
            aria-hidden="true"
          >
            ♥
          </animated.span>
        )
      })}

      <animated.section
        style={content}
        className="relative w-full max-w-md rounded-2xl border border-white/20 bg-blossom-700 px-8 py-14 text-white shadow-2xl shadow-blossom-900/30 sm:px-14"
      >
        <span className="text-5xl" aria-hidden="true">💗</span>
        <p className="mt-5 font-sans text-sm font-bold uppercase tracking-[0.28em] text-white/65">
          A little celebration for us
        </p>
        <h1 className="mt-4 font-display text-5xl font-bold leading-tight sm:text-6xl">
          Happy Anniversary
          <span className="mt-1 block text-blossom-200">3 Years</span>
        </h1>
        <div className="mx-auto mt-7 h-px w-24 bg-white/30" />
        <p className="mt-6 font-sans text-base font-medium leading-7 text-white/80">
          Three beautiful years, and so many more memories waiting for us.
        </p>
      </animated.section>
    </main>
  )
}
