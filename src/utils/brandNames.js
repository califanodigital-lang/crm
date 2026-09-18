// src/utils/brandNames.js
// Confronto dei nomi brand per evitare doppioni come "Cooler Master" e "CoolerMaster".

// Chiave normalizzata: minuscolo, senza accenti, senza spazi e punteggiatura,
// senza caratteri invisibili (capita di incollarli dai fogli di calcolo).
export const normalizeBrandKey = (nome) => (nome || '')
  .normalize('NFD')            // separa le lettere accentate dai segni diacritici
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '')   // via diacritici, spazi, punteggiatura e caratteri invisibili

const distanzaMax1 = (a, b) => {
  if (a === b) return true
  if (Math.abs(a.length - b.length) > 1) return false
  const [corto, lungo] = a.length <= b.length ? [a, b] : [b, a]
  let i = 0
  let j = 0
  let differenze = 0
  while (i < corto.length && j < lungo.length) {
    if (corto[i] === lungo[j]) { i += 1; j += 1; continue }
    differenze += 1
    if (differenze > 1) return false
    if (corto.length === lungo.length) { i += 1; j += 1 } else { j += 1 }
  }
  if (j < lungo.length) differenze += lungo.length - j
  return differenze <= 1
}

// Due nomi sono considerati simili se hanno la stessa chiave,
// se una chiave contiene l'altra (nomi lunghi) o se differiscono di un carattere.
export const sonoBrandSimili = (nomeA, nomeB) => {
  const a = normalizeBrandKey(nomeA)
  const b = normalizeBrandKey(nomeB)
  if (!a || !b) return false
  if (a === b) return true
  if (a.length >= 6 && b.length >= 6 && (a.startsWith(b) || b.startsWith(a))) return true
  if (a.length >= 5 && b.length >= 5) return distanzaMax1(a, b)
  return false
}

// Brand già presenti simili a quello che si sta salvando
export const trovaBrandSimili = (nome, brands = [], escludiId = null) => {
  const chiave = normalizeBrandKey(nome)
  if (!chiave) return []
  return brands.filter(b => b && b.id !== escludiId && sonoBrandSimili(nome, b.nome))
}

// Gruppi di brand con la stessa chiave normalizzata, per la vista "Possibili duplicati"
export const gruppiBrandDuplicati = (brands = []) => {
  const perChiave = new Map()
  brands.forEach(b => {
    const chiave = normalizeBrandKey(b?.nome)
    if (!chiave) return
    if (!perChiave.has(chiave)) perChiave.set(chiave, [])
    perChiave.get(chiave).push(b)
  })
  return [...perChiave.values()]
    .filter(gruppo => gruppo.length > 1)
    .sort((a, b) => (a[0]?.nome || '').localeCompare(b[0]?.nome || ''))
}

export const idBrandDuplicati = (brands = []) => new Set(
  gruppiBrandDuplicati(brands).flatMap(gruppo => gruppo.map(b => b.id))
)
