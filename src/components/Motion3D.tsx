import { useEffect, useRef, type ReactNode, type CSSProperties } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/** Soft floating blue orbs for depth behind hero / sections */
export function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="float-orb float-orb-delayed"
        style={{
          width: 280,
          height: 280,
          left: '8%',
          top: '12%',
          background: 'rgba(0, 51, 173, 0.22)',
        }}
      />
      <div
        className="float-orb"
        style={{
          width: 340,
          height: 340,
          right: '4%',
          top: '28%',
          background: 'rgba(56, 189, 248, 0.18)',
          animationDelay: '1.2s',
        }}
      />
      <div
        className="float-orb float-orb-delayed"
        style={{
          width: 200,
          height: 200,
          left: '42%',
          bottom: '8%',
          background: 'rgba(29, 78, 216, 0.16)',
          animationDelay: '3s',
        }}
      />
    </div>
  )
}

/**
 * Mouse-follow parallax scene — children lag behind cursor (3D depth).
 */
export function ParallaxScene({
  children,
  className = '',
  intensity = 18,
}: {
  children: ReactNode
  className?: string
  intensity?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 80, damping: 20, mass: 0.7 })
  const sy = useSpring(my, { stiffness: 80, damping: 20, mass: 0.7 })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      mx.set(px * intensity)
      my.set(py * intensity)
    }
    const onLeave = () => {
      mx.set(0)
      my.set(0)
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [intensity, mx, my])

  return (
    <div ref={ref} className={`perspective-scene relative ${className}`}>
      <motion.div style={{ x: sx, y: sy, transformStyle: 'preserve-3d' as const }}>{children}</motion.div>
    </div>
  )
}

/** Card that tilts toward cursor with spring lag */
export function TiltCard({
  children,
  className = '',
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 140, damping: 18 })
  const sry = useSpring(ry, { stiffness: 140, damping: 18 })

  return (
    <motion.div
      ref={ref}
      className={`tilt-3d relative ${className}`}
      style={{
        ...style,
        rotateX: srx,
        rotateY: sry,
        transformStyle: 'preserve-3d' as const,
      }}
      onMouseMove={(e) => {
        const el = ref.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        ry.set(px * 12)
        rx.set(-py * 10)
      }}
      onMouseLeave={() => {
        rx.set(0)
        ry.set(0)
      }}
    >
      <div style={{ transform: 'translateZ(20px)' }}>{children}</div>
    </motion.div>
  )
}

/** Lagging floating element */
export function DriftBadge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -12, 0], rotate: [-1.5, 1.5, -1.5] }}
      transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}
