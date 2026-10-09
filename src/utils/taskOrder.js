export const sortTasksByDeadline = tasks => [...tasks].sort((a, b) => {
  const completed = Number(Boolean(a.completed)) - Number(Boolean(b.completed))
  if (completed) return completed
  const urgent = Number(Boolean(b.urgent)) - Number(Boolean(a.urgent))
  if (urgent) return urgent
  const left = a.due_date || ''
  const right = b.due_date || ''
  if (left !== right) {
    if (!left) return 1
    if (!right) return -1
    return left.localeCompare(right)
  }
  return String(b.created_at || '').localeCompare(String(a.created_at || ''))
    || String(a.id || '').localeCompare(String(b.id || ''))
})
