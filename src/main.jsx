import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// GitHub Pages serve 404.html per i percorsi diversi dalla home e rimanda a /?redirect=/percorso.
// Ripristiniamo il percorso prima di avviare il router: così un link diretto
// (o un aggiornamento di pagina) resta sulla sezione richiesta.
const applicaRedirectPages = () => {
  try {
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get('redirect')
    if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) return

    params.delete('redirect')
    const query = params.toString()
    const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')
    const nuovoUrl = `${basePath}${redirect}${query ? `?${query}` : ''}${window.location.hash || ''}`
    window.history.replaceState(null, '', nuovoUrl)
  } catch {
    // Se qualcosa non va, si parte dalla home: nessun blocco per l'utente.
  }
}

applicaRedirectPages()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
