import { useEffect, useRef, useState } from 'react'
import { animated, easings, useSpring, useSprings } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'

const BACKGROUND = 'linear-gradient(120deg, #f9a8c3 0%, #ec5f8f 100%)'
const ANNIVERSARY_TITLE = 'Happy Anniversary 3Years'
const HEART_MOVE_DURATION = 900
const SPARKLE_TRAIL = [
  { x: -70, y: 34, delay: 0, size: 'text-sm' },
  { x: -34, y: 72, delay: 50, size: 'text-base' },
  { x: 8, y: 104, delay: 100, size: 'text-xs' },
  { x: 48, y: 76, delay: 150, size: 'text-sm' },
  { x: 78, y: 42, delay: 200, size: 'text-base' },
]

export function CuteUnlockSlider() {
  const baseCardRef = useRef<HTMLDivElement>(null)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showTitle, setShowTitle] = useState(false)
  const [showTopEffects, setShowTopEffects] = useState(false)
  const [showUnderline, setShowUnderline] = useState(false)
  const [showFallingHeart, setShowFallingHeart] = useState(false)
  const [showHeartBox, setShowHeartBox] = useState(false)
  const [typedTitle, setTypedTitle] = useState('')
  const [{ dragY, baseY, foregroundOpacity, heartScale, heartX, scale }, api] = useSpring(() => ({
    dragY: 0,
    baseY: 0,
    foregroundOpacity: 1,
    heartScale: 0.5,
    heartX: 0,
    scale: 1,
  }))
  const [haloStyle, haloApi] = useSpring(() => ({ opacity: 0, scale: 0.5 }))
  const [softGlow, softGlowApi] = useSpring(() => ({ opacity: 0, scale: 0.86 }))
  const [fallingHeartStyle, fallingHeartApi] = useSpring(() => ({
    opacity: 0,
    y: 0,
    scale: 0.65,
    rotate: 0,
  }))
  const [heartBoxStyle, heartBoxApi] = useSpring(() => ({
    opacity: 0,
    scale: 0.15,
    borderRadius: '999px',
  }))
  const glassHighlight = useSpring({
    from: { opacity: 0, x: -140 },
    to: showTopEffects ? { opacity: 0.32, x: 390 } : { opacity: 0, x: -140 },
    config: { duration: HEART_MOVE_DURATION, easing: easings.easeInOutCubic },
  })
  const underlineStyle = useSpring({
    opacity: showUnderline ? 1 : 0,
    scaleX: showUnderline ? 1 : 0,
    config: { duration: HEART_MOVE_DURATION, easing: easings.easeOutCubic },
  })
  const sparkleStyles = useSprings(
    SPARKLE_TRAIL.length,
    SPARKLE_TRAIL.map((sparkle) => ({
      from: { opacity: 0, x: 0, y: 0, scale: 0.35 },
      to: showTopEffects
        ? async (next: (props: object) => Promise<unknown>) => {
            await next({
              opacity: 0.75,
              x: sparkle.x,
              y: sparkle.y,
              scale: 1,
              delay: sparkle.delay,
              config: { duration: 220, easing: easings.easeOutCubic },
            })
            await next({
              opacity: 0,
              y: sparkle.y + 20,
              scale: 0.65,
              config: {
                duration: HEART_MOVE_DURATION - sparkle.delay - 220,
                easing: easings.easeInCubic,
              },
            })
          }
        : { opacity: 0, x: 0, y: 0, scale: 0.35 },
    })),
  )
  // Typewriter จริง: เติมตัวอักษรทีละตัวให้ครบภายใน 900ms เท่ากับหัวใจเลื่อน
  useEffect(() => {
    if (!showTitle) return

    const characterDelay = HEART_MOVE_DURATION / ANNIVERSARY_TITLE.length
    const timerIds = ANNIVERSARY_TITLE.split('').map((_, index) =>
      window.setTimeout(() => {
        setTypedTitle(ANNIVERSARY_TITLE.slice(0, index + 1))
      }, (index + 1) * characterDelay),
    )

    return () => timerIds.forEach((timerId) => window.clearTimeout(timerId))
  }, [showTitle])

  // เมื่อพิมพ์หัวข้อครบ ให้หัวใจออกจากใต้การ์ดและตกถึงกึ่งกลางพื้นที่รูป
  useEffect(() => {
    if (typedTitle !== ANNIVERSARY_TITLE) return

    // อ้างอิงตำแหน่งภาพเดิม: top 160px, กว้างสูงสุด 320px และเว้นขอบจอ 16px
    // จึงทำให้หัวใจหยุดตรงกลางพื้นที่รูปได้แม้หน้าจอมีขนาดต่างกัน
    const imageWidth = Math.min(320, window.innerWidth - 32)
    const imageCenterY = 160 + imageWidth / 2
    const cardBottom = baseCardRef.current?.getBoundingClientRect().bottom ?? 144
    const heartHalfSize = 24
    const travelDistance = Math.max(0, imageCenterY - cardBottom - heartHalfSize)

    setShowFallingHeart(true)
    void fallingHeartApi.start({
      // เริ่มซ่อนอยู่หลังขอบล่างของการ์ด แล้วค่อยเลื่อนออกมาด้านล่าง
      from: { opacity: 1, y: -64, scale: 0.65, rotate: 0 },
      to: async (next) => {
        await next({
          opacity: 1,
          y: travelDistance,
          scale: 1,
          rotate: 0,
          config: { duration: 2000, easing: easings.easeInOutCubic },
        })

        // หัวใจถึงกลางพื้นที่รูปแล้ว จึงขยายต่อเป็นกล่องสี่เหลี่ยม
        setShowHeartBox(true)
        void heartBoxApi.start({
          from: { opacity: 0, scale: 0.15, borderRadius: '999px' },
          to: { opacity: 1, scale: 1, borderRadius: '1.5rem' },
          config: { duration: 650, easing: easings.easeOutCubic },
        })
        await next({
          opacity: 0,
          scale: 6,
          config: { duration: 650, easing: easings.easeOutCubic },
        })
      },
    })
  }, [fallingHeartApi, heartBoxApi, typedTitle])

  // Glow และ halo เริ่มพร้อม Typewriter และจบครบใน 900ms
  useEffect(() => {
    if (!showTopEffects) return

    void haloApi.start({
      to: async (next) => {
        await next({ opacity: 0.55, scale: 1.1, config: { duration: 260 } })
        await next({ opacity: 0, scale: 1.55, config: { duration: 640, easing: easings.easeOutCubic } })
      },
    })
    void softGlowApi.start({
      to: async (next) => {
        await next({ opacity: 0.5, scale: 1.05, config: { duration: 320 } })
        await next({ opacity: 0.22, scale: 1, config: { duration: 580, easing: easings.easeInOutCubic } })
      },
    })
  }, [haloApi, showTopEffects, softGlowApi])

  // รับเฉพาะการลากลงด้านล่าง และจำกัดระยะเพื่อไม่ให้แผงหลุดออกจากหน้าจอ
  const bind = useDrag(({ active, movement: [, movementY] }) => {
    if (isUnlocked) return

    const dragDistance = Math.min(150, Math.max(0, movementY))

    if (!active && movementY >= 120) {
      setIsUnlocked(true)
      void playUnlockSequence()
      return
    }

    api.start({
      dragY: active ? dragDistance : 0,
      heartScale: active ? Math.min(1, Math.max(0.5, dragDistance / 150)) : 0.5,
      scale: active ? 1.05 : 1,
      immediate: (key) => active && key === 'dragY',
      config: { tension: 300, friction: 22 },
    })
  })

  // การ์ดหน้าจาง → BaseCard เลื่อนขึ้น → หัวใจเลื่อนไปด้านขวาของ BaseCard
  const playUnlockSequence = async () => {
    const fadeForeground = api.start({
      foregroundOpacity: 0,
      config: { duration: 350 },
    })
    const moveBaseCard = api.start({
      baseY: -window.innerHeight / 2 + 88,
      config: { tension: 210, friction: 24 },
    })

    await Promise.all([fadeForeground, moveBaseCard])

    // รองรับจอเล็ก: จำกัดระยะเพื่อให้หัวใจไม่ล้นออกนอกการ์ด
    const rightOffset = Math.max(0, Math.min(216, window.innerWidth - 152))
    setShowTitle(true)
    setShowTopEffects(true)
    setShowUnderline(true)
    await api.start({
      // เมื่อ BaseCard อยู่บนสุด หัวใจย่อเหลือครึ่งหนึ่งเพื่อเปิดพื้นที่ให้หัวข้อ
      heartScale: 0.5,
      heartX: rightOffset,
      // 900ms พร้อม ease-in-out: เริ่มและจบแบบนุ่ม โดยไม่เด้งเกินตำแหน่ง
      config: { duration: HEART_MOVE_DURATION, easing: easings.easeInOutCubic },
    })
  }

  return (
    <main className="relative z-10 grid min-h-screen place-items-center p-4 sm:p-6">
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-0" aria-hidden="true">
        {sparkleStyles.map((style, index) => (
          <animated.span
            key={SPARKLE_TRAIL[index].delay}
            style={style}
            className={`absolute left-0 top-0 select-none ${SPARKLE_TRAIL[index].size} text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]`}
          >
            ✦
          </animated.span>
        ))}
      </div>
      <div className="relative isolate z-30 h-28 w-full max-w-xs">
        <animated.span
          style={{ opacity: softGlow.opacity, scale: softGlow.scale, y: baseY }}
          className="pointer-events-none absolute -inset-x-5 -inset-y-4 z-0 rounded-[2rem] bg-gradient-to-r from-white/50 via-blossom-300/60 to-pink-200/50 blur-2xl"
          aria-hidden="true"
        />
        {/* การ์ดฐาน: จะเป็นเพียงชั้นที่เลื่อนขึ้นหลังปลดล็อก */}
        <animated.div
          ref={baseCardRef}
          style={{ background: BACKGROUND, y: baseY }}
          className="absolute inset-0 z-10 grid touch-none select-none items-center overflow-visible rounded-2xl px-8 shadow-xl shadow-blossom-500/30"
        >
          <animated.span
            style={glassHighlight}
            className="pointer-events-none absolute -inset-y-10 left-0 z-0 w-16 bg-white/55 blur-md"
            aria-hidden="true"
          />
          <animated.span
            style={{ opacity: haloStyle.opacity, x: heartX, scale: haloStyle.scale }}
            className="pointer-events-none absolute left-8 top-1/2 z-[1] -mt-8 h-16 w-16 rounded-full border-2 border-white/90"
            aria-hidden="true"
          />
          <animated.div
            style={{ x: heartX, scale: heartScale }}
            className="relative z-10 grid h-16 w-16 place-items-center rounded-full bg-white text-3xl text-blossom-500 shadow-lg"
            aria-hidden="true"
          >
            ♥
          </animated.div>
          <p className="absolute left-3 right-16 top-1/2 z-10 -translate-y-1/2 whitespace-nowrap font-display text-left text-[clamp(0.875rem,5vw,1.5rem)] font-bold leading-tight tracking-tight text-white">
            {typedTitle}
            {showTitle && <span className="cursor-blink ml-0.5 text-blossom-100">|</span>}
          </p>
          <animated.span
            style={{
              opacity: underlineStyle.opacity,
              transform: underlineStyle.scaleX.to((value) => `scaleX(${value})`),
            }}
            className="absolute left-3 top-[76px] z-10 h-3 w-52 origin-left rounded-[50%] border-b-2 border-white/85"
            aria-hidden="true"
          />
          {showFallingHeart && (
            <div
              className="pointer-events-none absolute left-1/2 top-full z-20 ml-[-2.5rem] h-[calc(100vh-2rem)] w-20 overflow-hidden"
              aria-hidden="true"
            >
              <animated.span
                style={fallingHeartStyle}
                className="absolute left-1/2 top-0 -ml-6 select-none text-5xl leading-none drop-shadow-[0_8px_14px_rgba(190,24,93,0.4)]"
              >
                💗
              </animated.span>
            </div>
          )}
        </animated.div>

        {/* การ์ดชั้นหน้า: ผู้ใช้ลากลงได้ และจะ fade เมื่อปลดล็อกสำเร็จ */}
        <animated.div
          {...bind()}
          style={{ y: dragY, scale, opacity: foregroundOpacity }}
          className="absolute inset-0 z-20 grid cursor-grab touch-none select-none place-items-center rounded-2xl bg-blossom-700 text-center text-xl font-bold text-white shadow-2xl shadow-blossom-900/30 active:cursor-grabbing sm:text-2xl"
        >
          <div className="pointer-events-none">
            <p className="font-display tracking-wide">Slide down to unlock ♡</p>
            <p className="mt-1 font-sans text-xs font-semibold text-white/70">ลากลงให้สุดเพื่อปลดล็อก</p>
          </div>
        </animated.div>
      </div>
      {showHeartBox && (
        <div
          className="pointer-events-none absolute left-1/2 top-40 z-10 aspect-square w-[calc(100vw-2rem)] max-w-xs -translate-x-1/2"
          aria-hidden="true"
        >
          <animated.div
            style={heartBoxStyle}
            className="absolute inset-0 bg-gradient-to-br from-pink-100 via-blossom-300 to-blossom-500 shadow-[0_24px_48px_rgba(190,24,93,0.25)]"
          />
        </div>
      )}
    </main>
  )
}
