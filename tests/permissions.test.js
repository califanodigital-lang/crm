import test from 'node:test'
import assert from 'node:assert/strict'
import { canUseCrm, canAccessAdministration } from '../src/utils/permissions.js'

test('Admin dispone di accesso operativo e amministrativo', () => {
  assert.equal(canUseCrm({ role: 'ADMIN' }), true)
  assert.equal(canAccessAdministration({ role: 'ADMIN' }), true)
})

test('Agent dispone di tutto l\'operativo senza accesso amministrativo', () => {
  assert.equal(canUseCrm({ role: 'AGENT' }), true)
  assert.equal(canAccessAdministration({ role: 'AGENT' }), false)
})

test('proprietario, nome agente e assegnazione non cambiano i permessi', () => {
  for (const profile of [{ role: 'AGENT' }, { role: 'AGENT', agenteNome: 'Altro operatore', assegnatario: [] }]) {
    assert.equal(canUseCrm(profile), true)
    assert.equal(canAccessAdministration(profile), false)
  }
})

test('profili mancanti e ruoli sconosciuti non ricevono privilegi', () => {
  for (const profile of [null, undefined, {}, { role: 'OTHER' }, { role: 'admin' }]) {
    assert.equal(canUseCrm(profile), false)
    assert.equal(canAccessAdministration(profile), false)
  }
})
