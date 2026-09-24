import { useEffect, useRef, useState } from 'react'
import { animated, easings, useSpring, useSprings } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import anniversaryPhoto from '../assets/anniversary-photo.jpg'
import notebookCard from '../assets/notebook-card-blank.png'
import type { ColorTheme } from '../utils/colorTheme'
import { DEFAULT_THEME } from '../utils/colorTheme'

// BACKGROUND is now derived from colors prop
const ANNIVERSARY_TITLE = 'Happy Anniversary 3Years'
const HEART_MOVE_DURATION = 900
const NOTE_TEXT = [
  'Lorem ipsum dolor sit amet.',
  'Consectetur adipiscing elit.',
  'A little note written with love.',
  'Happy anniversary, always. ♡',
].join('\n')
const SPARKLE_TRAIL = [
  { x: -70, y: 34, delay: 0, size: 'text-sm' },
  { x: -34, y: 72, delay: 50, size: 'text-base' },
  { x: 8, y: 104, delay: 100, size: 'text-xs' },
  { x: 48, y: 76, delay: 150, size: 'text-sm' },
  { x: 78, y: 42, delay: 200, size: 'text-base' },
]

type CuteUnlockSliderProps = {
  title?: string
  noteText?: string
  mainPhoto?: string
  colors?: ColorTheme
  initiallyUnlocked?: boolean
}

