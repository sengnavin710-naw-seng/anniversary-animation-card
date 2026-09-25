import { animated, useSpring, useSprings } from '@react-spring/web'
import { useEffect, useRef, useState } from 'react'
import { playLoadingShimmer, playCompletionChime, playSwoosh } from '../utils/sounds'

type LoadingScreenProps = {
  duration?: number
  onComplete?: () => void
  fixedProgress?: number
  soundEnabled?: boolean
  orbitStarColor?: string
}

const SPARKLES = [
  { x: -66, y: -42, size: 'text-xl', delay: 0 },
  { x: 54, y: -54, size: 'text-2xl', delay: 180 },
  { x: 66, y: 35, size: 'text-lg', delay: 360 },
  { x: -56, y: 46, size: 'text-xl', delay: 540 },
]

const BURST_PARTICLES = [
  { x: -128, y: -92, symbol: '♥', delay: 0 },
  { x: 126, y: -82, symbol: '♥', delay: 40 },
  { x: 146, y: 32, symbol: '♥', delay: 80 },
  { x: 66, y: 126, symbol: '♥', delay: 120 },
  { x: -72, y: 122, symbol: '♥', delay: 160 },
  { x: -144, y: 24, symbol: '♥', delay: 200 },
]

const OUTER_STARS = [
  { x: 72, y: -62, size: 'text-xl' },
  { x: -78, y: -38, size: 'text-lg' },
  { x: 42, y: 80, size: 'text-2xl' },
]

const INNER_STARS = [
  { x: -46, y: 54, size: 'text-sm' },
  { x: 54, y: 24, size: 'text-base' },
]

const CONFETTI = [
  { x: -250, y: -210, symbol: '✦', delay: 80 },
  { x: 240, y: -190, symbol: '♥', delay: 150 },
  { x: -270, y: 135, symbol: '♥', delay: 220 },
  { x: 255, y: 152, symbol: '✦', delay: 290 },
  { x: -42, y: -275, symbol: '✦', delay: 360 },
  { x: 36, y: 270, symbol: '♥', delay: 430 },
]

const BURST_DURATION = 600

