import { useEffect, useState } from 'react'
import Preloader from './components/Preloader'
import Cursor from './components/Cursor'
import Header from './components/Header'
import Hero from './components/Hero'
import Intro from './components/Intro'
import Work from './components/Work'
import Contact from './components/Contact'
import Music from './components/Music'
import { startLenis } from './lib/scroll'

export default function App() {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const lenis = startLenis()
    if (entered) lenis.start()
    else lenis.stop()
  }, [entered])

  return (
    <>
      <Cursor />
      <Preloader onEnter={() => setEntered(true)} />
      <Header entered={entered} />
      {entered && <Music />}
      <main>
        <Hero entered={entered} />
        <Intro />
        <Work />
        <Contact />
      </main>
    </>
  )
}
