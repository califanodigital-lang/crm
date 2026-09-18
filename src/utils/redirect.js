// src/utils/redirect.js
// Percorso richiesto prima del login: serve per tornarci subito dopo essere entrati.
export const percorsoDaRipristinare = (location) => {
  const from = location?.state?.from
  if (!from?.pathname || from.pathname === '/login') return '/dashboard'
  return `${from.pathname}${from.search || ''}${from.hash || ''}`
}
