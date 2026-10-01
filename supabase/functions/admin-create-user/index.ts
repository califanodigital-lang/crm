import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.94.1'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, 'Content-Type': 'application/json' },
})

serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ success: false, error: 'Metodo non consentito' }, 405)
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return json({ success: false, error: 'Configurazione Supabase mancante' }, 500)
  try {
    const token = req.headers.get('Authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1]
    if (!token) return json({ success: false, error: 'Utente non autenticato' }, 401)
    const admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
    const [{ data: identity, error: identityError }, { data: jwt, error: jwtError }] = await Promise.all([
      admin.auth.getUser(token), admin.auth.getClaims(token),
    ])
    if (identityError || jwtError || !identity.user || !jwt?.claims || jwt.claims.sub !== identity.user.id) {
      return json({ success: false, error: 'Sessione non valida o scaduta' }, 401)
    }
    if (identity.user.factors?.some(f => f.status === 'verified') && jwt.claims.aal !== 'aal2') {
      return json({ success: false, error: 'Completa la verifica a due fattori' }, 403)
    }
    const { data: profile, error: profileError } = await admin.from('user_profiles')
      .select('role, attivo').eq('id', identity.user.id).single()
    if (profileError || profile?.role !== 'ADMIN' || profile.attivo !== true) {
      return json({ success: false, error: 'Solo gli amministratori attivi possono creare utenti' }, 403)
    }
    let body: Record<string, unknown>
    try {
      const parsed = await req.json()
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
      body = parsed
    } catch { return json({ success: false, error: 'JSON non valido' }, 400) }
    const email = String(body.email || '').trim()
    const password = String(body.password || '')
    const nome = String(body.nomeCompleto || '').trim()
    const agente = String(body.agenteNome || '').trim()
    const role = body.role ?? 'AGENT'
    const fisso = Number(body.fissoMensile ?? 0)
    if (!email || !password || !nome || !agente) return json({ success: false, error: 'Compila tutti i campi obbligatori' }, 400)
    if (!['ADMIN','AGENT'].includes(String(role))) return json({ success: false, error: 'Ruolo non valido' }, 400)
    if (!Number.isFinite(fisso) || fisso < 0) return json({ success: false, error: 'Fisso mensile non valido' }, 400)
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { nome_completo: nome, agente_nome: agente, role },
    })
    if (createError || !created.user) return json({ success: false, error: createError?.message || 'Errore creazione utente' }, 400)
    const { error } = await admin.from('user_profiles').upsert({
      id: created.user.id, email, nome_completo: nome, agente_nome: agente,
      role, attivo: true, fisso_mensile: fisso, updated_at: new Date().toISOString(),
    })
    if (error) {
      const { error: rollback } = await admin.auth.admin.deleteUser(created.user.id)
      if (rollback) {
        console.error('Rollback fallito', created.user.id, rollback.message)
        return json({ success: false, error: 'Profilo non creato: verificare gli utenti Supabase' }, 500)
      }
      return json({ success: false, error: error.message }, 400)
    }
    return json({ success: true, userId: created.user.id })
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Errore imprevisto')
    return json({ success: false, error: 'Errore interno durante la creazione utente' }, 500)
  }
})
