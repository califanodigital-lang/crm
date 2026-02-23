import { supabase } from '../lib/supabase'

// Utility per convertire valori vuoti in null
const cleanValue = (value) => {
  if (value === '' || value === undefined) return null
  return value
}

// Utility per convertire da snake_case (DB) a camelCase (Frontend)
const toCamelCase = (creator) => {
  if (!creator) return null
  return {
    id: creator.id,
    nome: creator.nome,
    nomeCompleto: creator.nome_completo,
    ricontattare: creator.ricontattare,
    stato: creator.stato,
    inizioCollaborazione: creator.inizio_collaborazione,
    scadenzaContratto: creator.scadenza_contratto,
    tipoContratto: creator.tipo_contratto,
    proviggioni: creator.proviggioni,
    topic: creator.topic,
    tier: creator.tier,
    cellulare: creator.cellulare,
    email: creator.email,
    note: creator.note,
    mediakit: creator.mediakit,
    ultimoAggiornamentoMediakit: creator.ultimo_aggiornamento_mediakit,
    strategia: creator.strategia,
    collaborazioniLunghe: creator.collaborazioni_lunghe,
    fiereEventi: creator.fiere_eventi,
    obiettivo: creator.obiettivo,
    insight: creator.insight,
    preferenzaCollaborazioni: creator.preferenza_collaborazioni,
    dataContratto: creator.data_firma_contratto,
    sales: creator.sales,
    categoriaAdv: creator.categoria_adv,
    createdAt: creator.created_at,
    updatedAt: creator.updated_at,
  }
}

// Utility per convertire da camelCase (Frontend) a snake_case (DB)
const toSnakeCase = (creator) => {
  return {
    nome: creator.nome,
    nome_completo: cleanValue(creator.nomeCompleto),
    ricontattare: cleanValue(creator.ricontattare),
    stato: cleanValue(creator.stato),
    inizio_collaborazione: cleanValue(creator.inizioCollaborazione),
    scadenza_contratto: cleanValue(creator.scadenzaContratto),
    tipo_contratto: cleanValue(creator.tipoContratto),
    proviggioni: cleanValue(creator.proviggioni),
    topic: cleanValue(creator.topic),
    tier: cleanValue(creator.tier),
    cellulare: cleanValue(creator.cellulare),
    email: cleanValue(creator.email),
    note: cleanValue(creator.note),
    mediakit: cleanValue(creator.mediakit),
    ultimo_aggiornamento_mediakit: cleanValue(creator.ultimoAggiornamentoMediakit),
    strategia: cleanValue(creator.strategia),
    collaborazioni_lunghe: cleanValue(creator.collaborazioniLunghe),
    fiere_eventi: cleanValue(creator.fiereEventi),
    obiettivo: cleanValue(creator.obiettivo),
    insight: cleanValue(creator.insight),
    preferenza_collaborazioni: cleanValue(creator.preferenzaCollaborazioni),
    data_firma_contratto: cleanValue(creator.dataContratto),
    sales: cleanValue(creator.sales),
    categoria_adv: cleanValue(creator.categoriaAdv)
  }
}

// GET: Tutti i creator
export const getAllCreators = async () => {
  try {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    console.error('Error fetching creators:', error)
    return { data: null, error }
  }
}

// GET: Creator singolo per ID
export const getCreatorById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error fetching creator:', error)
    return { data: null, error }
  }
}

// POST: Crea nuovo creator
export const createCreator = async (creatorData) => {
  try {
    const { data, error } = await supabase
      .from('creators')
      .insert([toSnakeCase(creatorData)])
      .select()
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error creating creator:', error)
    return { data: null, error }
  }
}

// PUT: Aggiorna creator esistente
export const updateCreator = async (id, creatorData) => {
  try {
    const { data, error } = await supabase
      .from('creators')
      .update(toSnakeCase(creatorData))
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error updating creator:', error)
    return { data: null, error }
  }
}

// DELETE: Elimina creator
export const deleteCreator = async (id) => {
  try {
    const { error } = await supabase
      .from('creators')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error deleting creator:', error)
    return { error }
  }
}

// SEARCH: Cerca creator per nome
export const searchCreators = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .or(`nome.ilike.%${searchTerm}%,nome_completo.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    console.error('Error searching creators:', error)
    return { data: null, error }
  }
}
