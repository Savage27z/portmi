import gsap from 'gsap'
import { useEffect, useMemo, useRef, useState } from 'react'
import { categories, projects, type Project } from '../data/projects'
import Poster from './Poster'
import ProjectDetail from './ProjectDetail'

type Open = { index: number; rect: DOMRect } | null
const tabs = ['All', ...categories] as const

function Media({ p }: { p: Project }) {
  return p.img ? <img src={p.img} alt="" loading="lazy" draggable={false} /> : <Poster project={p} />
}

function SplitTitle({ text }: { text: string }) {
  let n = 0
  return (
    <span className="split" key={text}>
      {text.split(' ').map((word, w) => (
        <span className="word" key={w}>
          {word.split('').map((c, i) => (
            <span className="ch" key={i} style={{ animationDelay: (n++ * 22) + 'ms' }}>
              {c}
            </span>
          ))}{' '}
        </span>
      ))}
    </span>
  )
}

export default function Work() {
  const root = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<(typeof tabs)[number]>('All')
  const list = useMemo(() => (tab === 'All' ? projects : projects.filter((p) => p.category === tab)), [tab])
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)
  const [open, setOpen] = useState<Open>(null)
  const p = list[Math.min(active, list.length - 1)]

  useEffect(() => {
    setActive(0)
    track.current?.scrollTo({ left: 0 })
    gsap.fromTo('.strip', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', stagger: 0.04, duration: 1, ease: 'expo.out' })
  }, [tab])

  useEffect(() => {
    const el = track.current
    if (!el) return
    let target = el.scrollLeft
    let raf = 0
    const animate = () => {
      el.scrollLeft += (target - el.scrollLeft) * 0.14
      if (Math.abs(target - el.scrollLeft) > 0.5) raf = requestAnimationFrame(animate)
    }
    const wheel = (e: WheelEvent) => {
      const max = el.scrollWidth - el.clientWidth
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      const next = Math.max(0, Math.min(max, target + delta))
      if (next === target && Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      target = next
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(animate)
    }
    let down = false
    let startX = 0
    let startLeft = 0
    let moved = false
    const pd = (e: PointerEvent) => {
      down = true
      moved = false
      startX = e.clientX
      startLeft = el.scrollLeft
    }
    const pm = (e: PointerEvent) => {
      if (!down) return
      const dx = e.clientX - startX
      if (Math.abs(dx) > 4) moved = true
      target = startLeft - dx
      el.scrollLeft = target
    }
    const pu = () => (down = false)
    const click = (e: MouseEvent) => {
      if (moved) {
        e.stopPropagation()
        e.preventDefault()
      }
    }
    const scroll = () => {
      const max = el.scrollWidth - el.clientWidth
      setProgress(max > 0 ? el.scrollLeft / max : 0)
      if (!down && Math.abs(target - el.scrollLeft) < 1) target = el.scrollLeft
    }
    el.addEventListener('wheel', wheel, { passive: false })
    el.addEventListener('pointerdown', pd)
    window.addEventListener('pointermove', pm)
    window.addEventListener('pointerup', pu)
    el.addEventListener('click', click, true)
    el.addEventListener('scroll', scroll)
    return () => {
      el.removeEventListener('wheel', wheel)
      el.removeEventListener('pointerdown', pd)
      window.removeEventListener('pointermove', pm)
      window.removeEventListener('pointerup', pu)
      el.removeEventListener('click', click, true)
      el.removeEventListener('scroll', scroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  const openAt = (index: number, el: HTMLElement) => {
    setActive(index)
    setOpen({ index, rect: el.getBoundingClientRect() })
  }

  const stripMedia = (i: number) => track.current?.querySelectorAll<HTMLElement>('.strip-media')[i]

  // Keep the strips in step with the project shown in the detail view,
  // so closing shrinks back into the right strip.
  const syncTo = (i: number) => {
    setActive(i)
    const strip = stripMedia(i)?.parentElement
    const el = track.current
    if (strip && el) el.scrollLeft = Math.max(0, strip.offsetLeft - el.clientWidth * 0.15)
  }

  return (
    <section className="work" id="work" ref={root}>
      <div className="work-head">
        <div className="mono">(SELECTED WORK — {String(projects.length).padStart(2, '0')})</div>
        <h2 className="work-title">Work</h2>
        <div className="work-toggle mono">
          {tabs.map((t) => (
            <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
              {t}
              <sup>{t === 'All' ? projects.length : projects.filter((x) => x.category === t).length}</sup>
            </button>
          ))}
        </div>
      </div>

      <div className="work-stage">
        <div className="work-info">
          <div className="work-index mono">
            {String(active + 1).padStart(2, '0')} / {String(list.length).padStart(2, '0')} — {p.category}
          </div>
          <h3 className="work-name">
            <SplitTitle text={p.title} />
          </h3>
          <div className="work-meta mono">
            <span><em>A</em>{p.type}</span>
            <span><em>B</em>{p.year}</span>
            <span><em>C</em>{p.stack.slice(0, 2).join(' · ')}</span>
          </div>
          <p className="work-blurb" key={p.id}>{p.blurb}</p>
          <div className="work-hint mono">← SCROLL / DRAG SIDEWAYS →</div>
        </div>
        <div className="strips" ref={track} data-lenis-prevent-wheel>
          {list.map((proj, i) => (
            <button
              key={proj.id}
              className={'strip' + (i === active ? ' is-active' : '')}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={(e) => openAt(i, e.currentTarget.querySelector('.strip-media') as HTMLElement)}
              data-cursor="OPEN"
              aria-label={'Open ' + proj.title}
            >
              <span className="strip-num mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="strip-media">
                <Media p={proj} />
              </span>
            </button>
          ))}
        </div>
        <div className="work-bar"><i style={{ transform: 'scaleX(' + progress + ')' }} /></div>
      </div>

      {open && (
        <ProjectDetail
          list={list}
          index={open.index}
          rect={open.rect}
          getReturnRect={(i) => stripMedia(i)?.getBoundingClientRect() ?? open.rect}
          onIndex={syncTo}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  )
}
