import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useLagosTime } from './Header'

function FanClock() {
  const { h, m, s } = useLagosTime()
  const hour = Number(h) % 12
  const labels = Array.from({ length: 13 }, (_, i) => i)
  const ax = 300
  const ay = 300
  return (
    <div className="fan">
      <svg viewBox="0 0 420 340" className="fan-svg">
        {labels.map((i) => {
          const a = Math.PI * (1 - i / 24) - Math.PI * 0.02
          const r = 230
          const x = ax - 40 + Math.cos(a) * r
          const y = ay - Math.sin(a) * r + 20
          const on = i === hour
          return (
            <g key={i} className={on ? 'on' : ''}>
              <path d={`M${x + 10} ${y} Q ${ax - 60} ${y + 10} ${ax - 20} ${ay - 40}`} />
              <text x={x - 6} y={y + 4} textAnchor="end">
                {String(i).padStart(2, '0')}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="fan-time">
        {h}
        <span className={Number(s) % 2 ? 'blink' : ''}>:</span>
        {m}
      </div>
    </div>
  )
}

export default function Contact() {
  const root = useRef<HTMLElement>(null)
  const [inverted, setInverted] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('inverted', inverted)
  }, [inverted])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.panel', {
        yPercent: 12,
        autoAlpha: 0,
        stagger: 0.12,
        duration: 1.4,
        ease: 'expo.out',
        scrollTrigger: { trigger: root.current, start: 'top 70%' },
      })
      gsap.from('.cta-line > span', {
        yPercent: 110,
        stagger: 0.08,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.cta', start: 'top 75%' },
      })
      const btn = root.current!.querySelector<HTMLElement>('.magnet')!
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' })
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' })
      const move = (e: PointerEvent) => {
        const r = btn.getBoundingClientRect()
        xTo((e.clientX - (r.left + r.width / 2)) * 0.35)
        yTo((e.clientY - (r.top + r.height / 2)) * 0.35)
      }
      const leave = () => {
        xTo(0)
        yTo(0)
      }
      btn.addEventListener('pointermove', move)
      btn.addEventListener('pointerleave', leave)
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section className="contact" id="contact" ref={root}>
      <div className="panels">
        <div className="panel panel-light">
          <div className="mono panel-head">LAGOS, NIGERIA</div>
          <FanClock />
          <button className="mono invert" onClick={() => setInverted((v) => !v)} data-cursor="FLIP">
            ◐ INVERT COLOR
          </button>
        </div>
        <div className="panel panel-dark">
          <div className="panel-nav mono">
            <a href="https://github.com/Savage27z" target="_blank" rel="noreferrer">
              GITHUB ↗
            </a>
            <a href="https://x.com/savage27z" target="_blank" rel="noreferrer">
              X / TWITTER ↗
            </a>
            <a href="https://t.me/savage27z" target="_blank" rel="noreferrer">
              TELEGRAM ↗
            </a>
            <a href="mailto:savage27zzz@gmail.com">EMAIL ↗</a>
          </div>
          <div className="cta">
            <div className="mono">(GOT AN IDEA?)</div>
            <a className="cta-mail" href="mailto:savage27zzz@gmail.com">savage27zzz@gmail.com</a>
            <h2>
              <span className="cta-line">
                <span>Let's build</span>
              </span>
              <span className="cta-line">
                <span>
                  something <em>savage.</em>
                </span>
              </span>
            </h2>
            <a className="magnet" href="mailto:savage27zzz@gmail.com" data-cursor="MAIL">
              <span>Say hello</span>
            </a>
          </div>
          <div className="panel-foot mono">
            <span>© 2026 SAVAGE✰</span>
            <span>BUILT WITH R3F · GSAP · LENIS</span>
          </div>
        </div>
      </div>
      <div className="wordmark" aria-hidden>
        SAVAGE✰
      </div>
    </section>
  )
}
