import { animated, useSpring } from '@react-spring/web'
import { useState } from 'react'

export function TestButton() {
  const [isHovered, setIsHovered] = useState(false)
  const springStyle = useSpring({
    transform: isHovered ? 'scale(1.08) translateY(-2px)' : 'scale(1) translateY(0px)',
    config: { tension: 320, friction: 12 },
  })

  return (
    <animated.button
      type="button"
      style={springStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="rounded-full bg-blossom-500 px-6 py-3 font-display text-lg font-semibold text-white shadow-lg shadow-blossom-300/50 focus:outline-none focus:ring-4 focus:ring-blossom-100"
    >
      Hover me ✨
    </animated.button>
  )
}
