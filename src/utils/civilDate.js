export const romeToday = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date())

const parse = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toISOString().slice(0, 10) === value ? date : null
}
export const addCivilDays = (value, days) => {
  const date = parse(value)
  if (!date) return null
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
export const addCivilMonths = (value, months) => {
  const date = parse(value)
  if (!date) return null
  const day = date.getUTCDate()
  date.setUTCDate(1)
  date.setUTCMonth(date.getUTCMonth() + months)
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
  date.setUTCDate(Math.min(day, end))
  return date.toISOString().slice(0, 10)
}
