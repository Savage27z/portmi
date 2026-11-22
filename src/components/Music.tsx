import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'

// Official "Drake - Topic" uploads (YouTube's own art tracks: the album cover, no video).
// They stream from YouTube, so every visitor hears the full song and nothing is hosted here.
// YouTube requires the player to stay visible (at least 200px tall), so it is the
// "now playing" screen; our own controls sit beside it, never on top of it.
const tracks = [
  { id: 'x30_IHP1x3s', title: 'Janice STFU', album: 'ICEMAN' },
  { id: 'zhY_0DoQCQs', title: 'Do Not Disturb', album: 'More Life' },
  { id: 'QIPPRSu2e9Q', title: "Yebba's Heartbreak", album: 'Certified Lover Boy' },
  { id: 'wnKoIQDfymE', title: 'Cameras / Good Ones Go', album: 'Take Care' },
  // the Views art track blocks embedding (Premium only), so this plays the DrakeVEVO upload
  // while thumbnails still use the Views album-art track
  { id: 'uxpDa-c-4Mc', art: 'USo0sAaJKR0', title: 'Hotline Bling', album: 'Views' },
]
const cover = (t: { id: string; art?: string }) => `https://i.ytimg.com/vi/${t.art ?? t.id}/hqdefault.jpg`

type YTPlayer = {
  loadVideoById: (id: string) => void
  cueVideoById: (id: string) => void
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (s: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  getDuration: () => number
}
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string
      width: string
      height: string
      playerVars: Record<string, number>
      events: { onReady?: () => void; onStateChange: (e: { data: number }) => void }
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

const fmt = (s: number) => {
  if (!isFinite(s) || s <= 0) return '0:00'
  const m = Math.floor(s / 60)
  return m + ':' + String(Math.floor(s % 60)).padStart(2, '0')
}

export default function Music() {
  const [open, setOpen] = useState(false)
  const [started, setStarted] = useState(false) // player is created on first open only
  const [current, setCurrent] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState({ t: 0, d: 0 })
  const host = useRef<HTMLDivElement>(null)
  const player = useRef<YTPlayer | null>(null)
  const currentRef = useRef(0)
  currentRef.current = current

  const playIndex = useCallback((i: number) => {
    const n = (i + tracks.length) % tracks.length
    setCurrent(n)
    setTime({ t: 0, d: 0 })
    player.current?.loadVideoById(tracks[n].id) // loads and starts playing
  }, [])

  useEffect(() => {
    if (!started || !host.current) return
    let cancelled = false
    loadYouTubeApi().then((YT) => {
      if (cancelled || !host.current || player.current) return
      player.current = new YT.Player(host.current, {
        videoId: tracks[currentRef.current].id,
        width: '100%',
        height: '100%',
        playerVars: { playsinline: 1, rel: 0, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, modestbranding: 1 },
        events: {
          onStateChange: (e) => {
            setPlaying(e.data === 1) // 1 = playing
            if (e.data === 0) playIndex(currentRef.current + 1) // 0 = ended: next song
          },
        },
      })
    })
    return () => {
      cancelled = true
    }
  }, [started, playIndex])

  // progress bar
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      const p = player.current
      if (p) setTime({ t: p.getCurrentTime(), d: p.getDuration() })
    }, 400)
    return () => clearInterval(id)
  }, [playing])

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

  const playPause = () => {
    const p = player.current
    if (!p) return
    if (playing) p.pauseVideo()
    else p.playVideo()
  }

  const seek = (e: MouseEvent<HTMLDivElement>) => {
    const p = player.current
    if (!p || !time.d) return
    const r = e.currentTarget.getBoundingClientRect()
    const s = ((e.clientX - r.left) / r.width) * time.d
    p.seekTo(s, true)
    setTime({ t: s, d: time.d })
  }

  const t = tracks[current]
  const pct = time.d ? Math.min(100, (time.t / time.d) * 100) : 0

  return (
    <div className={'music' + (open ? ' is-open' : '') + (playing ? ' is-playing' : '')}>
      <div className="music-panel" role="dialog" aria-label="Music" aria-hidden={!open}>
        <div className="music-head mono">
          <span>SAVAGE✰ RADIO</span>
          <button onClick={() => setOpen(false)} data-cursor="CLOSE" aria-label="Close music">
            ✕
          </button>
        </div>

        <div className="music-screen" style={{ backgroundImage: `url(${cover(t)})` }}>
          <div className="music-player">{started && <div ref={host} />}</div>
        </div>

        <div className="music-now">
          <div className="music-now-title">{t.title}</div>
          <div className="mono music-now-album">Drake · {t.album}</div>
        </div>

        <div className="music-progress" onClick={seek} data-cursor="SEEK" role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={Math.round(time.d)} aria-valuenow={Math.round(time.t)}>
          <i style={{ width: pct + '%' }} />
        </div>
        <div className="music-times mono">
          <span>{fmt(time.t)}</span>
          <span>{fmt(time.d)}</span>
        </div>

        <div className="music-controls">
          <button onClick={() => playIndex(current - 1)} aria-label="Previous" data-cursor="PREV" tabIndex={open ? 0 : -1}>
            <svg viewBox="0 0 24 24"><path d="M6 5h2v14H6zM20 5v14L9 12z" /></svg>
          </button>
          <button className="music-play" onClick={playPause} aria-label={playing ? 'Pause' : 'Play'} data-cursor={playing ? 'PAUSE' : 'PLAY'} tabIndex={open ? 0 : -1}>
            {playing ? (
              <svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
          <button onClick={() => playIndex(current + 1)} aria-label="Next" data-cursor="NEXT" tabIndex={open ? 0 : -1}>
            <svg viewBox="0 0 24 24"><path d="M16 5h2v14h-2zM4 5v14l11-7z" /></svg>
          </button>
        </div>

        <ol className="music-list">
          {tracks.map((tr, i) => (
            <li key={tr.id}>
              <button className={i === current ? 'on' : ''} onClick={() => playIndex(i)} data-cursor="PLAY" tabIndex={open ? 0 : -1}>
                <span className="music-thumb" style={{ backgroundImage: `url(${cover(tr)})` }} />
                <span className="music-row-text">
                  <span className="music-title">{tr.title}</span>
                  <span className="mono music-album">{tr.album}</span>
                </span>
                {i === current && playing ? (
                  <span className="eq eq-row" aria-hidden>
                    <i />
                    <i />
                    <i />
                  </span>
                ) : (
                  <span className="mono music-idx">{String(i + 1).padStart(2, '0')}</span>
                )}
              </button>
            </li>
          ))}
        </ol>
        <div className="music-note mono">Official audio via YouTube</div>
      </div>

      <button className="music-btn" onClick={toggle} data-cursor={open ? 'HIDE' : 'MUSIC'} aria-label="Music" aria-expanded={open}>
        <span className="vinyl" aria-hidden>
          <span className="vinyl-label" style={started ? { backgroundImage: `url(${cover(t)})` } : undefined} />
        </span>
      </button>
    </div>
  )
}
