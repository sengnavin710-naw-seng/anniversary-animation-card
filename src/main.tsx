import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { setupMobileAudio } from './utils/sounds'
import unlockSound from './assets/unlock-sound.mp3'

// Create Audio element + register touch bless (must happen before any user gesture)
setupMobileAudio(unlockSound)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
