import { useEffect, useRef, useState } from 'react'

// Official YouTube uploads only (DrakeVEVO and YouTube's "Drake - Topic" channel).
// They stream from YouTube, so every visitor hears the full song and nothing is hosted here.
// YouTube requires the player to stay visible and at least 200x200, so the card shows it.
const tracks = [
  { id: 'x30_IHP1x3s', title: 'Janice STFU', album: 'ICEMAN' },
  { id: 'zhY_0DoQCQs', title: 'Do Not Disturb', album: 'More Life' },
  { id: '9rlW2rUzyn0', title: "Yebba's Heartbreak", album: 'Certified Lover Boy' },
  { id: 'wnKoIQDfymE', title: 'Cameras / Good Ones Go', album: 'Take Care' },
  { id: 'uxpDa-c-4Mc', title: 'Hotline Bling', album: 'Views' },
]

type YTPlayer = { loadVideoById: (id: string) => void }
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string
      width: string
      height: string
      playerVars: Record<string, number>
      events: { onStateChange: (e: { data: number }) => void }
    },
  ) => YTPlayer
}
declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<YTNamespace> | null = null
function loadYouTubeApi() {
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      if (window.YT?.Player) return resolve(window.YT)
      window.onYouTubeIframeAPIReady = () => resolve(window.YT!)
      const s = document.createElement('script')
      s.src = 'https://www.youtube.com/iframe_api'
      s.async = true
      document.body.appendChild(s)
    })
  }
  return apiPromise
}

export default function Music() {
  const [open, setOpen] = useState(false)
  const [started, setStarted] = useState(false) // player is created on first open only
  const [current, setCurrent] = useState(0)
  const [playing, setPlaying] = useState(false)
  const host = useRef<HTMLDivElement>(null)
  const player = useRef<YTPlayer | null>(null)

  useEffect(() => {
    if (!started || !host.current) return
    let cancelled = false
    loadYouTubeApi().then((YT) => {
      if (cancelled || !host.current || player.current) return
      player.current = new YT.Player(host.current, {
        videoId: tracks[current].id,
        width: '100%',
        height: '100%',
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
        events: { onStateChange: (e) => setPlaying(e.data === 1) }, // 1 = playing
      })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started])

  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [open])

  const toggle = () => {
    setOpen((v) => !v)
    setStarted(true)
  }

  const pick = (i: number) => {
    setCurrent(i)
    player.current?.loadVideoById(tracks[i].id) // loads and starts playing
  }

  return (
    <div className={'music' + (open ? ' is-open' : '') + (playing ? ' is-playing' : '')}>
      <div className="music-panel" role="dialog" aria-label="Music" aria-hidden={!open}>
        <div className="music-head mono">
          <span>SAVAGE✰ RADIO</span>
          <button onClick={() => setOpen(false)} data-cursor="CLOSE" aria-label="Close music">
            ✕
          </button>
        </div>
        <ol className="music-list">
          {tracks.map((t, i) => (
            <li key={t.id}>
              <button className={i === current ? 'on' : ''} onClick={() => pick(i)} data-cursor="PLAY" tabIndex={open ? 0 : -1}>
                <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                <span className="music-title">{t.title}</span>
                <span className="mono music-album">{t.album}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="music-player">{started && <div ref={host} />}</div>
        <div className="music-note mono">Drake · via YouTube</div>
      </div>
      <button className="music-btn" onClick={toggle} data-cursor={open ? 'HIDE' : 'MUSIC'} aria-label="Music" aria-expanded={open}>
        <span className="eq" aria-hidden>
          <i />
          <i />
          <i />
          <i />
        </span>
      </button>
    </div>
  )
}
