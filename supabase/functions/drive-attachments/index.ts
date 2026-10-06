import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.94.1'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, 'Content-Type': 'application/json' },
})
class Failure extends Error {
  constructor(message: string, public status = 400) { super(message) }
}
const required = (name: string) => {
  const value = Deno.env.get(name)
  if (!value) throw new Failure('Collegamento Google Drive non ancora configurato. Contatta l’amministratore.', 503)
  return value
}
async function googleToken() {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: required('GOOGLE_DRIVE_CLIENT_ID'),
      client_secret: required('GOOGLE_DRIVE_CLIENT_SECRET'),
      refresh_token: required('GOOGLE_DRIVE_REFRESH_TOKEN'),
      grant_type: 'refresh_token',
    }),
  })
  const data = await response.json()
  if (!response.ok || !data.access_token) throw new Failure('Autorizzazione Drive scaduta o revocata. Chiedi all’amministratore di ricollegare l’account.', 503)
  return data.access_token as string
}
async function driveFetch(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${path}`, {
    ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Failure(response.status === 404 ? 'PDF non più disponibile su Drive.' : 'Operazione Drive non riuscita. Verifica permessi e spazio disponibile.', 502)
  return response
}

serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Metodo non consentito' }, 405)
  try {
    const url = required('SUPABASE_URL')
    const auth = req.headers.get('Authorization') || ''
    const sessionToken = auth.match(/^Bearer\s+(\S+)$/i)?.[1]
    if (!sessionToken) throw new Failure('Utente non autenticato.', 401)
    const userClient = createClient(url, required('SUPABASE_ANON_KEY'), {
      global: { headers: { Authorization: auth } }, auth: { persistSession: false },
    })
    const { data: identity, error: identityError } = await userClient.auth.getUser(sessionToken)
    if (identityError || !identity.user) throw new Failure('Sessione scaduta. Accedi nuovamente.', 401)
    const admin = createClient(url, required('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } })
    const [{ data: jwt, error: jwtError }, { data: profile, error: profileError }] = await Promise.all([
      userClient.auth.getClaims(sessionToken),
      admin.from('user_profiles').select('role, attivo').eq('id', identity.user.id).single(),
    ])
    if (jwtError || jwt?.claims?.sub !== identity.user.id || profileError || profile?.attivo !== true || !['ADMIN', 'AGENT'].includes(profile.role)) {
      throw new Failure('Accesso non autorizzato.', 403)
    }
    if (identity.user.factors?.some(factor => factor.status === 'verified') && jwt?.claims?.aal !== 'aal2') {
      throw new Failure('Completa la verifica a due fattori.', 403)
    }
    const upload = (req.headers.get('Content-Type') || '').startsWith('multipart/form-data')
    if (Number(req.headers.get('Content-Length') || 0) > 11 * 1024 * 1024) throw new Failure('Il PDF supera il limite di 10 MB.')
    let entityType: string, entityId: string, noteId: string
    let attachment: { id: string; entity_type: string; entity_id: string; note_id: string; drive_file_id: string; name: string } | null = null
    let file: File | null = null
    let action = 'upload'
    if (upload) {
      const form = await req.formData()
      const entry = form.get('file')
      if (!(entry instanceof File)) throw new Failure('Seleziona un PDF.')
      file = entry
      entityType = String(form.get('entityType') || '')
      entityId = String(form.get('entityId') || '')
      noteId = String(form.get('noteId') || '')
      if (!/\.pdf$/i.test(file.name) || !file.size || file.size > 10 * 1024 * 1024 || await file.slice(0, 5).text() !== '%PDF-') {
        throw new Failure('Seleziona un PDF valido di massimo 10 MB.')
      }
    } else {
      const body = await req.json()
      action = body.action
      if (!['download', 'delete'].includes(action) || typeof body.id !== 'string') throw new Failure('Richiesta non valida.')
      const { data, error } = await userClient.from('drive_attachments').select('*').eq('id', body.id).maybeSingle()
      if (error || !data) throw new Failure('Allegato non disponibile.', 404)
      attachment = data
      entityType = data.entity_type; entityId = data.entity_id; noteId = data.note_id
    }
    if (!['fiere_db', 'trattative_fiere'].includes(entityType) || !/^[0-9a-f-]{36}$/i.test(entityId) || !noteId || noteId.length > 2000) {
      throw new Failure('Riferimento alla nota non valido.')
    }
    const { data: entity, error: entityError } = await userClient.from(entityType).select('note_log').eq('id', entityId).maybeSingle()
    if (entityError || !entity) throw new Failure('Scheda non disponibile.', 404)
    const exists = (entity.note_log || []).some((note: Record<string, unknown>) =>
      !note._deleted && (note.id || `legacy-${note.timestamp || ''}-${note.topic || ''}-${note.contenuto || ''}`) === noteId)
    // Deletion remains available for cleanup of files whose note has been removed.
    if (!exists && action !== 'delete') throw new Failure('Salva la scheda e la nota prima di gestire gli allegati.', 409)
    const token = await googleToken()
    if (action === 'download' && attachment) {
      const response = await driveFetch(`${encodeURIComponent(attachment.drive_file_id)}?alt=media`, token)
      return new Response(response.body, { headers: { ...cors, 'Content-Type': 'application/pdf', 'Cache-Control': 'no-store' } })
    }
    if (action === 'delete' && attachment) {
      await driveFetch(`${encodeURIComponent(attachment.drive_file_id)}?supportsAllDrives=true`, token, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trashed: true }),
      })
      const { error } = await admin.from('drive_attachments').delete().eq('id', attachment.id)
      if (error) throw new Failure('PDF nel cestino; rimozione dal CRM non riuscita. Riprova.', 500)
      return json({ success: true })
    }
    if (!file) throw new Failure('PDF mancante.')
    const folder = required('GOOGLE_DRIVE_FOLDER_ID')
    const name = file.name.replace(/[\x00-\x1f/\\]/g, '_').slice(0, 200)
    const start = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id', {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Upload-Content-Type': 'application/pdf' },
      body: JSON.stringify({ name, parents: [folder], appProperties: { entityType, entityId } }),
    })
    const location = start.headers.get('Location')
    if (!start.ok || !location || new URL(location).origin !== 'https://www.googleapis.com') throw new Failure('Cartella Drive non accessibile. Verifica il collegamento.', 502)
    const uploaded = await fetch(location, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/pdf' }, body: file })
    if (!uploaded.ok) throw new Failure('Caricamento Drive non riuscito. Riprova.', 502)
    const driveFile = await uploaded.json()
    if (!driveFile.id) throw new Failure('Drive non ha restituito il riferimento del PDF.', 502)
    const { data, error } = await admin.from('drive_attachments').insert({
      entity_type: entityType, entity_id: entityId, note_id: noteId, drive_file_id: driveFile.id,
      name, size: file.size, created_by: identity.user.id,
    }).select('id, name, size, created_at').single()
    if (error) {
      try { await driveFetch(`${encodeURIComponent(driveFile.id)}?supportsAllDrives=true`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trashed: true }) }) }
      catch { console.error('Drive upload rollback failed for file', driveFile.id) }
      throw new Failure('Allegato non registrato nel CRM. Verifica la migrazione e riprova.', 500)
    }
    return json(data)
  } catch (error) {
    return json({ error: error instanceof Failure ? error.message : 'Operazione allegati non riuscita. Riprova.' }, error instanceof Failure ? error.status : 500)
  }
})
