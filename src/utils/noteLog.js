export const noteId = note => note.id || `legacy-${note.timestamp || ''}-${note.topic || ''}-${note.contenuto || ''}`
export const noteBase = note => ({
  topic: note.topic || '', contenuto: note.contenuto || '',
  timestamp: note.timestamp || '', modificatoIl: note.modificatoIl || '',
})
export const chronologicalNotes = value => (Array.isArray(value) ? value : [])
  .filter(note => !note._deleted)
  .map(note => ({ ...note, id: noteId(note) }))
  .sort((a, b) => (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0))
