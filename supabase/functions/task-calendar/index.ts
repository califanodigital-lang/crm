import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.94.1'
import { syncTaskCalendarJob } from './sync.js'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const required = (name: string) => {
  const value = Deno.env.get(name)
  if (!value) throw new Error('Google Calendar non configurato. Contatta l’amministratore.')
  return value
}
async function secretMatches(actual: string, expected: string) {
  const digest = async (text: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))
  const [a, b] = await Promise.all([digest(actual), digest(expected)])
  return a.reduce((difference, byte, index) => difference | (byte ^ b[index]), 0) === 0
}
async function googleToken() {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', signal: AbortSignal.timeout(10000),
    body: new URLSearchParams({ client_id: required('GOOGLE_CALENDAR_CLIENT_ID'), client_secret: required('GOOGLE_CALENDAR_CLIENT_SECRET'), refresh_token: required('GOOGLE_CALENDAR_REFRESH_TOKEN'), grant_type: 'refresh_token' }),
  })
  const data = await response.json()
  if (!response.ok || !data.access_token) throw new Error('Autorizzazione Google Calendar scaduta o revocata.')
  return data.access_token as string
}

type Job = { task_id: string; version: number; claim_token: string; event_id: string | null; calendar_id: string | null; payload: { deleted?: boolean; dueDate?: string; [key: string]: unknown } }


serve(async req => {
  if (req.method !== 'POST') return json({ error: 'Metodo non consentito.' }, 405)
  try {
    if (!await secretMatches(req.headers.get('x-task-calendar-secret') || '', required('TASK_CALENDAR_WORKER_SECRET'))) return json({ error: 'Accesso non autorizzato.' }, 401)
    const calendarId = required('GOOGLE_CALENDAR_ID')
    const appUrl = required('CRM_APP_URL')
    if (new URL(appUrl).protocol !== 'https:') throw new Error('CRM_APP_URL deve usare HTTPS.')
    const admin = createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } })
    const started = Date.now()
    let token: string | null = null
    let processed = 0
    let failed = 0
    while (processed + failed < 5 && Date.now() - started < 40000) {
      const { data, error } = await admin.rpc('crm_claim_task_calendar', { target_calendar: calendarId })
      if (error) throw new Error('Coda Google Calendar non disponibile. Verifica la migrazione server.')
      const job = data?.[0] as Job | undefined
      if (!job) break
      let outcome: { removed: boolean; url: string | null } | null = null
      let failure: string | null = null
      try {
        if (!job.payload.deleted && job.payload.dueDate) {
          const ids = job.payload.assigneeIds
          if (!Array.isArray(ids) || !ids.length) throw new Error('Assegnatari Calendar mancanti. Modifica la task per aggiornare la coda.')
          const { data: recipients, error: recipientError } = await admin.from('user_profiles')
            .select('email, nome_completo, agente_nome').in('id', ids).eq('attivo', true).in('role', ['ADMIN', 'AGENT'])
          if (recipientError) throw new Error('Impossibile leggere i destinatari Calendar.')
          job.payload.attendees = (recipients || []).map(person => ({ email: person.email, displayName: person.nome_completo || person.agente_nome || person.email }))
        }
        token ||= await googleToken()
        outcome = await syncTaskCalendarJob(job, token, appUrl)
      } catch (error) {
        failure = error instanceof Error && error.name !== 'TimeoutError' ? error.message : 'Google Calendar non raggiungibile. Il sistema riprovera automaticamente.'
      }
      const { error: finishError } = await admin.rpc('crm_finish_task_calendar', {
        target_task: job.task_id, claimed_version: job.version, token: job.claim_token,
        succeeded: !!outcome, removed: outcome?.removed || false,
        failure_message: failure, google_event_url: outcome?.url || null,
      })
      if (finishError) throw new Error('Esito Calendar non registrato. La coda riprovera automaticamente.')
      if (outcome) processed++; else failed++
    }
    return json({ processed, failed })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Sincronizzazione Calendar non disponibile.' }, 503)
  }
})
