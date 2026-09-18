// Le date si leggono e si scrivono nel fuso di chi usa il CRM.
// Con toISOString il giorno veniva convertito in ora di Greenwich: in Italia
// il primo giorno del mese diventava l'ultimo del mese precedente, e un
// incasso del 31 agosto finiva dentro settembre.
const soloData = (date) => {
  const anno = date.getFullYear()
  const mese = String(date.getMonth() + 1).padStart(2, '0')
  const giorno = String(date.getDate()).padStart(2, '0')
  return `${anno}-${mese}-${giorno}`
}

export const toIsoDate = (value) => {
  if (!value) return ''

  // Una stringa che e' gia' una data (AAAA-MM-GG, con o senza orario)
  // si tiene com'e': interpretarla come istante la sposterebbe di nuovo.
  if (typeof value === 'string') {
    const soloGiorno = value.match(/^(\d{4}-\d{2}-\d{2})/)
    if (soloGiorno) return soloGiorno[1]
  }

  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value.slice(0, 10) : ''
  }

  return soloData(date)
}

// Estremi inclusi: isDateInRange tiene dentro sia start sia end, quindi
// la fine e' l'ultimo giorno del mese e non il primo di quello dopo.
export const getDefaultMonthlyRange = (referenceDate = new Date()) => {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0)

  return {
    start: toIsoDate(start),
    end: toIsoDate(end),
  }
}

export const isDateRangeDisabled = (range) => !range?.start && !range?.end

export const isDateInRange = (value, start, end) => {
  const normalized = toIsoDate(value)
  if (!normalized) return false
  if (start && normalized < start) return false
  if (end && normalized > end) return false
  return true
}

export const hasAnyDateInRange = (values, start, end) => (
  (values || []).some(value => isDateInRange(value, start, end))
)

export const doesRangeOverlap = ({ startValue, endValue }, rangeStart, rangeEnd) => {
  const normalizedStart = toIsoDate(startValue) || toIsoDate(endValue)
  const normalizedEnd = toIsoDate(endValue) || normalizedStart

  if (!normalizedStart || !normalizedEnd) return false
  if (rangeStart && normalizedEnd < rangeStart) return false
  if (rangeEnd && normalizedStart > rangeEnd) return false
  return true
}
