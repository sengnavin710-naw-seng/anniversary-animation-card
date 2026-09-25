import { useEffect, useRef, useState } from 'react'
import { useSprings, animated, to as interpolate } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import anniversaryPhoto from '../assets/anniversary-photo.jpg'
import { SwipeParticles, type SwipeParticlesHandle } from './SwipeParticles'
import { playSparkle, playFlip } from '../utils/sounds'
import type { ColorTheme } from '../utils/colorTheme'
import { DEFAULT_THEME } from '../utils/colorTheme'

// เปลี่ยนรูปแต่ละใบได้ที่นี่ — ตอนนี้ใช้รูปเดียวกัน 3 ใบเป็น placeholder
const CARDS = [
  anniversaryPhoto,
  anniversaryPhoto,
  anniversaryPhoto,
]

// ขนาดการ์ดตอน swipe (สูง) vs ขนาด CuteUnlockSlider (แบน)
const CARD_W = 260
const CARD_H = 380
const SLIDER_W = 320 // max-w-xs
const SLIDER_H = 112 // h-28

const toSpring = (i: number) => ({
  x: 0,
  y: i * -4,
  scale: 1,
  rot: -10 + Math.random() * 20,
  flipY: 0,
  tiltX: 30,
  cardW: CARD_W,
  cardH: CARD_H,
  delay: i * 100,
})

// การ์ดตกลงมาจากด้านบนจอตอน mount
const fromSpring = () => ({
  x: 0, rot: 0, scale: 1.5, y: -1000, flipY: 0, tiltX: 30,
  cardW: CARD_W, cardH: CARD_H,
})

// แปลง rotation, scale, flip, tilt เป็น CSS transform 3D ตัวเดียว
const cardTrans = (r: number, s: number, fy: number, tx: number) =>
  `perspective(1500px) rotateX(${tx}deg) rotateY(${fy + r / 10}deg) rotateZ(${r}deg) scale(${s})`

// Throttle interval สำหรับ trail particles (ms)
const TRAIL_INTERVAL = 80

type CardStackProps = {
  cardImages?: string[]
  colors?: ColorTheme
  onComplete?: () => void
}

