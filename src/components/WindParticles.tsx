import { useEffect, useRef, useState } from 'react'

// ─── Config ───────────────────────────────────────────────────
const EMOJIS = ['♡', '💕', '💗', '✦', '✧', '⋆', '♡', '✦']
const SPAWN_INTERVAL = 320 // ms ระหว่างแต่ละตัว
const MAX_PARTICLES = 25

type Particle = {
  id: number
  emoji: string
  size: number
  startX: number
  startY: number
  driftX: number  // ระยะลอยไปขวา
  driftY: number  // ระยะตก (บวก = ตก, ลบ = ลอยขึ้น)
  rotate: number  // องศาหมุน
  duration: number
  delay: number
  opacity: number
}

let nextId = 0

function createParticle(viewW: number, viewH: number): Particle {
  const isHeart = Math.random() > 0.4
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]

  // เริ่มจากด้านซ้ายจอ หลายระดับความสูง
  const startX = -20 + Math.random() * 40
  const startY = Math.random() * viewH * 0.9

  // ลอยไปทางขวา + บางตัวตกลง บางตัวลอยขึ้นเล็กน้อย
  const driftX = viewW * 0.4 + Math.random() * viewW * 0.5
  const fallChance = Math.random()
  const driftY = fallChance < 0.4
    ? 80 + Math.random() * 160   // ตกลง
    : fallChance < 0.7
      ? -20 + Math.random() * 40  // ลอยตัวนิดหน่อย
      : -40 - Math.random() * 60  // ลอยขึ้น

  return {
    id: nextId++,
    emoji,
    size: isHeart ? 12 + Math.random() * 14 : 10 + Math.random() * 10,
    startX,
    startY,
    driftX,
    driftY,
    rotate: -30 + Math.random() * 60,
    duration: 4000 + Math.random() * 3000,
    delay: 0,
    opacity: 0.3 + Math.random() * 0.5,
  }
}

// ─── Component ────────────────────────────────────────────────
type WindParticlesProps = {
  active: boolean
}

export function WindParticles({ active }: WindParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const intervalRef = useRef<number | null>(null)
  const viewSize = useRef({ w: window.innerWidth, h: window.innerHeight })

  useEffect(() => {
    if (!active) return

    viewSize.current = { w: window.innerWidth, h: window.innerHeight }

    // Spawn อนุภาคทุก SPAWN_INTERVAL ms
    intervalRef.current = window.setInterval(() => {
      setParticles((prev) => {
        const p = createParticle(viewSize.current.w, viewSize.current.h)
        return [...prev.slice(-(MAX_PARTICLES - 1)), p]
      })
    }, SPAWN_INTERVAL)

    // Spawn ชุดแรก 3 ตัวทันที
    setParticles(
      Array.from({ length: 3 }, () =>
        createParticle(viewSize.current.w, viewSize.current.h),
      ),
    )

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [active])

  // ลบอนุภาคที่ animation จบแล้ว
  useEffect(() => {
    if (particles.length === 0) return
    const maxDur = Math.max(...particles.map((p) => p.duration))
    const timer = window.setTimeout(() => {
      setParticles((prev) => {
        return prev.slice(-MAX_PARTICLES)
      })
    }, maxDur + 200)
    return () => window.clearTimeout(timer)
  }, [particles.length])

  if (!active) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="wind-particle absolute select-none"
          style={
            {
              left: p.startX,
              top: p.startY,
              fontSize: p.size,
              opacity: 0,
              '--dx': `${p.driftX}px`,
              '--dy': `${p.driftY}px`,
              '--rot': `${p.rotate}deg`,
              '--peak-opacity': p.opacity,
              animationDuration: `${p.duration}ms`,
              animationDelay: `${p.delay}ms`,
            } as React.CSSProperties
          }
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}
