import { supabase } from '../lib/supabase'

export const MAX_PDF_SIZE = 10 * 1024 * 1024

export async function validatePdf(file) {
  if (!file || !/\.pdf$/i.test(file.name)) throw new Error('Seleziona un file PDF.')
  if (!file.size || file.size > MAX_PDF_SIZE) throw new Error('Il PDF deve avere dimensione tra 1 byte e 10 MB.')
  if (await file.slice(0, 5).text() !== '%PDF-') throw new Error('Il file selezionato non è un PDF valido.')
}

export async function listAttachments(entityType, entityId, noteId) {
  const { data, error } = await supabase.from('drive_attachments').select('id, name, size, created_at')
    .eq('entity_type', entityType).eq('entity_id', entityId).eq('note_id', noteId).order('created_at')
  if (error) throw new Error('Allegati non disponibili. Verificare la migrazione Supabase.')
  return data
}

async function invoke(body) {
  const { data, error } = await supabase.functions.invoke('drive-attachments', { body })
  if (error) {
    let message = 'Collegamento Drive non disponibile. Verificare la configurazione o riprovare.'
    try { message = (await error.context.json()).error || message } catch { /* Network errors have no response. */ }
    throw new Error(message)
  }
  return data
}

export async function uploadAttachment(file, entityType, entityId, noteId) {
  await validatePdf(file)
  const body = new FormData()
  body.set('file', file)
  body.set('entityType', entityType)
  body.set('entityId', entityId)
  body.set('noteId', noteId)
  return invoke(body)
}

export const deleteAttachment = id => invoke({ action: 'delete', id })

export async function downloadAttachment(attachment) {
  const blob = await invoke({ action: 'download', id: attachment.id })
  if (!(blob instanceof Blob)) throw new Error('Download non riuscito.')
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = attachment.name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
