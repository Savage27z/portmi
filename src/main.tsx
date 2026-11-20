import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/league-spartan/500.css'
import '@fontsource/league-spartan/700.css'
import '@fontsource/league-spartan/800.css'
import '@fontsource/big-shoulders-display/700'
import '@fontsource/big-shoulders-display/900'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/inter-tight/400.css'
import '@fontsource/inter-tight/500.css'
import './styles.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
