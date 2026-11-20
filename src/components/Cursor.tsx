import gsap from 'gsap'
import { useEffect, useRef, useState } from 'react'

export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    const xDot = gsap.quickTo(dot.current, 'x', { duration: 0.08 })
    const yDot = gsap.quickTo(dot.current, 'y', { duration: 0.08 })
    const xRing = gsap.quickTo(ring.current, 'x', { duration: 0.45, ease: 'power3' })
    const yRing = gsap.quickTo(ring.current, 'y', { duration: 0.45, ease: 'power3' })
    const move = (e: PointerEvent) => {
      xDot(e.clientX)
      yDot(e.clientY)
      xRing(e.clientX)
      yRing(e.clientY)
      const el = (e.target as HTMLElement).closest('[data-cursor], a, button') as HTMLElement | null
      const text = el?.dataset.cursor ?? ''
      setLabel(text)
      document.body.classList.toggle('cursor-hover', !!el)
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])

  return (
    <>
      <div className="cursor-dot" ref={dot} />
      <div className={'cursor-ring' + (label ? ' has-label' : '')} ref={ring}>
        <span>{label}</span>
      </div>
    </>
  )
}
