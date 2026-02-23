import { supabase } from '../lib/supabase'

// ── PIATTAFORME MASTER ──────────────────────────────────────
export const getAllPiattaforme = async () => {
  try {
    const { data, error } = await supabase
      .from('piattaforme')
      .select('*')
      .eq('attiva', true)
      .order('ordine')
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const createPiattaforma = async (nome) => {
  try {
    const { data, error } = await supabase
      .from('piattaforme')
      .insert([{ nome, ordine: 99 }])
      .select()
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const togglePiattaforma = async (id, attiva) => {
  try {
    const { data, error } = await supabase
      .from('piattaforme')
      .update({ attiva })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// ── CREATOR PIATTAFORME ─────────────────────────────────────
export const getPiattaformeByCreator = async (creatorId) => {
  try {
    const { data, error } = await supabase
      .from('creator_piattaforme')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at')
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const upsertCreatorPiattaforma = async (creatorId, piattaformaNome, tier, fees, note) => {
  try {
    const { data, error } = await supabase
      .from('creator_piattaforme')
      .upsert({
        creator_id: creatorId,
        piattaforma_nome: piattaformaNome,
        tier: tier || null,
        fees: fees || {},
        note: note || null,
      }, { onConflict: 'creator_id,piattaforma_nome' })
      .select()
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const deleteCreatorPiattaforma = async (id) => {
  try {
    const { error } = await supabase
      .from('creator_piattaforme')
      .delete()
      .eq('id', id)
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// Salva tutte le piattaforme di un creator (usato nel form)
// Cancella quelle rimosse, upsert quelle presenti
export const saveCreatorPiattaforme = async (creatorId, piattaforme) => {
  try {
    // 1. Elimina tutte le piattaforme esistenti per questo creator
    const { error: deleteError } = await supabase
      .from('creator_piattaforme')
      .delete()
      .eq('creator_id', creatorId)
    if (deleteError) throw deleteError

    // 2. Inserisci le nuove
    if (piattaforme.length > 0) {
      const rows = piattaforme.map(p => ({
        creator_id: creatorId,
        piattaforma_nome: p.nome,
        tier: p.tier || null,
        fees: p.fees || {},
        note: p.note || null,
      }))
      const { error: insertError } = await supabase
        .from('creator_piattaforme')
        .insert(rows)
      if (insertError) throw insertError
    }

    return { error: null }
  } catch (error) {
    return { error }
  }
}
