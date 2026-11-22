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

// Every book gets its own height, thickness and cloth shade, fixed per project.
function bookStyle(p: Project) {
  let h = 0
  for (const c of p.id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const height = 76 + (h % 25) // 76–100% of the shelf
  const width = 2.8 + ((h >>> 5) % 23) / 10 // 2.8–5vw
  const tone = 34 + ((h >>> 9) % 28) // how much of the accent shows in the cloth
  return {
    ['--h' as string]: height + '%',
    ['--w' as string]: width + 'vw',
    ['--tone' as string]: tone + '%',
    ['--accent' as string]: p.accent,
  }
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
  // The book that's pulled off the shelf. Only a click pulls one out.
  const [picked, setPicked] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [open, setOpen] = useState<Open>(null)
  const p = list[Math.min(active, list.length - 1)]

  useEffect(() => {
    setActive(0)
    setPicked(null)
    track.current?.scrollTo({ left: 0 })
    gsap.fromTo('.strip', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', stagger: 0.04, duration: 1, ease: 'expo.out', clearProps: 'clipPath' })
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

  useEffect(() => {
    if (picked === null || open) return
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setPicked(null)
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [picked, open])

  const stripMedia = (i: number) => track.current?.querySelectorAll<HTMLElement>('.strip-media')[i]

  // Keep the strips in step with the project shown in the detail view,
  // so closing shrinks back into the right strip.
  const syncTo = (i: number) => {
    setActive(i)
    setPicked(i)
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
          <div className="work-hint mono">← SCROLL / DRAG SIDEWAYS → · CLICK A BOOK TO PULL IT OUT</div>
        </div>
        <div
          className="strips"
          ref={track}
          data-lenis-prevent-wheel
          onPointerLeave={() => picked !== null && setActive(picked)}
          onClick={(e) => {
            // clicking empty shelf puts the open book back
            if (e.target === e.currentTarget) setPicked(null)
          }}
        >
          {list.map((proj, i) => (
            <button
              key={proj.id}
              className={'strip' + (i === picked ? ' is-active' : '')}
              style={bookStyle(proj)}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={(e) => {
                if (picked === i) openAt(i, e.currentTarget.querySelector('.strip-media') as HTMLElement)
                else {
                  setPicked(i)
                  setActive(i)
                }
              }}
              data-cursor={picked === i ? 'OPEN' : 'PULL'}
              aria-label={(picked === i ? 'Open ' : 'Preview ') + proj.title}
            >
              <span className="book">
                <span className="book-page">
                  <span
                    className="put-back mono"
                    role="button"
                    tabIndex={picked === i ? 0 : -1}
                    data-cursor="BACK"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPicked(null)
                    }}
                  >
                    ✕ Put back
                  </span>
                  <span className="page-head mono">
                    <span>No. {String(i + 1).padStart(2, '0')}</span>
                    <span>{proj.type}</span>
                  </span>
                  <span className="strip-media plate">
                    <Media p={proj} />
                    <i className="corner tl" />
                    <i className="corner tr" />
                    <i className="corner bl" />
                    <i className="corner br" />
                  </span>
                  <span className="page-title">{proj.title}</span>
                  <span className="page-meta mono">
                    {proj.year} · {proj.stack.slice(0, 2).join(' · ')}
                  </span>
                  <span className="page-foot mono">Click to open ↗</span>
                  <span className="stamp mono">{proj.category}</span>
                </span>
                <span className="book-cover">
                  <span className="cover-front">
                    <span className="cover-title">{proj.title}</span>
                  </span>
                  <span className="cover-back">
                    <span className="bookplate mono">
                      Ex libris
                      <b>SAVAGE✰</b>
                    </span>
                  </span>
                </span>
              </span>
              <span className="spine" aria-hidden>
                <span className="spine-num mono">{String(i + 1).padStart(2, '0')}</span>
                <span className="spine-title">{proj.title}</span>
                <span className="spine-cat mono">{proj.category}</span>
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
