import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'

// Execute the actual Edge Function handler with mocked Supabase and Google APIs.
// No credentials or remote systems are used.
const source = await readFile(new URL('../supabase/functions/drive-attachments/index.ts', import.meta.url), 'utf8')
let handler
const entityId = '00000000-0000-0000-0000-000000000002'
let state
const reset = () => {
  state = { authenticated: true, active: true, mfa: false, aal: 'aal1', saved: true,
    dbFailure: false, tokenFailure: false, calls: [], inserted: null, removed: false,
    env: { SUPABASE_URL: 'https://example.test', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service',
      GOOGLE_DRIVE_CLIENT_ID: 'client', GOOGLE_DRIVE_CLIENT_SECRET: 'secret', GOOGLE_DRIVE_REFRESH_TOKEN: 'refresh', GOOGLE_DRIVE_FOLDER_ID: 'folder' } }
}
const client = {
  auth: {
    getUser: async token => {
      assert.equal(token, 'test-session')
      return { data: { user: state.authenticated ? { id: 'user', factors: state.mfa ? [{ status: 'verified' }] : [] } : null } }
    },
    getClaims: async token => {
      assert.equal(token, 'test-session')
      return { data: { claims: { sub: 'user', aal: state.aal } } }
    },
  },
  from(table) {
    const query = {
      select() { return this }, eq() { return this },
      insert(data) { state.inserted = data; return this },
      delete() { state.removed = true; return this },
      single: async () => table === 'user_profiles' ? { data: { role: 'AGENT', attivo: state.active } }
        : state.dbFailure ? { error: { message: 'db failure' } } : { data: { id: 'attachment', name: 'proposal.pdf', size: 12 } },
      maybeSingle: async () => table === 'drive_attachments'
        ? { data: { id: 'attachment', entity_type: 'fiere_db', entity_id: entityId, note_id: 'note', drive_file_id: 'drive-id', name: 'proposal.pdf' } }
        : { data: { note_log: state.saved ? [{ id: 'note' }] : [] } },
      then(resolve) { return Promise.resolve({ error: null }).then(resolve) },
    }
    return query
  },
}
globalThis.__driveTest = {
  serve: fn => { handler = fn }, createClient: () => client,
  Deno: { env: { get: name => state.env[name] } },
  fetch: async (url, options) => {
    state.calls.push({ url, options })
    if (url.includes('oauth2.googleapis.com')) return new Response(JSON.stringify(state.tokenFailure ? {} : { access_token: 'token' }), { status: state.tokenFailure ? 400 : 200 })
    if (url.includes('uploadType=resumable')) return new Response('{}', { headers: { Location: 'https://www.googleapis.com/upload/session' } })
    if (url.endsWith('/upload/session')) return new Response(JSON.stringify({ id: 'drive-id' }))
    if (url.includes('alt=media')) return new Response('%PDF-test')
    return new Response('{}')
  },
}
const executable = stripTypeScriptTypes(source.replace(/^import .*\n/gm, ''), { mode: 'transform' })
await import(`data:text/javascript;base64,${Buffer.from('const {serve,createClient,Deno,fetch}=globalThis.__driveTest;\n' + executable).toString('base64')}`)
function upload(content = '%PDF-test', name = 'proposal.pdf') {
  const form = new FormData()
  form.set('file', new File([content], name))
  form.set('entityType', 'fiere_db'); form.set('entityId', entityId); form.set('noteId', 'note')
  return new Request('https://function.test', { method: 'POST', headers: { Authorization: 'Bearer test-session' }, body: form })
}
const action = type => new Request('https://function.test', { method: 'POST', headers: { Authorization: 'Bearer test-session', 'Content-Type': 'application/json' }, body: JSON.stringify({ action: type, id: 'attachment' }) })
reset()
assert.equal((await handler(new Request('https://function.test', { method: 'POST' }))).status, 401)
reset(); state.authenticated = false
assert.equal((await handler(upload())).status, 401)
assert.equal(state.calls.length, 0)
reset(); state.active = false
assert.equal((await handler(upload())).status, 403)
reset(); state.mfa = true
assert.equal((await handler(upload())).status, 403)
reset()
assert.equal((await handler(upload('fake'))).status, 400)
assert.equal((await handler(upload('%PDF-test', 'test.exe'))).status, 400)
assert.equal((await handler(upload('%PDF-' + 'x'.repeat(10 * 1024 * 1024)))).status, 400)
assert.equal(state.calls.length, 0)
reset(); state.saved = false
assert.equal((await handler(upload())).status, 409)
reset(); delete state.env.GOOGLE_DRIVE_CLIENT_SECRET
assert.equal((await handler(upload())).status, 503)
reset(); state.tokenFailure = true
assert.equal((await handler(upload())).status, 503)
reset(); state.mfa = true; state.aal = 'aal2'
assert.equal((await handler(upload())).status, 200)
assert.equal(state.inserted.drive_file_id, 'drive-id')
assert.equal(state.inserted.created_by, 'user')
const metadata = JSON.parse(state.calls.find(call => call.url.includes('uploadType')).options.body)
assert.deepEqual(metadata.parents, ['folder'])
reset(); state.dbFailure = true
assert.equal((await handler(upload())).status, 500)
assert.equal(JSON.parse(state.calls.at(-1).options.body).trashed, true)
reset()
const downloaded = await handler(action('download'))
assert.equal(downloaded.status, 200)
assert.equal(await downloaded.text(), '%PDF-test')
assert.equal(downloaded.headers.get('Cache-Control'), 'no-store')
reset()
assert.equal((await handler(action('delete'))).status, 200)
assert.equal(state.removed, true)
assert.equal(JSON.parse(state.calls.at(-1).options.body).trashed, true)
console.log('Drive attachments: auth, MFA, PDF validation, configuration, upload, rollback, download and delete passed.')
delete globalThis.__driveTest
