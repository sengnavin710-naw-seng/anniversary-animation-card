import { useEffect, useState } from 'react'
import { animated, easings, useSpring } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'

const BACKGROUND = 'linear-gradient(120deg, #f9a8c3 0%, #ec5f8f 100%)'
const ANNIVERSARY_TITLE = 'Happy Anniversary 3Years'
const HEART_MOVE_DURATION = 900

export function CuteUnlockSlider() {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showTitle, setShowTitle] = useState(false)
  const [typedTitle, setTypedTitle] = useState('')
  const [{ dragY, baseY, foregroundOpacity, heartScale, heartX, scale }, api] = useSpring(() => ({
    dragY: 0,
    baseY: 0,
    foregroundOpacity: 1,
    heartScale: 0.5,
    heartX: 0,
    scale: 1,
  }))

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
    await api.start({
      // เมื่อ BaseCard อยู่บนสุด หัวใจย่อเหลือครึ่งหนึ่งเพื่อเปิดพื้นที่ให้หัวข้อ
      heartScale: 0.5,
      heartX: rightOffset,
      // 900ms พร้อม ease-in-out: เริ่มและจบแบบนุ่ม โดยไม่เด้งเกินตำแหน่ง
      config: { duration: HEART_MOVE_DURATION, easing: easings.easeInOutCubic },
    })
  }

  return (
    <main className="relative z-10 grid min-h-screen place-items-center p-6">
      <div className="relative h-28 w-full max-w-xs">
        {/* การ์ดฐาน: จะเป็นเพียงชั้นที่เลื่อนขึ้นหลังปลดล็อก */}
        <animated.div
          style={{ background: BACKGROUND, y: baseY }}
          className="absolute inset-0 grid touch-none select-none items-center overflow-visible rounded-2xl px-8 shadow-xl shadow-blossom-500/30"
        >
          <animated.div
            style={{ x: heartX, scale: heartScale }}
            className="grid h-16 w-16 place-items-center rounded-full bg-white text-3xl text-blossom-500 shadow-lg"
            aria-hidden="true"
          >
            ♥
          </animated.div>
          <p className="absolute left-3 right-16 top-1/2 -translate-y-1/2 whitespace-nowrap font-display text-left text-xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
            {typedTitle}
            {showTitle && <span className="ml-0.5 animate-pulse text-blossom-100">|</span>}
          </p>
        </animated.div>

        {/* การ์ดชั้นหน้า: ผู้ใช้ลากลงได้ และจะ fade เมื่อปลดล็อกสำเร็จ */}
        <animated.div
          {...bind()}
          style={{ y: dragY, scale, opacity: foregroundOpacity }}
          className="absolute inset-0 grid cursor-grab touch-none select-none place-items-center rounded-2xl bg-blossom-700 text-center text-2xl font-bold text-white shadow-2xl shadow-blossom-900/30 active:cursor-grabbing"
        >
          <div className="pointer-events-none">
            <p className="font-display tracking-wide">Slide down to unlock ♡</p>
            <p className="mt-1 font-sans text-xs font-semibold text-white/70">ลากลงให้สุดเพื่อปลดล็อก</p>
          </div>
        </animated.div>
      </div>
    </main>
  )
}
