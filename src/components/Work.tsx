import gsap from 'gsap'
import { useEffect, useRef, useState } from 'react'
import { projects, type Project } from '../data/projects'
import Poster from './Poster'
import ProjectDetail from './ProjectDetail'

type Open = { index: number; rect: DOMRect; from: HTMLElement } | null

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
            <span className="ch" key={i} style={{ animationDelay: `${n++ * 22}ms` }}>
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
  const [active, setActive] = useState(0)
  const [view, setView] = useState<'strips' | 'index'>('strips')
  const [open, setOpen] = useState<Open>(null)
  const preview = useRef<HTMLDivElement>(null)
  const p = projects[active]

  useEffect(() => {
    if (view !== 'strips') return
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add('(min-width: 900px)', () => {
        const track = root.current!.querySelector<HTMLElement>('.strips')!
        const distance = () => Math.max(0, track.scrollWidth - track.clientWidth + window.innerWidth * 0.1)
        gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: '.work-stage',
            start: 'top top',
            end: () => '+=' + (distance() + window.innerHeight * 0.6),
            scrub: 0.6,
            pin: true,
            invalidateOnRefresh: true,
            onUpdate: (st) => {
              const i = Math.min(projects.length - 1, Math.floor(st.progress * projects.length))
              setActive((cur) => (document.querySelector('.strip:hover') ? cur : i))
            },
          },
        })
      })
      gsap.from('.strip', {
        clipPath: 'inset(100% 0% 0% 0%)',
        stagger: 0.04,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.work-stage', start: 'top 70%' },
      })
    }, root)
    return () => ctx.revert()
  }, [view])

  useEffect(() => {
    if (view !== 'index') return
    const el = preview.current
    if (!el) return
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' })
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' })
    const move = (e: PointerEvent) => {
      x(e.clientX)
      y(e.clientY)
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [view])

  const openAt = (index: number, el: HTMLElement) => {
    setActive(index)
    setOpen({ index, rect: el.getBoundingClientRect(), from: el })
  }

  return (
    <section className="work" id="work" ref={root}>
      <div className="work-head">
        <div className="mono">(SELECTED WORK — {String(projects.length).padStart(2, '0')})</div>
        <h2 className="work-title">Work</h2>
        <div className="work-toggle mono">
          {(['strips', 'index'] as const).map((v) => (
            <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'strips' ? (
        <div className="work-stage">
          <div className="ticks" aria-hidden>
            {projects.map((_, i) => (
              <i key={i} className={i === active ? 'on' : ''} />
            ))}
          </div>
          <div className="work-info">
            <div className="work-index mono">
              {String(active + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
            </div>
            <h3 className="work-name">
              <SplitTitle text={p.title} />
            </h3>
            <div className="work-meta mono">
              <span>
                <em>A</em>
                {p.type}
              </span>
              <span>
                <em>B</em>
                {p.year}
              </span>
              <span>
                <em>C</em>
                {p.stack.slice(0, 2).join(' · ')}
              </span>
            </div>
            <p className="work-blurb" key={p.id}>
              {p.blurb}
            </p>
          </div>
          <div className="strips">
            {projects.map((proj, i) => (
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
        </div>
      ) : (
        <div className="index-list" onPointerLeave={() => preview.current?.classList.remove('on')}>
          {projects.map((proj, i) => (
            <button
              key={proj.id}
              className="index-row"
              onPointerEnter={() => {
                setActive(i)
                preview.current?.classList.add('on')
              }}
              onClick={() => openAt(i, preview.current!.querySelector('.preview-media') as HTMLElement)}
              data-cursor="OPEN"
            >
              <span className="mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="index-title">{proj.title}</span>
              <span className="mono index-type">{proj.type}</span>
              <span className="mono">{proj.year}</span>
            </button>
          ))}
          <div className="preview" ref={preview}>
            <div className="preview-media">
              <Media p={p} />
            </div>
          </div>
        </div>
      )}

      {open && (
        <ProjectDetail
          index={open.index}
          rect={open.rect}
          getReturnRect={() => {
            const strip = document.querySelectorAll<HTMLElement>('.strip .strip-media')[active]
            return (strip ?? open.from).getBoundingClientRect()
          }}
          onIndex={setActive}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  )
}
