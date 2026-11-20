import gsap from 'gsap'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Project } from '../data/projects'
import { getLenis } from '../lib/scroll'
import Poster from './Poster'

type Props = {
  list: Project[]
  index: number
  rect: DOMRect
  getReturnRect: (index: number) => DOMRect
  onIndex: (i: number) => void
  onClose: () => void
}

export default function ProjectDetail({ list, index: start, rect, getReturnRect, onIndex, onClose }: Props) {
  const [index, setIndex] = useState(start)
  const root = useRef<HTMLDivElement>(null)
  const media = useRef<HTMLDivElement>(null)
  const busy = useRef(true)
  const p = list[index]

  useEffect(() => {
    getLenis()?.stop()
    const tl = gsap.timeline({
      onComplete: () => {
        busy.current = false
        onIndex(start)
      },
    })
    tl.set(media.current, { top: rect.top, left: rect.left, width: rect.width, height: rect.height })
      .to(media.current, { top: 0, left: 0, width: '100vw', height: '100vh', duration: 1.2, ease: 'expo.inOut' })
      .to('.detail-shade', { autoAlpha: 1, duration: 0.8 }, 0.7)
      .from('.detail-title .ch', { yPercent: 110, stagger: 0.025, duration: 1, ease: 'expo.out' }, 0.9)
      .from('.detail-fade', { y: 30, autoAlpha: 0, stagger: 0.06, duration: 0.9, ease: 'expo.out' }, 1)
    return () => {
      getLenis()?.start()
    }
  }, [rect])

  const close = () => {
    if (busy.current) return
    busy.current = true
    const r = getReturnRect(index)
    gsap
      .timeline({ onComplete: onClose })
      .to('.detail-fade, .detail-title', { autoAlpha: 0, y: -20, duration: 0.4, ease: 'power2.in' })
      .to('.detail-shade', { autoAlpha: 0, duration: 0.4 }, 0)
      .to(media.current, { top: r.top, left: r.left, width: r.width, height: r.height, duration: 1.1, ease: 'expo.inOut' }, 0.2)
  }

  const go = (dir: number) => {
    if (busy.current) return
    busy.current = true
    const next = (index + dir + list.length) % list.length
    gsap
      .timeline()
      .to('.detail-title .ch', { yPercent: -110, stagger: 0.015, duration: 0.5, ease: 'expo.in' })
      .to('.detail-fade', { autoAlpha: 0, duration: 0.3 }, 0)
      .to(media.current, { clipPath: dir > 0 ? 'inset(0% 0% 100% 0%)' : 'inset(100% 0% 0% 0%)', duration: 0.7, ease: 'expo.in' }, 0)
      .add(() => {
        setIndex(next)
        onIndex(next)
      })
      .add(() => {
        gsap
          .timeline({ onComplete: () => (busy.current = false) })
          .fromTo(media.current, { clipPath: dir > 0 ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.out' })
          .fromTo('.detail-title .ch', { yPercent: 110 }, { yPercent: 0, stagger: 0.025, duration: 0.9, ease: 'expo.out' }, 0.1)
          .fromTo('.detail-fade', { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.8, ease: 'expo.out' }, 0.2)
      }, '+=0.05')
  }

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  })

  return createPortal(
    <div className="detail" ref={root} role="dialog" aria-label={p.title}>
      <div className="detail-media" ref={media} style={{ ['--accent' as string]: p.accent }}>
        {p.img ? <img src={p.img} alt="" /> : <Poster project={p} big />}
      </div>
      <div className="detail-shade" />
      <div className="detail-body">
        <div className="detail-top detail-fade mono">
          <span>
            {String(index + 1).padStart(2, '0')} / {String(list.length).padStart(2, '0')}
          </span>
          <button onClick={close} data-cursor="CLOSE">
            CLOSE ✕
          </button>
        </div>
        <h2 className="detail-title" key={p.id}>
          {p.title.split(' ').map((word, w) => (
            <span className="word" key={w}>
              {word.split('').map((c, i) => (
                <span className="ch-wrap" key={i}>
                  <span className="ch">{c}</span>
                </span>
              ))}
            </span>
          ))}
        </h2>
        <div className="detail-grid mono">
          <div className="detail-fade">
            <em>A</em>COMPLETED<b>{p.year}</b>
          </div>
          <div className="detail-fade">
            <em>B</em>TYPE<b>{p.type}</b>
          </div>
          <div className="detail-fade">
            <em>C</em>ROLE<b>{p.role}</b>
          </div>
          <div className="detail-fade">
            <em>D</em>STACK<b>{p.stack.join(', ')}</b>
          </div>
        </div>
        <p className="detail-blurb detail-fade">{p.blurb}</p>
        <div className="detail-actions detail-fade">
          {p.live && (
            <a className="pill pill-solid" href={p.live} target="_blank" rel="noreferrer" data-cursor="VISIT">
              Visit live ↗
            </a>
          )}
          <a className="pill" href={p.repo} target="_blank" rel="noreferrer" data-cursor="CODE">
            Source ↗
          </a>
          <div className="detail-nav">
            <button className="pill" onClick={() => go(-1)} data-cursor="PREV">
              ←
            </button>
            <button className="pill" onClick={() => go(1)} data-cursor="NEXT">
              →
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
