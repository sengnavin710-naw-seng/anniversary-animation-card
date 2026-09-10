import { useState } from 'react'
import { animated, useSpring } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'

const BACKGROUND = 'linear-gradient(120deg, #f9a8c3 0%, #ec5f8f 100%)'

export function CuteUnlockSlider() {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [{ dragY, cardY, scale }, api] = useSpring(() => ({
    dragY: 0,
    cardY: 0,
    scale: 1,
  }))

  // รับเฉพาะการลากลงด้านล่าง และจำกัดระยะเพื่อไม่ให้แผงหลุดออกจากหน้าจอ
  const bind = useDrag(({ active, movement: [, movementY] }) => {
    if (isUnlocked) return

    const dragDistance = Math.min(150, Math.max(0, movementY))

    if (!active && movementY >= 120) {
      setIsUnlocked(true)
      // ย้ายทั้งการ์ดจากกึ่งกลางไปยังขอบบน โดยไม่เปลี่ยนเป็นหน้าใหม่
      api.start({
        dragY: 0,
        cardY: -window.innerHeight / 2 + 88,
        scale: 1,
        config: { tension: 210, friction: 24 },
      })
      return
    }

    api.start({
      dragY: active ? dragDistance : 0,
      scale: active ? 1.05 : 1,
      immediate: (key) => active && key === 'dragY',
      config: { tension: 300, friction: 22 },
    })
  })

  // ยิ่งลากลงไกล หัวใจบนพื้นหลังก็จะใหญ่ขึ้นตาม
  const heartScale = dragY.to((value) => Math.min(1, Math.max(0.5, value / 150)))

  return (
    <main className="relative z-10 grid min-h-screen place-items-center p-6">
      <animated.div
        style={{ background: BACKGROUND, y: cardY }}
        className="relative grid h-28 w-full max-w-xs touch-none select-none items-center overflow-visible rounded-2xl px-8 shadow-xl shadow-blossom-500/30"
      >
        <animated.div
          style={{ scale: heartScale }}
          className="grid h-16 w-16 place-items-center rounded-full bg-white text-3xl text-blossom-500 shadow-lg"
          aria-hidden="true"
        >
          ♥
        </animated.div>

        <animated.div
          {...bind()}
          style={{ y: dragY, scale }}
          className="absolute inset-0 grid cursor-grab touch-none select-none place-items-center rounded-2xl bg-blossom-700 text-center text-2xl font-bold text-white shadow-2xl shadow-blossom-900/30 active:cursor-grabbing"
        >
          <div className="pointer-events-none">
            <p className="font-display tracking-wide">
              {isUnlocked ? 'Unlocked ♡' : 'Slide down to unlock ♡'}
            </p>
            <p className="mt-1 font-sans text-xs font-semibold text-white/70">
              {isUnlocked ? 'ปลดล็อกแล้ว' : 'ลากลงให้สุดเพื่อปลดล็อก'}
            </p>
          </div>
        </animated.div>
      </animated.div>
    </main>
  )
}