export function CuteUnlockSlider(props: CuteUnlockSliderProps) {
  const actualTitle = props.title ?? ANNIVERSARY_TITLE
  const actualNoteText = props.noteText ?? NOTE_TEXT
  const actualPhoto = props.mainPhoto ?? anniversaryPhoto
  const clr = props.colors ?? DEFAULT_THEME
  const initUnlocked = props.initiallyUnlocked ?? false
  const baseCardRef = useRef<HTMLDivElement>(null)
  const [isUnlocked, setIsUnlocked] = useState(initUnlocked)
  const [showTitle, setShowTitle] = useState(initUnlocked)
  const [showTopEffects, setShowTopEffects] = useState(initUnlocked)
  const [showUnderline, setShowUnderline] = useState(initUnlocked)
  const [showFallingHeart, setShowFallingHeart] = useState(false)
  const [showHeartBox, setShowHeartBox] = useState(initUnlocked)
  const [isHeartExpanding, setIsHeartExpanding] = useState(initUnlocked)
  const [showHeartBoxShadow, setShowHeartBoxShadow] = useState(initUnlocked)
  const [startOuterProgress, setStartOuterProgress] = useState(initUnlocked)
  const [showOuterFrameFinish, setShowOuterFrameFinish] = useState(initUnlocked)
  const [typedTitle, setTypedTitle] = useState(initUnlocked ? actualTitle : '')
  const [typedNote, setTypedNote] = useState(initUnlocked ? actualNoteText : '')
  const [{ dragY, baseY, foregroundOpacity, heartScale, heartX, scale }, api] = useSpring(() => ({
    dragY: initUnlocked ? 500 : 0,
    baseY: initUnlocked ? (40 - window.innerHeight / 2) : 0,
    foregroundOpacity: initUnlocked ? 0 : 1,
    heartScale: initUnlocked ? 1 : 0.5,
    heartX: initUnlocked ? 216 : 0,
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
    opacity: initUnlocked ? 1 : 0,
    scale: initUnlocked ? 1 : 0.15,
    borderRadius: initUnlocked ? '1rem' : '999px',
  }))
  const notebookStyle = useSpring({
    opacity: showHeartBoxShadow ? 1 : 0,
    scaleX: showHeartBoxShadow ? 1 : 0.08,
    config: { duration: 1000, easing: easings.easeOutCubic },
  })
  const outerProgressStyle = useSpring({
    from: { opacity: 0, strokeDashoffset: 6000 },
    to: {
      opacity: startOuterProgress ? 1 : 0,
      strokeDashoffset: startOuterProgress ? 0 : 6000,
    },
    config: { duration: 8000, easing: easings.easeInOutCubic },
    // หัวเส้นเห็นทันทีตอนเริ่มพิมพ์ ส่วนความยาวเส้นค่อย ๆ วิ่งรอบกรอบ
    immediate: (key) => key === 'opacity',
  })
  const cardProgressStyle = useSpring({
    from: { opacity: 0, strokeDashoffset: 4000 },
    to: {
      opacity: startOuterProgress ? 1 : 0,
      strokeDashoffset: startOuterProgress ? 0 : 4000,
    },
    config: { duration: 8000, easing: easings.easeInOutCubic },
    immediate: (key) => key === 'opacity',
  })
  // แสดงพื้นกรอบและเงาเมื่อ Typewriter กับเส้นกรอบวาดจบครบทั้งหมดแล้ว
  const outerFrameFinishStyle = useSpring({
    opacity: showOuterFrameFinish ? 1 : 0,
    config: { duration: 650, easing: easings.easeOutCubic },
  })
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

    const characterDelay = HEART_MOVE_DURATION / actualTitle.length
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
          // เริ่มเคลื่อนทันทีหลัง Typewriter จบ แล้วค่อยชะลอนุ่ม ๆ เมื่อถึงปลายทาง
          config: { duration: 1200, easing: easings.easeOutQuad },
        })

        // หัวใจถึงกลางพื้นที่รูปแล้ว จึงขยายต่อเป็นกล่องสี่เหลี่ยม
        // ปลด mask ก่อนขยาย เพื่อไม่ให้เกิดขอบสี่เหลี่ยมตัดหัวใจระหว่าง transition
        setIsHeartExpanding(true)
        await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
        setShowHeartBox(true)
        const expandHeartBox = heartBoxApi.start({
          from: { opacity: 0, scale: 0.15, borderRadius: '999px' },
          to: { opacity: 1, scale: 1, borderRadius: '1.5rem' },
          config: { duration: 650, easing: easings.easeOutCubic },
        })
        await next({
          opacity: 0,
          scale: 6,
          config: { duration: 650, easing: easings.easeOutCubic },
        })
        await expandHeartBox
        setShowHeartBoxShadow(true)
      },
    })
  }, [fallingHeartApi, heartBoxApi, typedTitle])

  // เส้นกรอบเริ่มวิ่งก่อน → Typewriter เริ่มที่ 4.5 วิ (เส้นวิ่งได้ครึ่งทาง)
  useEffect(() => {
    if (!showHeartBoxShadow) return

    setTypedNote('')
    const TYPEWRITER_START = 3500
    const characterDelay = 18
    const timerIds: number[] = []

    // เริ่มเส้นกรอบวิ่ง (หลังสมุดกางครบ 1 วิ)
    const strokeTimer = window.setTimeout(() => {
      setStartOuterProgress(true)
    }, 1000)

    // Typewriter เริ่มตอนเส้นวิ่งได้ประมาณครึ่งทาง
    const typewriterTimer = window.setTimeout(() => {
      actualNoteText.split('').forEach((_, index) => {
        timerIds.push(window.setTimeout(() => {
          setTypedNote(actualNoteText.slice(0, index + 1))
        }, (index + 1) * characterDelay))
      })
    }, 1000 + TYPEWRITER_START)

    return () => {
      window.clearTimeout(strokeTimer)
      window.clearTimeout(typewriterTimer)
      timerIds.forEach((timerId) => window.clearTimeout(timerId))
    }
  }, [showHeartBoxShadow])


  // ข้อความยาวกว่าแอนิเมชันเส้นกรอบ จึงถือว่าเป็นจังหวะสุดท้ายของทั้ง sequence
  useEffect(() => {
    if (typedNote !== actualNoteText) return

    const finishTimer = window.setTimeout(() => setShowOuterFrameFinish(true), 120)
    return () => window.clearTimeout(finishTimer)
  }, [typedNote])

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
      baseY: (() => {
        const el = baseCardRef.current;
        if (!el) return -window.innerHeight / 2 + 88;
        const rect = el.getBoundingClientRect();
        // Card bottom should sit just above image box (top-40 = 160px), with 12px gap
        const targetBottom = 160 - 12;
        return targetBottom - rect.bottom;
      })(),
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
      {showHeartBoxShadow && (
        <animated.div
          className="pointer-events-none absolute left-1/2 top-1 z-[1] w-[calc(100%+1rem)] max-w-[22rem] -translate-x-1/2 rounded-[2.45rem] shadow-md"
          style={{
            height: 'calc(min(20rem, 100vw - 2rem) + 24.75rem)',
            opacity: outerFrameFinishStyle.opacity,
            backgroundImage:
              'radial-gradient(circle at 12% 10%, rgba(253, 164, 196, 0.55) 0%, rgba(253, 164, 196, 0) 43%), radial-gradient(circle at 88% 90%, rgba(249, 168, 212, 0.52) 0%, rgba(249, 168, 212, 0) 48%), linear-gradient(145deg, #fffdfd 0%, #ffeaf3 36%, #ffffff 59%, #ffe7f1 100%)',
          }}
          aria-hidden="true"
        />
      )}
      {showHeartBoxShadow && (
        <animated.svg
          className="pointer-events-none absolute left-1/2 top-1 z-[6] w-[calc(100%+1rem)] max-w-[22rem] -translate-x-1/2 overflow-visible"
          style={{ height: 'calc(min(20rem, 100vw - 2rem) + 24.75rem)' }}
          viewBox="0 0 1000 2000"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            {/* เงา SVG แยกจาก CSS เพื่อให้เบราว์เซอร์บนมือถือแสดงเงารอบเส้นได้แน่นอน */}
            <filter id="outer-frame-finish-shadow" x="-12%" y="-12%" width="124%" height="132%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor={clr.photoBorder} floodOpacity="0.9" />
              <feDropShadow dx="0" dy="18" stdDeviation="13" floodColor={clr.titleCardBg} floodOpacity="0.5" />
            </filter>
          </defs>
          {showOuterFrameFinish && (
            <animated.path
              d="M 105 5 H 895 Q 995 5 995 105 V 1895 Q 995 1995 895 1995 H 105 Q 5 1995 5 1895 V 105 Q 5 5 105 5 Z"
              fill="none"
              stroke={clr.photoBorder}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"

              style={{ opacity: outerFrameFinishStyle.opacity }}
            />
          )}
          <animated.path
            d="M 105 5 H 895 Q 995 5 995 105 V 1895 Q 995 1995 895 1995 H 105 Q 5 1995 5 1895 V 105 Q 5 5 105 5 Z"
            fill="none"
            stroke={clr.titleCardBg}
            strokeWidth="4"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6000 6000"
            style={outerProgressStyle}
          />
        </animated.svg>
      )}
      <div className="relative isolate z-30 h-28 w-full max-w-xs">
        <animated.span
          style={{ opacity: softGlow.opacity, scale: softGlow.scale, y: baseY, background: `linear-gradient(to right, rgba(255,255,255,0.5), ${clr.titleCardBg}60, ${clr.bgTo}50)` }}
          className="pointer-events-none absolute -inset-x-5 -inset-y-4 z-0 rounded-[2rem] blur-2xl"
          aria-hidden="true"
        />
        {/* การ์ดฐาน: จะเป็นเพียงชั้นที่เลื่อนขึ้นหลังปลดล็อก */}
        <animated.div
          ref={baseCardRef}
          style={{ background: `linear-gradient(120deg, ${clr.titleCardBg}88 0%, ${clr.titleCardBg} 100%)`, y: baseY }}
          className="absolute inset-0 z-10 grid touch-none select-none items-center overflow-visible rounded-2xl px-8 shadow-lg"
        >
          {showHeartBoxShadow && (
            <animated.svg className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
              <animated.path
                d="M 105 5 H 895 Q 995 5 995 105 V 895 Q 995 995 895 995 H 105 Q 5 995 5 895 V 105 Q 5 5 105 5 Z"
                fill="none"
                stroke={clr.photoBorder}
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4000 4000"
                style={cardProgressStyle}
              />
            </animated.svg>
          )}
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
              className={`pointer-events-none absolute left-1/2 top-full z-20 ml-[-2.5rem] h-[calc(100vh-2rem)] w-20 ${
                isHeartExpanding ? 'overflow-visible' : 'overflow-hidden'
              }`}
              aria-hidden="true"
            >
              <animated.span
                style={fallingHeartStyle}
                className="absolute left-1/2 top-0 -ml-6 select-none text-5xl leading-none"
              >
                💗
              </animated.span>
            </div>
          )}
        </animated.div>

        {/* การ์ดชั้นหน้า: ผู้ใช้ลากลงได้ และจะ fade เมื่อปลดล็อกสำเร็จ */}
        <animated.div
          {...bind()}
          style={{ y: dragY, scale, opacity: foregroundOpacity, backgroundColor: clr.foregroundBg }}
          className="absolute inset-0 z-20 grid cursor-grab touch-none select-none place-items-center rounded-2xl text-center text-xl font-bold text-white shadow-2xl active:cursor-grabbing sm:text-2xl"
        >
          <div className="pointer-events-none">
            <p className="font-display tracking-wide">Slide down to unlock ♡</p>
            <p className="mt-1 font-sans text-xs font-semibold text-white/70">ลากลงให้สุดเพื่อปลดล็อก</p>
          </div>
        </animated.div>
      </div>
      {showHeartBox && (
        <div
          className="pointer-events-none absolute left-1/2 top-40 z-10 w-[calc(100vw-2rem)] max-w-xs -translate-x-1/2"
          aria-hidden="true"
        >
          <div className="relative aspect-square w-full">
            <animated.div
              style={heartBoxStyle}
              className={`absolute inset-0 overflow-hidden border-[4px] border-transparent transition-shadow duration-700 ease-out ${
                showOuterFrameFinish ? 'shadow-lg' : ''
              }`}
            >
              <img
                src={actualPhoto}
                alt="Anniversary memory"
                className="h-full w-full object-cover"
              />
            </animated.div>
            {showHeartBoxShadow && (
              <animated.svg className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
                <animated.path
                  d="M 105 5 H 895 Q 995 5 995 105 V 895 Q 995 995 895 995 H 105 Q 5 995 5 895 V 105 Q 5 5 105 5 Z"
                  fill="none"
                  stroke={clr.titleCardBg}
                  strokeWidth="4"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="4000 4000"
                  style={cardProgressStyle}
                />
              </animated.svg>
            )}
          </div>

          {showHeartBoxShadow && (
            <animated.section
              style={{
                opacity: notebookStyle.opacity,
                transform: notebookStyle.scaleX.to((value) => `scaleX(${value})`),
              }}
              className={`relative mt-6 h-[200px] w-full origin-left overflow-hidden rounded-[1.4rem] border-[4px] border-transparent bg-pink-100 transition-shadow duration-700 ease-out ${
                showOuterFrameFinish ? 'shadow-md' : ''
              }`}
            >
              <img
                src={notebookCard}
                alt=""
                className="absolute inset-0 h-full w-full object-cover contrast-[1.1] saturate-[1.15]"
              />
              <animated.svg className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
                <animated.path
                  d="M 105 5 H 895 Q 995 5 995 105 V 895 Q 995 995 895 995 H 105 Q 5 995 5 895 V 105 Q 5 5 105 5 Z"
                  fill="none"
                  stroke={clr.titleCardBg}
                  strokeWidth="4"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="4000 4000"
                  style={cardProgressStyle}
                />
              </animated.svg>
              <p className="absolute inset-x-[10%] top-1/2 z-10 -translate-y-1/2 whitespace-pre-wrap text-center font-sans text-[clamp(0.85rem,3.5vw,1.1rem)] font-medium leading-[23px] tracking-[-0.01em] text-pink-700">
                {typedNote}
                {typedNote && typedNote.length < actualNoteText.length && (
                  <span className="cursor-blink ml-px text-pink-500">|</span>
                )}
              </p>
            </animated.section>
          )}
        </div>
      )}
    </main>
  )
}
