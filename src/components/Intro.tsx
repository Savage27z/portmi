import gsap from 'gsap'
import { useEffect, useRef } from 'react'

const lines = ['Building', 'creative', 'things', 'since 2023']

const skills = [
  { title: '3D & Games', note: "If it can run at 60fps in a browser tab, I've probably tried to ship it." },
  { title: 'AI Agents', note: 'Swarms that research, write, investigate and argue, so I can sleep.' },
  { title: 'Onchain', note: 'Solana, Base, Cosmos, Sui, Arbitrum. I go wherever the bounty is.' },
  { title: 'Trading Bots', note: 'Latency arb, snipers, scanners. Some of them even make money.' },
  { title: 'Motion & UI', note: 'I use fancy motion to make my work look harder than it was.' },
]

const about =
  "Hi, I'm Idris Ahmed — SSS tier shipper. I make browser games, AI agent swarms, trading bots and onchain products that people actually use, then I make them move."

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
            <b>06</b>
            <span className="mono">Hackathon wins</span>
          </div>
          <div className="stat">
            <b>49</b>
            <span className="mono">Public repos</span>
          </div>
          <div className="stat">
            <b>5+</b>
            <span className="mono">Chains shipped on</span>
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