export function LoadingScreen({
  duration = 2300,
  onComplete,
  fixedProgress,
  soundEnabled = true,
  orbitStarColor = '#fff2a8',
}: LoadingScreenProps) {
  const [isLeaving, setIsLeaving] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isMounted, setIsMounted] = useState(true)
  const didComplete = useRef(false)

  // Spring นับ progress จาก 1 ถึง 100 และใช้ค่าเดียวกันขยายหัวใจอย่างต่อเนื่อง
  const progress = useSpring({
    from: { value: fixedProgress ?? 1 },
    to: { value: fixedProgress ?? 100 },
    config: { duration },
    immediate: fixedProgress !== undefined,
  })

  // Glow แยก layer จากหัวใจ เพื่อให้หัวใจโตลื่นโดยไม่กระตุก
  const glowStyle = useSpring({
    from: { opacity: 0.25, transform: 'scale(0.7)' },
    to: { opacity: 0.75, transform: 'scale(1.25)' },
    loop: { reverse: true },
    config: { duration: 850 },
  })

  // ประกายแต่ละจุดลอยขึ้น-ลงคนละจังหวะรอบหัวใจ
  const sparkleStyles = useSprings(
    SPARKLES.length,
    SPARKLES.map((sparkle) => ({
      from: {
        opacity: 0.2,
        transform: `translate(${sparkle.x}px, ${sparkle.y + 8}px) scale(0.65)`,
      },
      to: {
        opacity: 1,
        transform: `translate(${sparkle.x}px, ${sparkle.y - 8}px) scale(1)`,
      },
      delay: sparkle.delay,
      loop: { reverse: true },
      config: { tension: 110, friction: 18 },
    })),
  )

  // แสง shimmer วิ่งผ่าน progress bar อย่างต่อเนื่อง
  const shimmerStyle = useSpring({
    from: { x: -140 },
    to: { x: 260 },
    loop: true,
    config: { duration: 950 },
  })

  // ประกายดาววงนอกหมุนช้าและวงในหมุนสวนทาง ให้ความรู้สึกเหมือนแสงดาว
  const outerOrbitStyle = useSpring({
    from: { rotation: 0 },
    to: { rotation: 360 },
    loop: true,
    config: { duration: 5200 },
  })

  const innerOrbitStyle = useSpring({
    from: { rotation: 360 },
    to: { rotation: 0 },
    loop: true,
    config: { duration: 3400 },
  })

  const twinkleStyle = useSpring({
    from: { opacity: 0.45, transform: 'scale(0.65)' },
    to: { opacity: 1, transform: 'scale(1.15)' },
    loop: { reverse: true },
    config: { duration: 700 },
  })

  // เด้งครั้งเดียวตอน 100% โดยไม่รบกวนการขยายที่ลื่นตาม progress
  const [completionHeartStyle, completionHeartApi] = useSpring(() => ({
    transform: 'scale(1)',
  }))

  useEffect(() => {
    if (!isCompleting) return

    void completionHeartApi.start({
      to: async (next) => {
        await next({
          transform: 'scale(1.28)',
          config: { tension: 420, friction: 9 },
        })
        await next({
          transform: 'scale(1)',
          config: { tension: 250, friction: 14 },
        })
      },
    })
  }, [completionHeartApi, isCompleting])

  // Burst ปล่อยประกายจากหัวใจทันทีที่ progress ถึง 100%
  const burstStyles = useSprings(
    BURST_PARTICLES.length,
    BURST_PARTICLES.map((particle) => ({
      opacity: isCompleting ? 1 : 0,
      transform: isCompleting
        ? `translate(${particle.x}px, ${particle.y}px) scale(1)`
        : 'translate(0px, 0px) scale(0.2)',
      delay: isCompleting ? particle.delay : 0,
      config: { tension: 180, friction: 16 },
    })),
  )

  // ดาวและหัวใจขนาดเล็กลอยผ่านหน้าจอเป็น transition ก่อนเลข 1
  const confettiStyles = useSprings(
    CONFETTI.length,
    CONFETTI.map((particle) => ({
      opacity: isCompleting ? 0.9 : 0,
      transform: isCompleting
        ? `translate(${particle.x}px, ${particle.y}px) rotate(180deg) scale(1)`
        : 'translate(0px, 0px) rotate(0deg) scale(0.3)',
      delay: isCompleting ? particle.delay : 0,
      config: { tension: 100, friction: 18 },
    })),
  )

  // เริ่มนับเวลาทันทีที่ component mount โดยไม่ต้องรอการกระทำจากผู้ใช้
  useEffect(() => {
    if (fixedProgress !== undefined) return
    // 🔊 เสียง shimmer มหัศจรรย์ตอนเริ่ม loading
    if (soundEnabled) playLoadingShimmer()
    const timerId = window.setTimeout(() => {
      setIsCompleting(true)
      // 🔊 เสียง chime ตอนโหลดครบ 100%
      if (soundEnabled) playCompletionChime()
    }, duration)
    return () => window.clearTimeout(timerId)
  }, [duration, fixedProgress, soundEnabled])

  useEffect(() => {
    if (!isCompleting) return

    const timerId = window.setTimeout(() => {
      setIsLeaving(true)
      // 🔊 เสียง swoosh ตอน fade out
      if (soundEnabled) playSwoosh()
    }, BURST_DURATION)
    return () => window.clearTimeout(timerId)
  }, [isCompleting, soundEnabled])

  // Spring ของ overlay จะ fade ออกหลัง timer ครบ และค่อย unmount เมื่อ animation จบ
  const overlayStyle = useSpring({
    opacity: isLeaving ? 0 : 1,
    config: { tension: 170, friction: 26 },
    onRest: () => {
      if (isLeaving && !didComplete.current) {
        didComplete.current = true
        setIsMounted(false)
        onComplete?.()
      }
    },
  })

  if (!isMounted) return null

  return (
    <animated.div
      style={overlayStyle}
      className="pointer-events-auto fixed inset-0 z-50 grid place-items-center overflow-hidden bg-transparent px-6"
      role="status"
      aria-live="polite"
      aria-label="กำลังโหลดเว็บไซต์"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2">
        {confettiStyles.map((style, index) => (
          <animated.span
            key={CONFETTI[index].delay}
            style={style}
            className="absolute left-0 top-0 select-none text-2xl text-white drop-shadow-md"
            aria-hidden="true"
          >
            {CONFETTI[index].symbol}
          </animated.span>
        ))}
      </div>
      <div className="flex flex-col items-center gap-7">
        <animated.div
          style={{
            transform: progress.value.to(
              (value) =>
                `translateY(-24px) scale(${0.75 + (value / 100) * 0.85})`,
            ),
          }}
          className="relative mb-4 grid h-36 w-36 place-items-center"
        >
          <animated.span
            style={glowStyle}
            className="absolute h-24 w-24 rounded-full bg-blossom-500/40 blur-2xl"
            aria-hidden="true"
          />
          <animated.div
            style={{
              transform: outerOrbitStyle.rotation.to(
                (rotation) => `rotate(${rotation}deg)`,
              ),
            }}
            className="absolute inset-0"
            aria-hidden="true"
          >
            {OUTER_STARS.map((star) => (
              <span
                key={`${star.x}-${star.y}`}
                style={{ transform: `translate(${star.x}px, ${star.y}px)` }}
                className={`absolute left-1/2 top-1/2 ${star.size}`}
              >
                <animated.span
                  className="block select-none"
                  style={{ ...twinkleStyle, color: orbitStarColor, filter: `drop-shadow(0 0 8px ${orbitStarColor}e6)` }}
                >
                  ✦
                </animated.span>
              </span>
            ))}
          </animated.div>
          <animated.div
            style={{
              transform: innerOrbitStyle.rotation.to(
                (rotation) => `rotate(${rotation}deg)`,
              ),
            }}
            className="absolute inset-0"
            aria-hidden="true"
          >
            {INNER_STARS.map((star) => (
              <span
                key={`${star.x}-${star.y}`}
                style={{ transform: `translate(${star.x}px, ${star.y}px)` }}
                className={`absolute left-1/2 top-1/2 ${star.size}`}
              >
                <animated.span
                  className="block select-none"
                  style={{ ...twinkleStyle, color: orbitStarColor, filter: `drop-shadow(0 0 7px ${orbitStarColor}d9)` }}
                >
                  ✦
                </animated.span>
              </span>
            ))}
          </animated.div>
          {sparkleStyles.map((style, index) => (
            <animated.span
              key={SPARKLES[index].delay}
              style={style}
              className={`absolute left-1/2 top-1/2 select-none text-white drop-shadow-md ${SPARKLES[index].size}`}
              aria-hidden="true"
            >
              ✦
            </animated.span>
          ))}
          {burstStyles.map((style, index) => (
            <animated.span
              key={BURST_PARTICLES[index].delay}
              style={style}
              className="absolute left-1/2 top-1/2 z-20 select-none text-2xl text-blossom-500 drop-shadow-[0_0_10px_rgba(236,95,143,0.7)]"
              aria-hidden="true"
            >
              {BURST_PARTICLES[index].symbol}
            </animated.span>
          ))}
          <animated.span
            style={completionHeartStyle}
            className="relative z-10 block select-none text-7xl drop-shadow-[0_12px_16px_rgba(236,95,143,0.35)]"
            aria-hidden="true"
          >
            💗
          </animated.span>
        </animated.div>

        <div className="relative h-14 w-72 overflow-hidden rounded-full border-4 border-white/70 bg-white/40 shadow-inner shadow-blossom-700/10">
          <animated.div
            style={{ width: progress.value.to((value) => `${value}%`) }}
            className="absolute inset-y-0 left-0 overflow-hidden rounded-full bg-gradient-to-r from-blossom-500 to-pink-400 shadow-md shadow-blossom-500/30"
          >
            <animated.span
              style={{
                transform: shimmerStyle.x.to(
                  (x) => `translateX(${x}%) skewX(-18deg)`,
                ),
              }}
              className="absolute inset-y-0 w-2/5 bg-white/45 blur-sm"
              aria-hidden="true"
            />
          </animated.div>
          <animated.span className="absolute inset-0 z-10 grid place-items-center font-display text-2xl font-bold text-white drop-shadow-sm">
            {progress.value.to((value) => `${Math.round(value)}%`)}
          </animated.span>
        </div>
      </div>
    </animated.div>
  )
}
