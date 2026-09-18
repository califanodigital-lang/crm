import test from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync, createVerify } from 'node:crypto'

import {
  QUERY,
  controllaAmbiente,
  tokenGoogle,
  aggiornaFileDrive,
} from './export-coda-outreach.mjs'

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })

const CREDENZIALI = {
  client_email: 'esportazione@progetto.iam.gserviceaccount.com',
  private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }),
  token_uri: 'https://oauth2.googleapis.com/token',
}

function conFetchFinto(risposte, corpo) {
  const originale = globalThis.fetch
  const chiamate = []
  globalThis.fetch = async (url, opzioni = {}) => {
    chiamate.push({ url: String(url), opzioni })
    const risposta = risposte.shift()
    if (!risposta) throw new Error('chiamata fetch non prevista')
    return {
      ok: risposta.ok ?? true,
      status: risposta.status ?? 200,
      json: async () => risposta.body ?? {},
    }
  }
  return corpo(chiamate).finally(() => { globalThis.fetch = originale })
}

test('la query non calcola ritardo o punteggio e usa solo la vista', () => {
  assert.match(QUERY, /from public\.coda_outreach/)
  assert.doesNotMatch(QUERY, /ritardo|punteggio/i)
  assert.doesNotMatch(QUERY, /insert|update|delete/i)
})

test('controllaAmbiente elenca tutte le variabili mancanti', () => {
  const salvate = { ...process.env }
  delete process.env.SUPABASE_DB_URL
  delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  process.env.DRIVE_FILE_ID = 'abc'
  assert.throws(() => controllaAmbiente(), /SUPABASE_DB_URL, GOOGLE_SERVICE_ACCOUNT_JSON/)
  process.env = salvate
})

test('il JWT per Google e firmato con la chiave privata e scade entro un ora', async () => {
  await conFetchFinto([{ body: { access_token: 'token-finto' } }], async (chiamate) => {
    const token = await tokenGoogle(CREDENZIALI, 'https://www.googleapis.com/auth/drive')
    assert.equal(token, 'token-finto')

    const inviato = new URLSearchParams(chiamate[0].opzioni.body).get('assertion')
    const [intestazione, corpo, firma] = inviato.split('.')

    const verifica = createVerify('RSA-SHA256')
    verifica.update(`${intestazione}.${corpo}`)
    assert.ok(verifica.verify(publicKey, Buffer.from(firma, 'base64url')), 'firma non valida')

    const payload = JSON.parse(Buffer.from(corpo, 'base64url').toString())
    assert.equal(payload.iss, CREDENZIALI.client_email)
    assert.equal(payload.scope, 'https://www.googleapis.com/auth/drive')
    assert.ok(payload.exp - payload.iat <= 3600)
  })
})

test('un errore di Google viene riportato con il messaggio ricevuto', async () => {
  await conFetchFinto(
    [{ ok: false, status: 401, body: { error_description: 'Invalid JWT Signature.' } }],
    async () => {
      await assert.rejects(
        () => tokenGoogle(CREDENZIALI, 'scope'),
        /401.*Invalid JWT Signature/,
      )
    },
  )
})

test('aggiornaFileDrive fa PATCH sul file esistente, non ne crea uno nuovo', async () => {
  await conFetchFinto([{ body: { id: 'file-1', name: 'coda-outreach.json', size: '12' } }], async (chiamate) => {
    const esito = await aggiornaFileDrive('file-1', '{"coda":[]}', 'token-finto')
    assert.equal(esito.name, 'coda-outreach.json')

    const { url, opzioni } = chiamate[0]
    assert.equal(opzioni.method, 'PATCH')
    assert.match(url, /\/upload\/drive\/v3\/files\/file-1\?/)
    assert.match(url, /uploadType=media/)
    assert.equal(opzioni.headers.authorization, 'Bearer token-finto')
    assert.match(opzioni.headers['content-type'], /application\/json/)
  })
})

test('un rifiuto di Drive arriva con il messaggio di Google', async () => {
  await conFetchFinto(
    [{ ok: false, status: 403, body: { error: { message: 'The user does not have sufficient permissions.' } } }],
    async () => {
      await assert.rejects(
        () => aggiornaFileDrive('file-1', '{}', 'token'),
        /sufficient permissions/,
      )
    },
  )
})
