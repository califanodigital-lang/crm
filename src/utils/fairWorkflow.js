import { STATI_TRATTATIVA_FIERA_CHIUSI } from '../constants/constants'

export const isFairNegotiationArchived = (trattativa, eventi = []) => (
  STATI_TRATTATIVA_FIERA_CHIUSI.includes(trattativa.stato) || eventi.some(evento =>
    evento.stato === 'CHIUSA' && (
      evento.id === trattativa.eventoId || evento.trattativaFieraId === trattativa.id
    )
  )
)

export const sortFairNegotiations = (rows, mode = 'dateAsc') => [...rows].sort((a, b) => {
  if (mode === 'alpha') return (a.nome || '').localeCompare(b.nome || '', 'it')
  const left = a.dataInizio || a.dataFine || ''
  const right = b.dataInizio || b.dataFine || ''
  if (!left || !right) return left ? -1 : right ? 1 : (a.nome || '').localeCompare(b.nome || '', 'it')
  return (mode === 'dateDesc' ? right.localeCompare(left) : left.localeCompare(right)) || (a.nome || '').localeCompare(b.nome || '', 'it')
})
