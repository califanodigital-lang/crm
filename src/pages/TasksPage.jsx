import { useEffect, useState } from 'react'
import { RefreshCw, Plus, CheckSquare, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getActiveAgents } from '../services/userService'
import { createTask, getTasks, updateTask, deleteTask } from '../services/taskService'
import { toast } from '../components/Toast'
import { confirm } from '../components/ConfirmModal'

export default function TasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [operators, setOperators] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [assigneeId, setAssigneeId] = useState(user.id)
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
        if (active) { setTasks(rows); setOperators(directory.data); setError('') }
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
      setTasks(rows); setOperators(directory.data); setError('')
    } catch { setError('Impossibile aggiornare le task. Riprova.') }
    finally { setLoading(false) }
  }

  async function addTask(event) {
    event.preventDefault()
    if (!title.trim() || saving) return
    setSaving(true)
    try {
      const row = await createTask({ title, urgent, assigneeId })
      setTasks(current => [row, ...current])
      setTitle(''); setUrgent(false)
      toast.success(assigneeId === user.id ? 'Task aggiunta' : `Task assegnata a ${operatorName(assigneeId)}`)
    } catch { toast.error('Task non salvata. Verifica la connessione e che l’assegnatario sia attivo.') }
    finally { setSaving(false) }
  }

  async function changeTask(task, changes) {
    setPending(current => [...current, task.id])
    try {
      const row = await updateTask(task.id, changes)
      setTasks(current => current.map(item => item.id === row.id ? row : item))
    } catch { toast.error('Modifica non salvata. Aggiorna la lista e riprova.') }
    finally { setPending(current => current.filter(id => id !== task.id)) }
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

  const scoped = tasks.filter(task => scope === 'all' || task.assignee_id === user.id)
  const visible = scoped.filter(task => showCompleted || !task.completed).sort((a, b) => Number(a.completed) - Number(b.completed) || Number(b.urgent) - Number(a.urgent) || b.created_at.localeCompare(a.created_at))

  return <div className="max-w-5xl mx-auto">
    <header className="flex items-start justify-between gap-4 mb-6">
      <div><h1 className="text-3xl font-bold text-gray-900">Tasks</h1><p className="text-sm text-gray-500 mt-1">Le cose da fare, senza complicazioni.</p></div>
      <button className="btn-secondary" onClick={reload} disabled={loading} aria-label="Aggiorna task"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
    </header>
    {error && <div role="alert" className="rounded-xl bg-red-50 text-red-700 p-4 mb-4">{error}</div>}
    <form onSubmit={addTask} className="card mb-6">
      <label htmlFor="task-title" className="label">Nuova task</label>
      <input id="task-title" className="input w-full" placeholder="Cosa c’e da fare?" value={title} onChange={event => setTitle(event.target.value)} required maxLength={300} disabled={saving || loading || !!error} />
      <div className="flex flex-wrap items-end gap-4 mt-4">
        <div className="flex-1 min-w-48"><label htmlFor="task-assignee" className="label">Assegnatario</label><select id="task-assignee" className="input w-full" value={assigneeId} onChange={event => setAssigneeId(event.target.value)} disabled={saving || loading || !!error} required>{operators.map(operator => <option key={operator.id} value={operator.id}>{operator.nomeCompleto || operator.agenteNome}</option>)}</select></div>
        <label className="flex items-center gap-2 py-3 text-sm font-medium text-gray-700"><input type="checkbox" checked={urgent} onChange={event => setUrgent(event.target.checked)} disabled={saving} className="accent-yellow-500" /> Urgente</label>
        <button type="submit" className="btn-primary" disabled={saving || loading || !!error || !title.trim() || !operators.some(operator => operator.id === assigneeId)}><Plus className="w-4 h-4" />{saving ? 'Salvataggio...' : 'Aggiungi'}</button>
      </div>
    </form>
    <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
      <div className="flex rounded-xl bg-gray-100 p-1" role="group" aria-label="Filtro assegnatario">{[['mine', 'Le mie task'], ['all', 'Tutte']].map(([value, label]) => <button key={value} onClick={() => setScope(value)} aria-pressed={scope === value} className={`rounded-lg px-4 py-2 text-sm font-semibold ${scope === value ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-500'}`}>{label}</button>)}</div>
      <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={showCompleted} onChange={event => setShowCompleted(event.target.checked)} /> Mostra completate</label>
    </div>
    <p className="text-xs text-gray-500 mb-3" role="status">{scoped.filter(task => !task.completed).length} da completare</p>
    <div className="card !p-0 overflow-hidden">
      {loading ? <p className="p-6 text-gray-500" role="status">Caricamento...</p> : error ? <p className="p-6 text-gray-500">Aggiorna per visualizzare una lista attendibile.</p> : !visible.length ? <div className="p-8 text-center text-gray-500"><CheckSquare className="w-8 h-8 mx-auto mb-3 text-blue-800" /><p>{showCompleted ? 'Nessuna task in questa lista.' : 'Nessuna task da completare.'}</p></div> : <ul className="divide-y divide-gray-100">{visible.map(task => <li key={task.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-4">
        <input type="checkbox" checked={task.completed} onChange={event => changeTask(task, { completed: event.target.checked })} disabled={pending.includes(task.id)} aria-label={`${task.completed ? 'Riapri' : 'Completa'} ${task.title}`} className="w-5 h-5 accent-blue-800 shrink-0" />
        <div className="flex-1 min-w-0"><p className={`text-sm font-medium break-words ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</p><p className="text-xs text-gray-500 mt-1">{operatorName(task.assignee_id)}</p></div>
        <button onClick={() => changeTask(task, { urgent: !task.urgent })} disabled={pending.includes(task.id)} aria-pressed={task.urgent} aria-label={`Urgenza: ${task.title}`} className={`text-xs font-semibold rounded-lg px-3 py-2 ${task.urgent ? 'bg-yellow-100 text-yellow-900' : 'bg-gray-50 text-gray-500'}`}>{task.urgent ? 'Urgente' : 'Non urgente'}</button>
        <button onClick={() => removeTask(task)} disabled={pending.includes(task.id)} aria-label={`Elimina ${task.title}`} title="Elimina task" className="p-2 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
      </li>)}</ul>}
    </div>
    <p className="text-xs text-gray-500 mt-3">La lista si aggiorna quando torni alla finestra. Usa Aggiorna per vedere le nuove assegnazioni mentre lavori.</p>
  </div>
}