export function CardStack({ cardImages, colors, onComplete }: CardStackProps) {
  const clr = colors ?? DEFAULT_THEME
  const cards = cardImages ?? CARDS
  const [gone] = useState(() => new Set<number>())
  const isTransitioning = useRef(false)
  const [flippingIndex, setFlippingIndex] = useState<number | null>(null)
  const timerIds = useRef(new Set<number>())
  const particlesRef = useRef<SwipeParticlesHandle>(null)
  const lastTrailTime = useRef(0)

  // เคลียร์ timer ทั้งหมดเมื่อ component ถูก unmount
  useEffect(() => {
    const timers = timerIds.current
    return () => {
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  const addTimer = (fn: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      timerIds.current.delete(id)
      fn()
    }, delay)
    timerIds.current.add(id)
  }

  const [props, api] = useSprings(cards.length, (i) => ({
    ...toSpring(i),
    from: fromSpring(),
  }))

  // จับ gesture ลากซ้าย/ขวา — ปล่อยเร็วพอจะปลิวออก ช้าจะดีดกลับ
  const bind = useDrag(
    ({
      args: [index],
      active,
      movement: [mx],
      direction: [xDir],
      velocity: [vx],
    }) => {
      // บล็อก gesture ระหว่างที่กำลังพลิกการ์ด
      if (isTransitioning.current) return

      const trigger = vx > 0.2
      const dir = xDir < 0 ? -1 : 1

      // 💕 Trail particles ตอนลากการ์ด — spawn ทุก 80ms ถ้าลากไกลพอ
      if (active && Math.abs(mx) > 30) {
        const now = Date.now()
        if (now - lastTrailTime.current > TRAIL_INTERVAL) {
          lastTrailTime.current = now
          particlesRef.current?.trail(
            window.innerWidth / 2 + mx,
            window.innerHeight / 2,
          )
        }
      }

      // ตรวจว่าใบนี้เป็นใบสุดท้ายที่เหลือมั้ย (ตรวจก่อน add to gone)
      const isLastCard =
        gone.size === cards.length - 1 && !gone.has(index)

      // การ์ดปลิวออก → burst + เสียงติ้ว (ทุกใบรวมใบสุดท้าย)
      if (!active && trigger) {
        gone.add(index)
        particlesRef.current?.burst(
          window.innerWidth / 2 + mx,
          window.innerHeight / 2,
          10,
        )
        playSparkle()
      }

      api.start((i) => {
        if (index !== i) return
        const isGone = gone.has(index)
        const x = isGone
          ? (200 + window.innerWidth) * dir
          : active
            ? mx
            : 0
        const rot = mx / 100 + (isGone ? dir * 10 * vx : 0)
        const scale = active ? 1.1 : 1
        return {
          x,
          rot,
          scale,
          delay: undefined,
          config: {
            friction: 50,
            tension: active ? 800 : isGone ? 200 : 500,
          },
        }
      })

      // ใบสุดท้าย: ปลิวออกเหมือนใบอื่น → แล้วเด้งกลับ → ตั้งตรง → พลิก 3D
      if (!active && trigger && isLastCard) {
        isTransitioning.current = true

        // Phase 1: รอให้การ์ดปลิวออกไปก่อน แล้วดึงกลับมากลางจอ + ตั้งตรง
        addTimer(() => {
          api.start((i) => {
            if (i !== index) return
            return {
              x: 0,
              y: 0,
              rot: 0,
              scale: 1,
              tiltX: 0,
              config: { tension: 120, friction: 18 },
            }
          })
        }, 500)

        // Phase 2: เด้งกลับเรียบร้อย เริ่มพลิก 180°
        addTimer(() => {
          setFlippingIndex(index)
          api.start((i) => {
            if (i !== index) return
            return {
              flipY: 180,
              config: { tension: 120, friction: 14 },
            }
          })
        }, 1300)

        // 🔊 เสียง flip — เล่นตอนการ์ดหมุนถึงจุดกลาง (~90°)
        addTimer(() => playFlip(), 1500)

        // Phase 3: พลิกเสร็จ → ย่อขนาดให้เท่า CuteUnlockSlider
        addTimer(() => {
          api.start((i) => {
            if (i !== index) return
            return {
              cardW: SLIDER_W,
              cardH: SLIDER_H,
              config: { tension: 170, friction: 22 },
            }
          })
        }, 2500)

        // Phase 4: ย่อเสร็จ → ส่งต่อไปยัง CuteUnlockSlider
        addTimer(() => {
          onComplete?.()
        }, 3300)
      }
    },
  )

  return (
    <section
      className="relative z-10 grid min-h-screen place-items-center overflow-hidden"
      aria-label="Swipe cards to continue"
    >
      <SwipeParticles ref={particlesRef} />
      {props.map(({ x, y, rot, scale, flipY, tiltX, cardW, cardH }, i) => (
        <animated.div
          key={i}
          className="absolute flex items-center justify-center will-change-transform"
          style={{ x, y }}
        >
          <animated.div
            {...(flippingIndex === i ? {} : bind(i))}
            className={`relative select-none ${
              flippingIndex === i
                ? ''
                : 'cursor-grab touch-none active:cursor-grabbing'
            }`}
            style={{
              width: cardW.to((v) => `${v}px`),
              height: cardH.to((v) => `${v}px`),
              transformStyle: 'preserve-3d',
              transform: interpolate([rot, scale, flipY, tiltX], cardTrans),
            }}
          >
            {/* ด้านหน้า — รูปภาพ */}
            <div
              className="absolute inset-0 rounded-2xl border-4 bg-cover bg-center shadow-lg"
              style={{
                borderColor: clr.cardBorder,
                backgroundImage: `url(${cards[i]})`,
                backfaceVisibility: 'hidden',
              }}

            />
            {/* ด้านหลัง — Unlock Slider preview (เริ่มซ่อนไว้ด้วย rotateY 180°) */}
            <div
              className="absolute inset-0 grid place-items-center rounded-2xl text-center text-xl font-bold text-white shadow-2xl sm:text-2xl"
              style={{
                backgroundColor: clr.foregroundBg,
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="pointer-events-none">
                <p className="font-display tracking-wide">
                  Slide down to unlock ♡
                </p>
                <p className="mt-1 font-sans text-xs font-semibold text-white/70">
                  ลากลงให้สุดเพื่อปลดล็อก
                </p>
              </div>
            </div>
          </animated.div>
        </animated.div>
      ))}
    </section>
  )
}
