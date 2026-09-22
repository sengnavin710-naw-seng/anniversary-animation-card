import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

// ─── Types ────────────────────────────────────────────────────
type Particle = {
  id: number
  x: number
  y: number
  emoji: string
  tx: number // translate X target
  ty: number // translate Y target
  size: number
  duration: number
}

export type SwipeParticlesHandle = {
  burst: (x: number, y: number, count?: number) => void
  trail: (x: number, y: number) => void
}

// ─── Config ───────────────────────────────────────────────────
const BURST_EMOJIS = ['💕', '💗', '♡', '✦', '✧']
const TRAIL_EMOJIS = ['♡', '✦']
const MAX_PARTICLES = 30

let nextId = 0

// ─── Component ────────────────────────────────────────────────
export const SwipeParticles = forwardRef<SwipeParticlesHandle>(
  function SwipeParticles(_, ref) {
    const [particles, setParticles] = useState<Particle[]>([])
    const cleanupTimers = useRef(new Set<number>())

    const spawn = useCallback(
      (x: number, y: number, count: number, isBurst: boolean) => {
        const emojis = isBurst ? BURST_EMOJIS : TRAIL_EMOJIS
        const created: Particle[] = []

        for (let i = 0; i < count; i++) {
          // Burst: กระจายเท่าๆ กันรอบวง + สุ่มเล็กน้อย
          // Trail: สุ่มทิศทางอิสระ
          const angle = isBurst
            ? (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6
            : Math.random() * Math.PI * 2
          const distance = isBurst
            ? 50 + Math.random() * 90
            : 15 + Math.random() * 25

          created.push({
            id: nextId++,
            x,
            y,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            tx: Math.cos(angle) * distance,
            ty: Math.sin(angle) * distance,
            size: isBurst ? 14 + Math.random() * 10 : 10 + Math.random() * 6,
            duration: isBurst
              ? 500 + Math.random() * 400
              : 300 + Math.random() * 200,
          })
        }

        // เพิ่ม particles ใหม่ + ตัดเก่าถ้าเกิน MAX
        setParticles((prev) => [
          ...prev.slice(-(MAX_PARTICLES - created.length)),
          ...created,
        ])

        // ลบ particles หลัง animation จบ
        const maxDuration = Math.max(...created.map((p) => p.duration))
        const timerId = window.setTimeout(() => {
          cleanupTimers.current.delete(timerId)
          const ids = new Set(created.map((p) => p.id))
          setParticles((prev) => prev.filter((p) => !ids.has(p.id)))
        }, maxDuration + 50)
        cleanupTimers.current.add(timerId)
      },
      [],
    )

    useImperativeHandle(
      ref,
      () => ({
        burst: (x: number, y: number, count = 10) =>
          spawn(x, y, count, true),
        trail: (x: number, y: number) => spawn(x, y, 2, false),
      }),
      [spawn],
    )

    return (
      <div
        className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
        aria-hidden="true"
      >
        {particles.map((p) => (
          <span
            key={p.id}
            className="particle-fly absolute select-none"
            style={
              {
                left: p.x,
                top: p.y,
                fontSize: p.size,
                '--tx': `${p.tx}px`,
                '--ty': `${p.ty}px`,
                animationDuration: `${p.duration}ms`,
              } as React.CSSProperties
            }
          >
            {p.emoji}
          </span>
        ))}
      </div>
    )
  },
)
