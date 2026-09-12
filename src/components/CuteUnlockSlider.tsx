import { useState } from 'react'
import { animated, easings, useSpring, useSprings } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'

const BACKGROUND = 'linear-gradient(120deg, #f9a8c3 0%, #ec5f8f 100%)'
const ANNIVERSARY_TITLE = 'Happy Anniversary 3Years'
const HEART_MOVE_DURATION = 900

export function CuteUnlockSlider() {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showTitle, setShowTitle] = useState(false)
  const [{ dragY, baseY, foregroundOpacity, heartX, scale }, api] = useSpring(() => ({
    dragY: 0,
    baseY: 0,
    foregroundOpacity: 1,
    heartX: 0,
    scale: 1,
  }))

  // ให้ตัวอักษรปรากฏทีละตัวตลอด 900ms เท่ากับช่วงเวลาที่หัวใจเลื่อนไปด้านขวา
  const titleTrail = useSprings(
    ANNIVERSARY_TITLE.length,
    ANNIVERSARY_TITLE.split('').map((_, index) => ({
      opacity: showTitle ? 1 : 0,
      y: showTitle ? 0 : 5,
      delay: showTitle ? (index * HEART_MOVE_DURATION) / (ANNIVERSARY_TITLE.length - 1) : 0,
      config: { duration: 55, easing: easings.easeOutCubic },
    })),
  )

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
    const rightOffset = Math.max(0, Math.min(192, window.innerWidth - 176))
    setShowTitle(true)
    await api.start({
      heartX: rightOffset,
      // 900ms พร้อม ease-in-out: เริ่มและจบแบบนุ่ม โดยไม่เด้งเกินตำแหน่ง
      config: { duration: HEART_MOVE_DURATION, easing: easings.easeInOutCubic },
    })
  }

  // ยิ่งลากลงไกล หัวใจบนพื้นหลังก็จะใหญ่ขึ้นตาม
  const heartScale = dragY.to((value) => Math.min(1, Math.max(0.5, value / 150)))

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
          <p className="absolute left-8 right-28 top-1/2 -translate-y-1/2 font-display text-left text-lg font-bold leading-tight text-white sm:text-xl">
            {titleTrail.map((style, index) => (
              <animated.span key={`${ANNIVERSARY_TITLE[index]}-${index}`} style={style} className="inline-block">
                {ANNIVERSARY_TITLE[index] === ' ' ? '\u00a0' : ANNIVERSARY_TITLE[index]}
              </animated.span>
            ))}
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
