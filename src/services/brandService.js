import { supabase } from '../lib/supabase'

// Utility per convertire valori vuoti in null
const cleanValue = (value) => {
  if (value === '' || value === undefined) return null
  return value
}

// Utility per convertire da snake_case (DB) a camelCase (Frontend)
const toCamelCase = (brand) => {
  if (!brand) return null
  return {
    id: brand.id,
    nome: brand.nome,
    settore: brand.settore,
    target: brand.target_dem,
    topicTarget: brand.topic_target,
    dataContatto: brand.data_contatto,
    categoria: brand.categoria,
    risposta: brand.risposta,
    contattatoPer: brand.contattato_per,
    referente: brand.referenti,
    email: brand.email,
    telefono: brand.telefono,
    agente: brand.agente,
    sitoWeb: brand.sito_web,
    note: brand.note,
    categoriaAdv: brand.categoria_adv,
    creatorSuggeriti: brand.creator_suggeriti,
    priorita: brand.priorita || 'NORMALE',
    stato: brand.stato || 'DA_CONTATTARE',
    createdAt: brand.created_at,
    updatedAt: brand.updated_at,
  }
}

// Utility per convertire da camelCase (Frontend) a snake_case (DB)
const toSnakeCase = (brand) => {
  return {
    nome: brand.nome,
    settore: cleanValue(brand.settore),
    target_dem: cleanValue(brand.target),
    topic_target: cleanValue(brand.topicTarget),
    data_contatto: cleanValue(brand.dataContatto),
    categoria: cleanValue(brand.categoria),
    risposta: cleanValue(brand.risposta),
    contattato_per: cleanValue(brand.contattatoPer),
    referenti: cleanValue(brand.referente),
    email: cleanValue(brand.email),
    telefono: cleanValue(brand.telefono),
    agente: cleanValue(brand.agente),
    sito_web: cleanValue(brand.sitoWeb),
    note: cleanValue(brand.note),
    categoria_adv: cleanValue(brand.categoriaAdv),
    creator_suggeriti: cleanValue(brand.creatorSuggeriti),
    priorita: brand.priorita || 'NORMALE',
    stato: brand.stato || 'DA_CONTATTARE',
  }
}

// GET: Tutti i brand
export const getAllBrands = async () => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    console.error('Error fetching brands:', error)
    return { data: null, error }
  }
}

// GET: Brand singolo per ID
export const getBrandById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error fetching brand:', error)
    return { data: null, error }
  }
}

// POST: Crea nuovo brand
export const createBrand = async (brandData) => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .insert([toSnakeCase(brandData)])
      .select()
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error creating brand:', error)
    return { data: null, error }
  }
}

// PUT: Aggiorna brand esistente
export const updateBrand = async (id, brandData) => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .update(toSnakeCase(brandData))
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data: toCamelCase(data), error: null }
  } catch (error) {
    console.error('Error updating brand:', error)
    return { data: null, error }
  }
}

// DELETE: Elimina brand
export const deleteBrand = async (id) => {
  try {
    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error deleting brand:', error)
    return { error }
  }
}

// SEARCH: Cerca brand per nome o settore
export const searchBrands = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .or(`nome.ilike.%${searchTerm}%,settore.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    console.error('Error searching brands:', error)
    return { data: null, error }
  }
}
