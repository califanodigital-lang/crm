import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { inheritCircuitContacts as inherit, normalizeExtraContacts as normalize, mergeExtraContacts as merge } from '../src/utils/circuitContacts.js'

const extra = { referente: 'Giulia', contatto: 'g@example.test', telefono: '123' }
const a = { id: 'a', referente: 'Luca', contatto: 'a@example.test', telefono: '111', contattiAggiuntivi: [extra] }
const b = { id: 'b', referente: 'Marco', contatto: 'b@example.test', telefono: '222', contattiAggiuntivi: [{ referente: 'Anna' }] }
const blank = { nome: 'Fiera', referente: '', contatto: '', telefono: '', contattiAggiuntivi: [] }
const filled = inherit(blank, a)
assert.equal(filled.referente, 'Luca')
assert.equal(filled.contatto, 'a@example.test')
assert.deepEqual(filled.contattiAggiuntivi, [extra])
assert.equal(blank.referente, '')
assert.equal(a.contattiAggiuntivi.length, 1)
const personal = { referente: 'Specifico', contatto: 'specific@example.test', telefono: '' }
const changed = inherit({ ...filled, referente: 'Specifico', contattiAggiuntivi: [extra, personal] }, b, a)
assert.equal(changed.referente, 'Specifico')
assert.equal(changed.contatto, 'b@example.test')
assert.equal(changed.telefono, '222')
assert.deepEqual(changed.contattiAggiuntivi, [personal, { referente: 'Anna', contatto: '', telefono: '' }])
const removed = inherit(changed, undefined, b)
assert.equal(removed.circuitoId, '')
assert.equal(removed.referente, 'Specifico')
assert.equal(removed.contatto, '')
assert.deepEqual(removed.contattiAggiuntivi, [personal])
assert.deepEqual(normalize([{}, { referente: '  Giulia  ' }]), [{ referente: 'Giulia', contatto: '', telefono: '' }])
assert.equal(merge([extra], [extra, personal]).length, 2)
assert.deepEqual(merge([extra], []), [extra])

const source = (await readFile(new URL('../src/utils/fairWorkflow.js', import.meta.url), 'utf8'))
  .replace("from '../constants/constants'", "from './constants.js'")
const constants = await import('../src/constants/constants.js')
const loadedSource = source.replace("import { STATI_TRATTATIVA_FIERA_CHIUSI } from './constants.js'", `const STATI_TRATTATIVA_FIERA_CHIUSI = ${JSON.stringify(constants.STATI_TRATTATIVA_FIERA_CHIUSI)}`)
const { isFairNegotiationArchived: archived, sortFairNegotiations: sort } = await import(`data:text/javascript;base64,${Buffer.from(loadedSource).toString('base64')}`)
const deal = { id: 't1', eventoId: 'e1', stato: 'IN_TRATTATIVA' }
assert.equal(archived(deal, [{ id: 'e1', stato: 'CHIUSA' }]), true)
assert.equal(archived(deal, [{ id: 'e1', stato: 'APERTA' }]), false)
assert.equal(archived(deal, [{ id: 'e2', stato: 'CHIUSA' }]), false)
assert.equal(archived({ ...deal, eventoId: null }, [{ id: 'e2', trattativaFieraId: 't1', stato: 'CHIUSA' }]), true)
assert.equal(archived({ ...deal, stato: 'CHIUSO_PERSO' }, []), true)
assert.equal(archived({ ...deal, stato: 'NESSUNA_RISPOSTA' }, []), true)
const rows = [{ id: 'none', nome: 'A' }, { id: 'later', dataInizio: '2026-11-01' }, { id: 'early', dataInizio: '2026-10-01' }]
assert.deepEqual(sort(rows).map(r => r.id), ['early', 'later', 'none'])
assert.deepEqual(sort(rows, 'dateDesc').map(r => r.id), ['later', 'early', 'none'])
assert.deepEqual(rows.map(r => r.id), ['none', 'later', 'early'])
console.log('25 controlli superati: contatti circuito, personalizzazioni, cambio circuito, storico, archivio e ordine.')
