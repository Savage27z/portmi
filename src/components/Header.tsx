import gsap from 'gsap'
import { useEffect, useState } from 'react'
import { getLenis } from '../lib/scroll'

const links = [
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Work' },
  { id: 'contact', label: 'Contact' },
]

export function useLagosTime() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  return { h: get('hour'), m: get('minute'), s: get('second') }
}

export default function Header({ entered }: { entered: boolean }) {
  const { h, m } = useLagosTime()

  useEffect(() => {
    if (!entered) return
    gsap.fromTo('.header > *', { yPercent: -120, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.08, duration: 1, ease: 'expo.out', delay: 0.6 })
  }, [entered])

  const go = (id: string) => getLenis()?.scrollTo('#' + id, { duration: 1.6 })

  return (
    <header className="header">
      <button className="logo" onClick={() => getLenis()?.scrollTo(0, { duration: 1.6 })} data-cursor="TOP">
        SAVAGE<span>✰</span>
      </button>
      <div className="header-time mono">
        LAGOS {h}
        <i>:</i>
        {m} WAT
      </div>
      <nav className="nav mono">
        {links.map((l, i) => (
          <button key={l.id} onClick={() => go(l.id)}>
            <sup>0{i + 1}</sup>
            <span data-text={l.label}>{l.label}</span>
          </button>
        ))}
      </nav>
    </header>
  )
}
