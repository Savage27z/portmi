import gsap from 'gsap'
import { lazy, Suspense, useEffect, useRef } from 'react'
import { pointer, scrollState } from '../lib/scroll'

const HeroScene = lazy(() => import('./HeroScene'))

function Marquee() {
  const track = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let x = 0
    let dir = -1
    const tick = (_: number, dt: number) => {
      const v = scrollState.velocity
      if (Math.abs(v) > 0.5) dir = v > 0 ? -1 : 1
      const speed = 0.012 + Math.min(Math.abs(v) * 0.004, 0.08)
      x += dir * speed * dt * 0.1
      if (x <= -50) x += 50
      if (x > 0) x -= 50
      if (track.current) track.current.style.transform = `translate3d(${x}%,0,0)`
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])
  const text = 'Savage ✰ Creative Engineer — '
  return (
    <div className="marquee" aria-hidden>
      <div className="marquee-track" ref={track}>
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i}>{text}</span>
        ))}
      </div>
    </div>
  )
}


const FIGURE_SRC = '/hero/gabimaru.webp'

function Figure() {
  const wrap = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const el = img.current
    if (!el) return
    const rx = gsap.quickTo(el, 'rotationX', { duration: 1.2, ease: 'power3' })
    const ry = gsap.quickTo(el, 'rotationY', { duration: 1.2, ease: 'power3' })
    const tx = gsap.quickTo(el, 'xPercent', { duration: 1.4, ease: 'power3' })
    const tick = (t: number) => {
      ry(pointer.x * 6)
      rx(-pointer.y * 3)
      tx(pointer.x * 1.5)
      gsap.set(el, { scaleY: 1 + Math.sin(t * 1.6) * 0.006, scaleX: 1 - Math.sin(t * 1.6) * 0.002 })
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])
  return (
    <div className="hero-figure" ref={wrap}>
      <img
        ref={img}
        src={FIGURE_SRC}
        alt="Savage"
        draggable={false}
        onError={() => wrap.current?.classList.add('is-missing')}
      />
    </div>
  )
}

export default function Hero({ entered }: { entered: boolean }) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to('.hero-stage', {
        clipPath: 'polygon(14% 10%, 90% 4%, 82% 90%, 6% 98%)',
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
      gsap.to('.hero-copy', {
        yPercent: -60,
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: '60% top', scrub: true },
      })
      gsap.to('.hero-figure', {
        yPercent: -10,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!entered) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.5 })
      tl.from('.marquee', { yPercent: 110, duration: 1.6, ease: 'expo.out' })
        .from('.hero-figure', { yPercent: 30, autoAlpha: 0, duration: 1.8, ease: 'expo.out' }, 0.15)
        .from('.hero-pill', { xPercent: -110, duration: 1.2, ease: 'expo.out' }, 0.2)
        .from('.hero-role > *', { yPercent: 120, autoAlpha: 0, stagger: 0.08, duration: 1.1, ease: 'expo.out' }, 0.3)
        .from('.hero-scroll', { autoAlpha: 0, duration: 0.8 }, 0.8)
    }, root)
    return () => ctx.revert()
  }, [entered])

  return (
    <section className="hero" ref={root}>
      <div className="hero-stage" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }}>
        <div className="hero-glow" />
        <Marquee />
        <Figure />
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
        <div className="hero-grain" />
      </div>
      <div className="hero-copy">
        <div className="hero-pill" data-cursor="HI">
          <div>
            Based
            <br />
            in Lagos,
            <br />
            Nigeria
          </div>
          <div className="globe">
            <svg viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="14" />
              <ellipse className="spin" cx="20" cy="20" rx="6" ry="14" />
              <path d="M6 20h28M9 12h22M9 28h22" />
            </svg>
          </div>
        </div>
        <div className="hero-role">
          <span className="arrow">↘</span>
          <span>Creative Engineer</span>
        </div>
        <div className="hero-scroll mono">(SCROLL TO EXPLORE)</div>
      </div>
    </section>
  )
}
