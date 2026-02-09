import { supabase } from '../lib/supabase'

const toCamelCase = (profile) => {
  if (!profile) return null
  return {
    id: profile.id,
    role: profile.role,
    nomeCompleto: profile.nome_completo,
    agenteNome: profile.agente_nome,
    attivo: profile.attivo,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  }
}

const toSnakeCase = (profile) => {
  return {
    role: profile.role,
    nome_completo: profile.nomeCompleto,
    agente_nome: profile.agenteNome,
    attivo: profile.attivo,
  }
}

// GET: Profilo utente corrente
export const getCurrentUserProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return { data: null, error }
  }
}

// GET: Tutti gli utenti (solo ADMIN)
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('nome_completo')

    if (error) throw error
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    console.error('Error fetching users:', error)
    return { data: null, error }
  }
}

// GET: Solo agenti attivi (per dropdown)
export const getActiveAgents = async () => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('attivo', true)
      .order('agente_nome')

    if (error) throw error
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    console.error('Error fetching agents:', error)
    return { data: null, error }
  }
}

// PUT: Aggiorna profilo
export const updateUserProfile = async (id, profileData) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(toSnakeCase(profileData))
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { data: null, error }
  }
}
