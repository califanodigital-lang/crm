import { supabase } from '../lib/supabase'
import { fetchAllRows } from './supabasePagination'
import { additionalTaskAssignees } from '../utils/taskAssignees'

export const getTasks = () => fetchAllRows(() => supabase.from('tasks').select('*').order('created_at', { ascending: false }).order('id'))

export async function createTask({ title, urgent, assigneeId, description = '', dueDate = '', additionalAssigneeIds = [] }) {
  const { data, error } = await supabase.from('tasks').insert({ title: title.trim(), urgent, assignee_id: assigneeId, additional_assignee_ids: additionalTaskAssignees(assigneeId, additionalAssigneeIds), description: description.trim() || null, due_date: dueDate || null }).select().single()
  if (error) throw error
  return data
}

export async function updateTask(id, changes) {
  const { data, error } = await supabase.from('tasks').update(changes).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteTask(id) {
  const { data, error } = await supabase.from('tasks').delete().eq('id', id).select('id').single()
  if (error) throw error
  return data
}

export async function getTaskCalendarStatuses(taskIds) {
  if (!taskIds.length) return {}
  const statuses = {}
  // Keep status reads within Supabase's response limit for large task lists.
  for (let offset = 0; offset < taskIds.length; offset += 200) {
    const ids = taskIds.slice(offset, offset + 200)
    try {
      const { data, error } = await supabase.rpc('crm_task_calendar_status', { task_ids: ids })
      if (error) throw error
      Object.assign(statuses, Object.fromEntries((data || []).map(item => [item.task_id, item])))
    } catch {
      Object.assign(statuses, Object.fromEntries(ids.map(id => [id, { status: 'unavailable' }])))
    }
  }
  return statuses
}
