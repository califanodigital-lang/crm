#!/usr/bin/env node
/**
 * Esporta la vista public.coda_outreach del CRM in un file JSON su Google Drive.
 *
 * Gira ogni mattina da GitHub Actions. Non scrive mai nel database:
 * usa un ruolo Postgres che ha il solo permesso di leggere quella vista.
 *
 * Variabili d'ambiente (tutte obbligatorie, tutte da GitHub Secrets):
 *   SUPABASE_DB_URL              stringa di connessione del ruolo di sola lettura
 *                                (usare il "Session pooler", non la connessione diretta)
 *   GOOGLE_SERVICE_ACCOUNT_JSON  chiave JSON dell'account di servizio Google
 *   DRIVE_FILE_ID                id del file coda-outreach.json gia' presente su Drive
 *
 * Variabile facoltativa:
 *   SUPABASE_CA_CERT             certificato della CA di Supabase in formato PEM.
 *                                Se c'e', l'identita' del server viene verificata;
 *                                se manca, il traffico resta cifrato ma il certificato
 *                                non viene controllato (e' il comportamento abituale
 *                                con il pooler di Supabase).
 *
 * Il file su Drive deve esistere gia' ed essere condiviso con l'account di
 * servizio come Editor: lo script lo aggiorna, non ne crea di nuovi. E' voluto —
 * un account di servizio non ha spazio proprio su Drive e la creazione fallirebbe.
 */

import { createSign } from 'node:crypto'
import { pathToFileURL } from 'node:url'

const OBBLIGATORIE = ['SUPABASE_DB_URL', 'GOOGLE_SERVICE_ACCOUNT_JSON', 'DRIVE_FILE_ID']

export const QUERY = `
  select id,
         cliente,
         brand,
         categoria,
         priorita,
         bundle,
         chi_altro_serve,
         come_si_entra,
         chi_cercare,
         cosa_chiedere,
         vincoli,
         stato,
         data_contatto,
         prossimo_follow_up
  from public.coda_outreach
  order by priorita, prossimo_follow_up nulls last, data_contatto
`

export function controllaAmbiente() {
  const mancanti = OBBLIGATORIE.filter((k) => !process.env[k])
  if (mancanti.length) {
    throw new Error(`Variabili mancanti: ${mancanti.join(', ')}`)
  }
}

export async function leggiCoda() {
  // Import differito: cosi' il file resta caricabile (e verificabile) senza dipendenze.
  const { default: pg } = await import('pg')

  const ca = process.env.SUPABASE_CA_CERT

  const client = new pg.Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
    statement_timeout: 60_000,
    application_name: 'export-coda-outreach',
  })

  await client.connect()
  try {
    const { rows } = await client.query(QUERY)
    return rows
  } finally {
    await client.end()
  }
}

/** Access token per l'account di servizio, firmato in locale: nessuna libreria Google. */
export async function tokenGoogle(credenziali, scope) {
  const adesso = Math.floor(Date.now() / 1000)
  const intestazione = { alg: 'RS256', typ: 'JWT' }
  const corpo = {
    iss: credenziali.client_email,
    scope,
    aud: credenziali.token_uri || 'https://oauth2.googleapis.com/token',
    iat: adesso,
    exp: adesso + 3600,
  }

  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const daFirmare = `${b64(intestazione)}.${b64(corpo)}`
  const firma = createSign('RSA-SHA256')
    .update(daFirmare)
    .sign(credenziali.private_key, 'base64url')

  const risposta = await fetch(corpo.aud, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${daFirmare}.${firma}`,
    }),
  })

  const dati = await risposta.json().catch(() => ({}))
  if (!risposta.ok) {
    throw new Error(`Google non ha rilasciato il token (${risposta.status}): ${dati.error_description || dati.error || 'errore sconosciuto'}`)
  }
  return dati.access_token
}

export async function aggiornaFileDrive(fileId, contenuto, token) {
  const url = new URL(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}`)
  url.searchParams.set('uploadType', 'media')
  url.searchParams.set('supportsAllDrives', 'true')
  url.searchParams.set('fields', 'id,name,modifiedTime,size')

  const risposta = await fetch(url, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json; charset=UTF-8',
    },
    body: contenuto,
  })

  const dati = await risposta.json().catch(() => ({}))
  if (!risposta.ok) {
    const dettaglio = dati?.error?.message || `HTTP ${risposta.status}`
    throw new Error(`Drive ha rifiutato l'aggiornamento: ${dettaglio}`)
  }
  return dati
}

export async function main() {
  controllaAmbiente()

  const righe = await leggiCoda()
  console.log(`Lette ${righe.length} righe dalla vista coda_outreach.`)

  if (righe.length === 0) {
    throw new Error('La vista ha restituito zero righe: esportazione annullata per non svuotare il file su Drive.')
  }

  const documento = {
    generato_il: new Date().toISOString(),
    fonte: 'crm.c3agency.it · vista public.coda_outreach',
    righe: righe.length,
    coda: righe,
  }

  const contenuto = `${JSON.stringify(documento, null, 2)}\n`

  const credenziali = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
  const token = await tokenGoogle(credenziali, 'https://www.googleapis.com/auth/drive')
  const file = await aggiornaFileDrive(process.env.DRIVE_FILE_ID, contenuto, token)

  console.log(`Scritto su Drive: ${file.name || process.env.DRIVE_FILE_ID} · ${file.size || contenuto.length} byte · ${file.modifiedTime || ''}`)
}

const eseguitoDirettamente =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (eseguitoDirettamente) {
  main().catch((errore) => {
    console.error(`Esportazione fallita: ${errore.message}`)
    process.exitCode = 1
  })
}
