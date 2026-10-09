import { useEffect, useState } from 'react'
import { RefreshCw, Plus, CheckSquare, Trash2, Edit, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getActiveAgents } from '../services/userService'
import { createTask, getTasks, updateTask, deleteTask, getTaskCalendarStatuses } from '../services/taskService'
import { toast } from '../components/Toast'
import { confirm } from '../components/ConfirmModal'
import { formatDate } from '../utils/date'
import { romeToday } from '../utils/civilDate'
import { taskAssigneeIds, additionalTaskAssignees } from '../utils/taskAssignees'
import { sortTasksByDeadline } from '../utils/taskOrder'
import TaskAdditionalAssignees from '../components/TaskAdditionalAssignees'

export default function TasksPage() {
  const { user } = useAuth()
  const [calendarStatuses, setCalendarStatuses] = useState({})
  const [tasks, setTasks] = useState([])
  const [operators, setOperators] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [editing, setEditing] = useState(null)
  const [urgent, setUrgent] = useState(false)
  const [assigneeId, setAssigneeId] = useState(user.id)
  const [additionalAssigneeIds, setAdditionalAssigneeIds] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [scope, setScope] = useState('mine')
  const [showCompleted, setShowCompleted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pending, setPending] = useState([])
  const operatorName = id => operators.find(operator => operator.id === id)?.nomeCompleto || operators.find(operator => operator.id === id)?.agenteNome || 'Operatore non attivo'

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [rows, directory] = await Promise.all([getTasks(), getActiveAgents()])
        if (directory.error) throw directory.error
        const statuses = await getTaskCalendarStatuses(rows.map(row => row.id))
        if (active) { setCalendarStatuses(statuses); setTasks(rows); setOperators(directory.data); setError('') }
      } catch {
        if (active) setError('Impossibile caricare le task. Riprova; se la sezione e nuova, verifica la migrazione server.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    const refresh = () => { if (!document.hidden) load() }
    window.addEventListener('focus', refresh)
    return () => { active = false; window.removeEventListener('focus', refresh) }
  }, [])

  async function reload() {
    setLoading(true)
    try {
      const [rows, directory] = await Promise.all([getTasks(), getActiveAgents()])
      if (directory.error) throw directory.error
      setCalendarStatuses(await getTaskCalendarStatuses(rows.map(row => row.id)))
      setTasks(rows); setOperators(directory.data); setError('')
    } catch { setError('Impossibile aggiornare le task. Riprova.') }
    finally { setLoading(false) }
  }

  async function refreshCalendarStatus(id) {
    const statuses = await getTaskCalendarStatuses([id])
    setCalendarStatuses(current => ({ ...current, ...statuses }))
  }

  async function addTask(event) {
    event.preventDefault()
    if (!title.trim() || saving) return
    setSaving(true)
    try {
      const row = await createTask({ title, urgent, assigneeId, additionalAssigneeIds, description, dueDate })
      setTasks(current => [row, ...current])
      void refreshCalendarStatus(row.id)
      setTitle(''); setDescription(''); setDueDate(''); setUrgent(false); setAssigneeId(user.id); setAdditionalAssigneeIds([])
      toast.success(additionalAssigneeIds.length ? 'Task aggiunta e condivisa con gli assegnatari' : assigneeId === user.id ? 'Task aggiunta' : `Task assegnata a ${operatorName(assigneeId)}`)
    } catch { toast.error('Task non salvata. Verifica la connessione, la migrazione server e che l’assegnatario sia attivo.') }
    finally { setSaving(false) }
  }

  async function changeTask(task, changes) {
    setPending(current => [...current, task.id])
    try {
      const row = await updateTask(task.id, changes)
      setTasks(current => current.map(item => item.id === row.id ? row : item))
      void refreshCalendarStatus(row.id)
    } catch { toast.error('Modifica non salvata. Aggiorna la lista e riprova.') }
    finally { setPending(current => current.filter(id => id !== task.id)) }
  }

  async function saveEdit(event) {
    event.preventDefault()
    if (!editing?.title.trim() || pending.includes(editing.id)) return
    const draft = editing
    setPending(current => [...current, draft.id])
    try {
      const row = await updateTask(draft.id, {
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        due_date: draft.dueDate || null,
        assignee_id: draft.assigneeId,
        additional_assignee_ids: additionalTaskAssignees(draft.assigneeId, draft.additionalAssigneeIds),
        urgent: draft.urgent,
      })
      setTasks(current => current.map(item => item.id === row.id ? row : item))
      void refreshCalendarStatus(row.id)
      setEditing(null)
      toast.success('Task aggiornata')
    } catch { toast.error('Modifica non salvata. Verifica la connessione, la migrazione server e che l’assegnatario sia attivo.') }
    finally { setPending(current => current.filter(id => id !== draft.id)) }
  }

  async function removeTask(task) {
    setPending(current => [...current, task.id])
    try {
      if (!await confirm(`Eliminare la task "${task.title}"? La cancellazione e definitiva.`, { title: 'Elimina task', confirmLabel: 'Elimina' })) return
      await deleteTask(task.id)
      setTasks(current => current.filter(item => item.id !== task.id))
      toast.success('Task eliminata')
    } catch { toast.error('Task non eliminata. Verifica i permessi server e aggiorna la lista prima di riprovare.') }
    finally { setPending(current => current.filter(id => id !== task.id)) }
  }

  const calendarLabel = task => {
    const status = calendarStatuses[task.id]?.status
    if (!task.due_date && !['pending', 'error'].includes(status)) return ''
    return ({ disabled: 'Google Calendar non attivo', unavailable: 'Stato Google Calendar non disponibile', not_queued: 'Google Calendar: task precedente al collegamento', pending: 'Google Calendar: sincronizzazione in attesa', error: 'Google Calendar: invio non riuscito, nuovo tentativo automatico', synced: 'Google Calendar: sincronizzato', not_required: '' })[status] || 'Google Calendar: stato in aggiornamento'
  }

  const scoped = tasks.filter(task => scope === 'all' || taskAssigneeIds(task).includes(user.id))
  const needle = searchTerm.trim().toLowerCase()
  const matchingTasks = scoped.filter(task => !needle || [
    task.title, task.description, ...taskAssigneeIds(task).map(operatorName),
  ].some(value => String(value || '').toLowerCase().includes(needle)))
  const visible = sortTasksByDeadline(matchingTasks.filter(task => showCompleted || !task.completed))

  return <div className="max-w-5xl mx-auto">
    <header className="flex items-start justify-between gap-4 mb-6">
      <div><h1 className="text-3xl font-bold text-gray-900">Tasks</h1><p className="text-sm text-gray-500 mt-1">Le cose da fare, senza complicazioni.</p></div>
      <button className="btn-secondary" onClick={reload} disabled={loading} aria-label="Aggiorna task"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
    </header>
    {error && <div role="alert" className="rounded-xl bg-red-50 text-red-700 p-4 mb-4">{error}</div>}
    <form onSubmit={addTask} className="card mb-6">
      <label htmlFor="task-title" className="label">Nuova task</label>
      <input id="task-title" className="input w-full" placeholder="Cosa c’e da fare?" value={title} onChange={event => setTitle(event.target.value)} required maxLength={300} disabled={saving || loading || !!error} />
      <label htmlFor="task-description" className="label mt-4">Descrizione (facoltativa)</label>
      <textarea id="task-description" className="input w-full min-h-[90px]" value={description} onChange={event => setDescription(event.target.value)} maxLength={5000} disabled={saving || loading || !!error} placeholder="Dettagli utili per svolgere la task..." />
      <div className="flex flex-wrap items-end gap-4 mt-4">
        <div><label htmlFor="task-due-date" className="label">Scadenza (facoltativa)</label><input id="task-due-date" type="date" className="input" value={dueDate} onChange={event => setDueDate(event.target.value)} disabled={saving || loading || !!error} /></div>
        <div className="flex-1 min-w-48"><label htmlFor="task-assignee" className="label">Assegnatario principale</label><select id="task-assignee" className="input w-full" value={assigneeId} onChange={event => { setAssigneeId(event.target.value); setAdditionalAssigneeIds(current => additionalTaskAssignees(event.target.value, current)) }} disabled={saving || loading || !!error} required>{operators.map(operator => <option key={operator.id} value={operator.id}>{operator.nomeCompleto || operator.agenteNome}</option>)}</select></div>
        <label className="flex items-center gap-2 py-3 text-sm font-medium text-gray-700"><input type="checkbox" checked={urgent} onChange={event => setUrgent(event.target.checked)} disabled={saving} className="accent-yellow-500" /> Urgente</label>
        <button type="submit" className="btn-primary" disabled={saving || loading || !!error || !title.trim() || !operators.some(operator => operator.id === assigneeId)}><Plus className="w-4 h-4" />{saving ? 'Salvataggio...' : 'Aggiungi'}</button>
      </div>
      <TaskAdditionalAssignees operators={operators} primaryId={assigneeId} value={additionalAssigneeIds} onChange={setAdditionalAssigneeIds} disabled={saving || loading || !!error} />
    </form>
    <div className="relative mb-4">
      <label htmlFor="task-search" className="sr-only">Cerca task</label>
      <input id="task-search" type="search" className="input w-full pr-11" placeholder="Cerca titolo, descrizione o assegnatario..." value={searchTerm} onChange={event => setSearchTerm(event.target.value)} />
      <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
    <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
      <div className="flex rounded-xl bg-gray-100 p-1" role="group" aria-label="Filtro assegnatario">{[['mine', 'Le mie task'], ['all', 'Tutte']].map(([value, label]) => <button key={value} onClick={() => setScope(value)} aria-pressed={scope === value} className={`rounded-lg px-4 py-2 text-sm font-semibold ${scope === value ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-500'}`}>{label}</button>)}</div>
      <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={showCompleted} onChange={event => setShowCompleted(event.target.checked)} /> Mostra completate</label>
    </div>
    <p className="text-xs text-gray-500 mb-2">Prima le urgenti, anche senza scadenza. In ogni gruppo, prima le scadenze piu vicine, poi quelle senza data. Le completate restano in fondo.</p>
    <p className="text-xs text-gray-500 mb-3" role="status">{matchingTasks.filter(task => !task.completed).length} da completare</p>
    <div className="card !p-0 overflow-hidden">
      {loading ? <p className="p-6 text-gray-500" role="status">Caricamento...</p> : error ? <p className="p-6 text-gray-500">Aggiorna per visualizzare una lista attendibile.</p> : !visible.length ? <div className="p-8 text-center text-gray-500"><CheckSquare className="w-8 h-8 mx-auto mb-3 text-blue-800" /><p>{needle ? 'Nessuna task trovata con questa ricerca e i filtri selezionati.' : showCompleted ? 'Nessuna task in questa lista.' : 'Nessuna task da completare.'}</p></div> : <ul className="divide-y divide-gray-100">{visible.map(task => <li key={task.id} className="flex flex-wrap items-center gap-3 p-4">
        <input type="checkbox" checked={task.completed} onChange={event => changeTask(task, { completed: event.target.checked })} disabled={pending.includes(task.id) || editing?.id === task.id} aria-label={`${task.completed ? 'Riapri' : 'Completa'} ${task.title}`} className="w-5 h-5 accent-blue-800 shrink-0" />
        <div className="flex-1 min-w-0"><p className={`text-sm font-medium break-words ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</p>{task.description && <p className="text-sm text-gray-600 whitespace-pre-wrap break-words mt-1">{task.description}</p>}<p className="text-xs text-gray-500 mt-1">{taskAssigneeIds(task).map(operatorName).join(", ")}</p>{task.due_date && <p className={`text-xs mt-1 ${!task.completed && task.due_date < romeToday() ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>Scadenza: {formatDate(task.due_date)}{!task.completed && task.due_date < romeToday() ? ' - Scaduta' : ''}</p>}{calendarLabel(task) && <p className={`text-xs mt-1 ${calendarStatuses[task.id]?.status === 'error' ? 'text-amber-700' : 'text-gray-500'}`}>{calendarLabel(task)}</p>}</div>
        <button onClick={() => changeTask(task, { urgent: !task.urgent })} disabled={pending.includes(task.id) || editing?.id === task.id} aria-pressed={task.urgent} aria-label={`Urgenza: ${task.title}`} className={`text-xs font-semibold rounded-lg px-3 py-2 ${task.urgent ? 'bg-yellow-100 text-yellow-900' : 'bg-gray-50 text-gray-500'}`}>{task.urgent ? 'Urgente' : 'Non urgente'}</button>
        <button onClick={() => setEditing({ id: task.id, title: task.title, description: task.description || '', dueDate: task.due_date || '', assigneeId: task.assignee_id, additionalAssigneeIds: task.additional_assignee_ids || [], urgent: task.urgent })} disabled={pending.includes(task.id) || !!editing} aria-label={`Modifica ${task.title}`} className="flex items-center gap-1 p-2 rounded-lg text-blue-700 hover:bg-blue-50 disabled:opacity-50"><Edit className="w-4 h-4" /><span className="text-xs">Modifica</span></button>
        <button onClick={() => removeTask(task)} disabled={pending.includes(task.id) || editing?.id === task.id} aria-label={`Elimina ${task.title}`} title="Elimina task" className="p-2 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
        {editing?.id === task.id && <form onSubmit={saveEdit} className="w-full basis-full rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-3">
          <h2 className="font-semibold text-gray-900">Modifica task</h2>
          <fieldset disabled={pending.includes(task.id)} className="space-y-3">
            <label className="block text-sm text-gray-600">Titolo<input className="input mt-1" value={editing.title} onChange={e => setEditing(current => ({ ...current, title: e.target.value }))} required maxLength={300} autoFocus /></label>
            <label className="block text-sm text-gray-600">Descrizione<textarea className="input mt-1 min-h-[90px]" value={editing.description} onChange={e => setEditing(current => ({ ...current, description: e.target.value }))} maxLength={5000} /></label>
            <div className="flex flex-wrap gap-3">
              <label className="text-sm text-gray-600">Scadenza<input type="date" className="input mt-1" value={editing.dueDate} onChange={e => setEditing(current => ({ ...current, dueDate: e.target.value }))} /></label>
              <label className="flex-1 min-w-48 text-sm text-gray-600">Assegnatario principale<select className="input mt-1" value={editing.assigneeId} onChange={e => setEditing(current => ({ ...current, assigneeId: e.target.value, additionalAssigneeIds: additionalTaskAssignees(e.target.value, current.additionalAssigneeIds) }))} required>{!operators.some(o => o.id === editing.assigneeId) && <option value={editing.assigneeId}>{operatorName(editing.assigneeId)}</option>}{operators.map(o => <option key={o.id} value={o.id}>{o.nomeCompleto || o.agenteNome}</option>)}</select></label>
            </div>
            <TaskAdditionalAssignees operators={operators} primaryId={editing.assigneeId} value={editing.additionalAssigneeIds} onChange={ids => setEditing(current => ({ ...current, additionalAssigneeIds: ids }))} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.urgent} onChange={e => setEditing(current => ({ ...current, urgent: e.target.checked }))} /> Urgente</label>
            <div className="flex gap-2 justify-end"><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Annulla</button><button type="submit" className="btn-primary" disabled={!editing.title.trim()}>{pending.includes(task.id) ? 'Salvataggio...' : 'Salva modifiche'}</button></div>
          </fieldset>
        </form>}
      </li>)}</ul>}
    </div>
    <p className="text-xs text-gray-500 mt-3">La lista si aggiorna quando torni alla finestra. Usa Aggiorna per vedere le nuove assegnazioni mentre lavori.</p>
  </div>
}
