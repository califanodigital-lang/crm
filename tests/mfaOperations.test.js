import test from 'node:test'
import assert from 'node:assert/strict'
import { createMfaOperations } from '../src/services/mfaOperations.js'

const verified = { id: 'verified', factor_type: 'totp', status: 'verified' }
const api = (level = 'aal1', factors = []) => ({
  getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: level }, error: null }),
  listFactors: async () => ({ data: { all: factors }, error: null }),
})

test('account senza fattore o con configurazione non confermata: login normale', async () => {
  for (const factors of [[], [{ ...verified, status: 'unverified' }]]) {
    const status = await createMfaOperations(api('aal1', factors)).getMfaStatus()
    assert.equal(status.required, false)
    assert.deepEqual(status.factors, [])
  }
})

test('fattore verificato: password insufficiente, aal2 autorizzato', async () => {
  assert.equal((await createMfaOperations(api('aal1', [verified])).getMfaStatus()).required, true)
  assert.equal((await createMfaOperations(api('aal2', [verified])).getMfaStatus()).required, false)
})

test('fattore telefonico verificato non consente di saltare MFA', async () => {
  const status = await createMfaOperations(api('aal1', [{ ...verified, factor_type: 'phone' }])).getMfaStatus()
  assert.equal(status.required, true)
  assert.deepEqual(status.factors, [])
})

test('errore di rete o sessione assente: nessuna autorizzazione implicita', async () => {
  const failed = api()
  failed.listFactors = async () => ({ error: new Error('Offline') })
  await assert.rejects(createMfaOperations(failed).getMfaStatus(), /Offline/)
  await assert.rejects(createMfaOperations(api(null)).getMfaStatus(), /Sessione non valida/)
})

test('codice invalido rifiutato e codice errato non ignorato', async () => {
  let calls = 0
  const operations = createMfaOperations({
    challengeAndVerify: async ({ factorId, code }) => {
      calls++
      assert.equal(factorId, 'verified')
      assert.equal(code, '012345')
      return { error: new Error('Invalid code') }
    },
  })
  await assert.rejects(operations.verifyMfaCode('verified', '123'), /6 cifre/)
  assert.equal(calls, 0)
  await assert.rejects(operations.verifyMfaCode('verified', '012345'), /Invalid code/)
  assert.equal(calls, 1)
})

test('una nuova configurazione non rimuove fattori attivi o di altre app', async () => {
  const removed = []
  const mock = api('aal2', [verified,
    { ...verified, id: 'abandoned', status: 'unverified', friendly_name: 'C3 CRM' },
    { ...verified, id: 'other-app', status: 'unverified', friendly_name: 'Other' },
  ])
  mock.unenroll = async ({ factorId }) => { removed.push(factorId); return { error: null } }
  mock.enroll = async args => {
    assert.deepEqual(args, { factorType: 'totp', friendlyName: 'C3 CRM', issuer: 'C3 Agency' })
    return { data: { id: 'new', totp: { secret: 'test-only' } }, error: null }
  }
  assert.equal((await createMfaOperations(mock).enrollMfa()).id, 'new')
  assert.deepEqual(removed, ['abandoned'])
})

test('errore nella rimozione di un fattore viene propagato', async () => {
  await assert.rejects(createMfaOperations({ unenroll: async () => ({ error: new Error('Denied') }) }).removeMfaFactor('verified'), /Denied/)
})
