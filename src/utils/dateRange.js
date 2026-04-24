export const toIsoDate = (value) => {
  if (!value) return ''

  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value.slice(0, 10) : ''
  }

  return date.toISOString().slice(0, 10)
}

export const getDefaultMonthlyRange = (referenceDate = new Date()) => {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1)

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
