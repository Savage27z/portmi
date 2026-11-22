import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import { projects } from '../data/projects'

const lines = ['Building', 'creative', 'things', 'since 2023']

const skills = [
  { title: '3D & Games', note: 'Wingsuit races, co-op horror, rooftop parkour. If it runs at 60fps in a tab, I ship it.' },
  { title: 'AI Agents', note: 'Agents that trace stolen crypto, run a newsroom and vet their own installs, so I can sleep.' },
  { title: 'Onchain', note: 'Eleven chains so far, from Solana and Base to Sui and NEAR. I go wherever the bounty is.' },
  { title: 'Telegram Bots', note: 'Snipers, scanners, escrow and a prop-firm trader, all run from a chat.' },
  { title: 'Motion & UI', note: 'I use fancy motion to make my work look harder than it was.' },
]

const about =
  "Hi, I'm Idris Ahmed, a six-time hackathon winner from Lagos. I build browser games, AI agents, Telegram bots and onchain products that people actually use, then I make them move."

export default function Intro() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: '.statement', start: 'top top', end: '+=140%', scrub: 0.8, pin: true },
      })
      tl.fromTo('.statement-circle', { scale: 0 }, { scale: 1, ease: 'none', duration: 1 }, 0)
        .fromTo('.statement-ink', { '--r': '0vmax' }, { '--r': '19vmax', ease: 'none', duration: 1 }, 0)
        .from('.statement-line', { yPercent: 100, stagger: 0.12, duration: 0.5, ease: 'power3.out' }, 0)
        .to('.statement-photo', { scale: 1.08, duration: 1, ease: 'none' }, 0)

      gsap.utils.toArray<HTMLElement>('.about-copy .w').forEach((w) => {
        gsap.fromTo(
          w,
          { opacity: 0.12 },
          { opacity: 1, ease: 'none', scrollTrigger: { trigger: w, start: 'top 85%', end: 'top 55%', scrub: true } },
        )
      })

      gsap.from('.stat', {
        yPercent: 60,
        autoAlpha: 0,
        stagger: 0.1,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.stats', start: 'top 85%' },
      })
      gsap.from('.skill', {
        y: 40,
        autoAlpha: 0,
        stagger: 0.08,
        duration: 1,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.skills', start: 'top 80%' },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section className="intro" id="about" ref={root}>
      <div className="statement">
        <div className="statement-photo" />
        <div className="statement-circle" />
        <div className="statement-eyebrow mono">SAVAGE✰ — 2026</div>
        <h2 className="statement-text">
          {lines.map((l) => (
            <span className="statement-row" key={l}>
              <span className="statement-line">{l}</span>
            </span>
          ))}
        </h2>
        <h2 className="statement-text statement-ink" aria-hidden>
          {lines.map((l) => (
            <span className="statement-row" key={l}>
              <span className="statement-line">{l}</span>
            </span>
          ))}
        </h2>
      </div>

      <div className="about">
        <div className="about-label mono">(ABOUT ME)</div>
        <p className="about-copy">
          {about.split(' ').map((w, i) => (
            <span className="w" key={i}>
              {w}{' '}
            </span>
          ))}
        </p>
        <div className="stats">
          <div className="stat">
            <b>{String(projects.length).padStart(2, '0')}</b>
            <span className="mono">Projects shipped</span>
          </div>
          <div className="stat">
            <b>11</b>
            <span className="mono">Chains shipped on</span>
          </div>
          <div className="stat">
            <b>{String(projects.filter((p) => p.category === 'Games').length).padStart(2, '0')}</b>
            <span className="mono">Browser games</span>
          </div>
        </div>
      </div>

      <div className="skills">
        <div className="about-label mono">(WHAT I DO)</div>
        {skills.map((s, i) => (
          <div className="skill" key={s.title} data-cursor="✰">
            <span className="skill-idx mono">0{i + 1}</span>
            <h3>
              <span>{s.title}</span>
              <span aria-hidden>{s.title}</span>
            </h3>
            <p>{s.note}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
