import { supabase } from '../lib/supabase'

const cleanValue = (value) => {
  if (value === '' || value === undefined) return null
  return value
}

const toCamelCase = (brand) => {
  if (!brand) return null
  return {
    id: brand.id,
    nome: brand.nome,
    settore: brand.settore,
    target: brand.target_dem,
    topicTarget: brand.topic_target,
    dataContatto: brand.data_contatto,
    dataFollowup1: brand.data_followup_1,   // B.1
    dataFollowup2: brand.data_followup_2,   // B.1
    categoria: brand.categoria,
    categorie: brand.categorie || [],
    referente: brand.referenti,
    contatto: brand.contatto,
    telefono: brand.telefono,
    sitoWeb: brand.sito_web,
    note: brand.note,
    categoriaAdv: brand.categoria_adv,
    creatorSuggeriti: brand.creator_suggeriti || [],
    priorita: brand.priorita || 'NORMALE',
    createdAt: brand.created_at,
    updatedAt: brand.updated_at,
    propostaId: brand.proposta_id,
    ultimoEsito: brand.ultimo_esito,
    dataUltimaCollaborazione: brand.data_ultima_collaborazione,
  }
}

const toSnakeCase = (brand) => {
  return {
    nome: brand.nome,
    settore: cleanValue(brand.settore),
    target_dem: cleanValue(brand.target),
    topic_target: cleanValue(brand.topicTarget),
    categoria: brand.categoria,
    categorie: brand.categorie || [],
    referenti: cleanValue(brand.referente),
    contatto: cleanValue(brand.contatto),
    telefono: cleanValue(brand.telefono),
    sito_web: cleanValue(brand.sitoWeb),
    note: cleanValue(brand.note),
    categoria_adv: cleanValue(brand.categoriaAdv),
    creator_suggeriti: brand.creatorSuggeriti || [],
    priorita: brand.priorita || 'NORMALE',
    proposta_id: cleanValue(brand.propostaId),
    ultimo_esito: cleanValue(brand.ultimoEsito),
    data_ultima_collaborazione: cleanValue(brand.dataUltimaCollaborazione)
  }
}

export const getAllBrands = async () => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('nome', { ascending: true })

    if (error) throw error
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    console.error('Error fetching brands:', error)
    return { data: null, error }
  }
}

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

export const searchBrands = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .or(`nome.ilike.%${searchTerm}%,settore.ilike.%${searchTerm}%`)
      .order('nome', { ascending: true })

    if (error) throw error
    return { data: data.map(toCamelCase), error: null }
  } catch (error) {
    console.error('Error searching brands:', error)
    return { data: null, error }
  }
}
