import test from 'node:test'
import assert from 'node:assert/strict'

import {
  feeDelCreator,
  creatorSenzaFee,
  percentualeAgenzia,
  feeAgenzia,
  messaggioFeeMancanti,
  righeCollaborazione,
} from './conversioneCollab.js'

test('la fee vuota, assente o non numerica conta come mancante', () => {
  const mappa = { a: '', b: null, c: 'abc', d: '  ', e: '-10' }
  assert.equal(feeDelCreator(mappa, 'a'), null)
  assert.equal(feeDelCreator(mappa, 'b'), null)
  assert.equal(feeDelCreator(mappa, 'c'), null)
  assert.equal(feeDelCreator(mappa, 'd'), null)
  assert.equal(feeDelCreator(mappa, 'e'), null)
  assert.equal(feeDelCreator(mappa, 'mai-inserito'), null)
})

test('la fee scritta viene letta, anche con la virgola e anche a zero', () => {
  assert.equal(feeDelCreator({ a: '1500' }, 'a'), 1500)
  assert.equal(feeDelCreator({ a: '1500,50' }, 'a'), 1500.5)
  assert.equal(feeDelCreator({ a: 2000 }, 'a'), 2000)
  assert.equal(feeDelCreator({ a: '0' }, 'a'), 0)
})

test('elenca solo i creator a cui manca la fee', () => {
  const mappa = { k1: '1000', k3: '' }
  assert.deepEqual(creatorSenzaFee(['k1', 'k2', 'k3'], mappa), ['k2', 'k3'])
  assert.deepEqual(creatorSenzaFee(['k1'], mappa), [])
})

test('la percentuale agenzia segue il contratto del creator, con 25 come ripiego', () => {
  assert.equal(percentualeAgenzia({ fee: 20 }), 20)
  assert.equal(percentualeAgenzia({ fee: '30' }), 30)
  assert.equal(percentualeAgenzia({ fee: null }), 25)
  assert.equal(percentualeAgenzia({ fee: 0 }), 25)
  assert.equal(percentualeAgenzia(undefined), 25)
})

test('la fee agenzia si calcola sulla percentuale del creator', () => {
  assert.equal(feeAgenzia(1000, { fee: 20 }), 200)
  assert.equal(feeAgenzia(1000, { fee: null }), 250)
  assert.equal(feeAgenzia(0, { fee: 20 }), null)
  assert.equal(feeAgenzia(null, { fee: 20 }), null)
})

test('il messaggio usa i nomi quando li conosciamo', () => {
  const creators = { k1: { nome: 'Talent Uno' }, k2: { nome: 'Talent Due' } }
  assert.match(messaggioFeeMancanti(['k1'], creators), /^Manca la fee di Talent Uno\./)
  assert.match(messaggioFeeMancanti(['k1', 'k2'], creators), /^Mancano le fee di Talent Uno, Talent Due\./)
  assert.match(messaggioFeeMancanti(['sconosciuto'], creators), /sconosciuto/)
})

test('ogni collaborazione prende la propria fee, non il preventivo intero', () => {
  const trattativa = {
    id: 't1',
    brand_id: 'b1',
    brand_nome: 'Brand Prova',
    importo_preventivo: 10000,
    fee_creator_map: { k1: '4000', k2: '3500', k3: '2500' },
    sales: 'Anna', ima: 'Bruno', agente: 'Carla',
    link_preventivo: 'https://esempio.it/p.pdf',
    contatto: 'ufficio@brand.it',
    note_trattativa: 'note',
  }
  const creatorsPerId = {
    k1: { nome: 'Uno', fee: 25 },
    k2: { nome: 'Due', fee: 20 },
    k3: { nome: 'Tre', fee: null },
  }

  const righe = righeCollaborazione({ trattativa, creatorIds: ['k1', 'k2', 'k3'], creatorsPerId })

  assert.deepEqual(righe.map(r => r.pagamento), [4000, 3500, 2500])
  assert.equal(righe.reduce((s, r) => s + r.pagamento, 0), 10000, 'la somma torna al preventivo')
  assert.deepEqual(righe.map(r => r.fee_management), [1000, 700, 625])
  assert.equal(righe[0].stato, 'IN_LAVORAZIONE')
  assert.equal(righe[0].pagato, false)
  assert.equal(righe[0].senior, 'Carla')
  assert.equal(righe[0].agente, 'Bruno')
})

test('nessuna riga porta con se l importo del preventivo', () => {
  const trattativa = { id: 't1', brand_nome: 'X', importo_preventivo: 10000, fee_creator_map: { k1: '4000' } }
  const righe = righeCollaborazione({ trattativa, creatorIds: ['k1'], creatorsPerId: {} })
  assert.equal(righe[0].pagamento, 4000)
  assert.notEqual(righe[0].pagamento, 10000)
})
