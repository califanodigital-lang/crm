const fields = ['referente', 'contatto', 'telefono']

export const normalizeExtraContacts = (rows) => (Array.isArray(rows) ? rows : [])
  .map(row => Object.fromEntries(fields.map(field => [field, String(row?.[field] || '').trim()])))
  .filter(row => fields.some(field => row[field]))

const contactKey = row => fields.map(field => String(row[field] || '').trim().toLowerCase()).join('|')

export const mergeExtraContacts = (...groups) => {
  const keys = new Set()
  return groups.flatMap(normalizeExtraContacts).filter(row => {
    const key = contactKey(row)
    if (keys.has(key)) return false
    keys.add(key)
    return true
  })
}

export const inheritCircuitContacts = (form, circuito, previousCircuito) => {
  const next = { ...form, circuitoId: circuito?.id || '' }
  fields.forEach(field => {
    const current = String(form[field] || '').trim()
    const previous = String(previousCircuito?.[field] || '').trim()
    if (!current || (previous && current === previous)) next[field] = circuito?.[field] || ''
  })
  const previousKeys = new Set(normalizeExtraContacts(previousCircuito?.contattiAggiuntivi).map(contactKey))
  const extras = normalizeExtraContacts(form.contattiAggiuntivi).filter(row => !previousKeys.has(contactKey(row)))
  const keys = new Set(extras.map(contactKey))
  normalizeExtraContacts(circuito?.contattiAggiuntivi).forEach(row => {
    if (!keys.has(contactKey(row))) { extras.push(row); keys.add(contactKey(row)) }
  })
  next.contattiAggiuntivi = extras
  return next
}
