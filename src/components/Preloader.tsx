import { useProgress } from '@react-three/drei'
import gsap from 'gsap'
import { useEffect, useRef, useState } from 'react'

export default function Preloader({ onEnter }: { onEnter: () => void }) {
  const { progress } = useProgress()
  const [count, setCount] = useState(0)
  const [ready, setReady] = useState(false)
  const [gone, setGone] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const circle = useRef<HTMLDivElement>(null)
  const shown = useRef({ v: 0 })

  useEffect(() => {
    const target = Math.max(progress, 0)
    const tween = gsap.to(shown.current, {
      v: target,
      duration: 1.6,
      ease: 'power2.out',
      onUpdate: () => setCount(Math.round(shown.current.v)),
      onComplete: () => {
        if (target >= 100) setReady(true)
      },
    })
    return () => {
      tween.kill()
    }
  }, [progress])

  useEffect(() => {
    const fallback = setTimeout(() => {
      gsap.to(shown.current, {
        v: 100,
        duration: 0.8,
        onUpdate: () => setCount(Math.round(shown.current.v)),
        onComplete: () => setReady(true),
      })
    }, 7000)
    return () => clearTimeout(fallback)
  }, [])

  const enter = () => {
    const tl = gsap.timeline({ onComplete: () => setGone(true) })
    tl.to('.pre-enter, .pre-mark', { autoAlpha: 0, y: -20, duration: 0.4, ease: 'power2.in' })
      .to('.pre-count', { yPercent: 100, duration: 0.6, ease: 'expo.in' }, 0)
      .fromTo(circle.current, { scale: 0 }, { scale: 1, duration: 1, ease: 'expo.inOut' }, 0.2)
      .add(onEnter, 0.95)
      .to(root.current, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, 1.05)
  }

  if (gone) return null

  return (
    <div className="preloader" ref={root} style={{ clipPath: 'inset(0% 0% 0% 0%)' }}>
      <div className="pre-mark">
        <span className="pre-star">✰</span>
        <span className="mono">SAVAGE / FOLIO — 2026</span>
      </div>
      <button className={'pre-enter' + (ready ? ' is-ready' : '')} onClick={enter} disabled={!ready} data-cursor="ENTER">
        <span>{ready ? 'ENTER' : 'LOADING'}</span>
      </button>
      <div className="pre-count-wrap">
        <div className="pre-count">{String(count).padStart(3, '0')}</div>
      </div>
      <div className="pre-circle" ref={circle} />
    </div>
  )
}
