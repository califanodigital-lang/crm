import { supabase } from '../lib/supabase'
import { fetchAllRows } from './supabasePagination'

export const getTasks = () => fetchAllRows(() => supabase.from('tasks').select('*').order('created_at', { ascending: false }).order('id'))

export async function createTask({ title, urgent, assigneeId }) {
  const { data, error } = await supabase.from('tasks').insert({ title: title.trim(), urgent, assignee_id: assigneeId }).select().single()
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
