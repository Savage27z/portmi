import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const scrollState = { velocity: 0, progress: 0 }

let lenis: Lenis | null = null

export function startLenis() {
  if (lenis) return lenis
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 })
  lenis.on('scroll', (l: Lenis) => {
    scrollState.velocity = l.velocity
    scrollState.progress = l.progress
    ScrollTrigger.update()
  })
  gsap.ticker.add((t) => lenis?.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
  return lenis
}

export const getLenis = () => lenis

export const pointer = { x: 0, y: 0, cx: 0, cy: 0 }

if (typeof window !== 'undefined') {
  window.addEventListener('pointermove', (e) => {
    pointer.cx = e.clientX
    pointer.cy = e.clientY
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
  })
}
