import { useEffect, useRef, useState } from 'react'

// Official Spotify embeds only: the songs stream from Spotify, nothing is hosted here.
// Visitors logged into Spotify hear full tracks; everyone else gets 30-second previews.
const tracks = [
  { id: '5kQaR1wreGrkzJcXjysi8n', title: 'Do Not Disturb', album: 'More Life' },
  { id: '1PDP7mLiAMwhfmgIwzhOm2', title: "Yebba's Heartbreak", album: 'Certified Lover Boy' },
  { id: '1FswxShHCKgDSuNcZqfkk1', title: 'Cameras / Good Ones Go', album: 'Take Care' },
  { id: '0wwPcA6wtMf6HUMpIRdeP7', title: 'Hotline Bling', album: 'Views' },
  { id: '1svuouRvqWANBZJ0WqhLRn', title: '2 Hard 4 The Radio', album: 'ICEMAN' },
]

type Controller = {
  loadUri: (uri: string) => void
  play: () => void
  addListener: (event: string, cb: (e: { data: { isPaused: boolean } }) => void) => void
}
type IFrameAPI = {
  createController: (el: HTMLElement, opts: { uri: string; width: string; height: number }, cb: (c: Controller) => void) => void
}
declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: IFrameAPI) => void
  }
}

let apiPromise: Promise<IFrameAPI> | null = null
function loadSpotifyApi() {
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      window.onSpotifyIframeApiReady = resolve
      const s = document.createElement('script')
      s.src = 'https://open.spotify.com/embed/iframe-api/v1'
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
  const controller = useRef<Controller | null>(null)

  useEffect(() => {
    if (!started || !host.current) return
    let cancelled = false
    loadSpotifyApi().then((api) => {
      if (cancelled || !host.current) return
      api.createController(host.current, { uri: `spotify:track:${tracks[current].id}`, width: '100%', height: 80 }, (c) => {
        controller.current = c
        c.addListener('playback_update', (e) => setPlaying(!e.data.isPaused))
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
    const c = controller.current
    if (c) {
      c.loadUri(`spotify:track:${tracks[i].id}`)
      c.play()
    }
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
        <div className="music-note mono">Drake · via Spotify</div>
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
