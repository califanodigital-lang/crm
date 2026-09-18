// Verifiche delle regole "Da fare". Si eseguono con: npm run test
// Sono funzioni pure, quindi non serve né browser né database.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  costruisciDaFare,
  regoleCollaborazione,
  regoleCreator,
  regoleFeeFiere,
  regoleTrattativa,
  regoleTrattativaFiera,
} from './daFare.js'

const oggi = new Date(2026, 8, 17) // 17 settembre 2026
const data = (anno, mese, giorno) => `${anno}-${String(mese).padStart(2, '0')}-${String(giorno).padStart(2, '0')}`

test('primo contatto entro la data di follow-up: nessuna azione', () => {
  const items = regoleTrattativa({ id: '1', stato: 'PRIMO_CONTATTO', dataContatto: data(2026, 9, 15), dataFollowup1: data(2026, 9, 22) }, oggi)
  assert.equal(items.length, 0)
})

test('primo contatto con follow-up scaduto: azione in ritardo', () => {
  const items = regoleTrattativa({ id: '2', stato: 'PRIMO_CONTATTO', dataContatto: data(2026, 9, 1), dataFollowup1: data(2026, 9, 8) }, oggi)
  assert.equal(items.length, 1)
  assert.equal(items[0].categoria, 'followup')
  assert.equal(items[0].tipo, 'followup1')
  assert.equal(items[0].giorni, 9)
})

test('senza data follow-up la scadenza è il contatto più 7 giorni', () => {
  const items = regoleTrattativa({ id: '3', stato: 'PRIMO_CONTATTO', dataContatto: data(2026, 9, 5) }, oggi)
  assert.equal(items[0].giorni, 5)
})

test('contatto fermo da oltre 45 giorni: si propone la chiusura', () => {
  const items = regoleTrattativa({ id: '4', stato: 'PRIMO_CONTATTO', dataContatto: data(2026, 7, 1) }, oggi)
  assert.equal(items[0].categoria, 'chiudere')
  assert.equal(items[0].giorni, 78)
})

test('secondo follow-up senza risposta: si propone la chiusura', () => {
  const items = regoleTrattativa({ id: '5', stato: 'FOLLOW_UP_2', dataFollowup2: data(2026, 9, 1) }, oggi)
  assert.equal(items[0].categoria, 'chiudere')
  assert.equal(items[0].tipo, 'dopo_followup2')
})

test('secondo follow-up appena fatto: si attende', () => {
  assert.equal(regoleTrattativa({ id: '6', stato: 'FOLLOW_UP_2', dataFollowup2: data(2026, 9, 15) }, oggi).length, 0)
})

test('trattativa avanzata senza novità da oltre 21 giorni', () => {
  const items = regoleTrattativa({ id: '7', stato: 'IN_TRATTATIVA', dataCall: data(2026, 8, 1), updatedAt: data(2026, 8, 1), importoPreventivo: '1500' }, oggi)
  assert.equal(items[0].categoria, 'ferme')
  assert.equal(items[0].valore, 1500)
})

test('trattativa aggiornata di recente: nessuna azione', () => {
  const items = regoleTrattativa({ id: '8', stato: 'IN_TRATTATIVA', dataCall: data(2026, 8, 1), updatedAt: '2026-09-16T10:00:00+00:00' }, oggi)
  assert.equal(items.length, 0)
})

test('ricontatto con promemoria arrivato', () => {
  const items = regoleTrattativa({ id: '9', stato: 'RICONTATTO_FUTURO', reminderRicontatto: data(2026, 9, 10), dataRicontatto: data(2026, 9, 20), motivoRicontatto: 'Budget nuovo anno' }, oggi)
  assert.equal(items[0].categoria, 'followup')
  assert.equal(items[0].dettaglio, 'Budget nuovo anno')
})

test('contratto firmato senza collaborazione generata', () => {
  const items = regoleTrattativa({ id: '10', stato: 'CONTRATTO_FIRMATO', dataPreventivo: data(2026, 9, 5) }, oggi)
  assert.equal(items[0].tipo, 'firmato_senza_collab')
})

test('stati chiusi o iniziali non generano azioni', () => {
  assert.equal(regoleTrattativa({ id: '11', stato: 'COLLAB_GENERATA', updatedAt: data(2025, 1, 1) }, oggi).length, 0)
  assert.equal(regoleTrattativa({ id: '12', stato: 'RICERCA_COMPLETATA', createdAt: data(2025, 1, 1) }, oggi).length, 0)
  assert.equal(regoleTrattativa({ id: '13', stato: 'NESSUNA_RISPOSTA', updatedAt: data(2025, 1, 1) }, oggi).length, 0)
})

test('date con orario gestite come date', () => {
  const items = regoleTrattativa({ id: '14', stato: 'PRIMO_CONTATTO', createdAt: '2026-09-02T09:15:00.000+00:00' }, oggi)
  assert.equal(items[0].giorni, 8)
})

test('follow-up fiera a 4 e a 11 giorni dal contatto', () => {
  const primo = regoleTrattativaFiera({ id: 'f1', stato: 'CONTATTATO', nome: 'Comicon', dataContatto: data(2026, 9, 10), agente: 'Mario' }, oggi)
  assert.equal(primo[0].tipo, 'fiera_followup1')
  assert.deepEqual(primo[0].assegnatari, ['Mario'])

  const secondo = regoleTrattativaFiera({ id: 'f2', stato: 'CONTATTATO', nome: 'Comicon', dataContatto: data(2026, 9, 1) }, oggi)
  assert.equal(secondo[0].tipo, 'fiera_followup2')
})

test('fiera senza risposta dopo i follow-up: si propone la chiusura', () => {
  const items = regoleTrattativaFiera({ id: 'f3', stato: 'CONTATTATO', nome: 'Romics', dataContatto: data(2026, 7, 1) }, oggi)
  assert.equal(items[0].categoria, 'chiudere')
})

test('fiera già in trattativa: la segue il flusso eventi', () => {
  assert.equal(regoleTrattativaFiera({ id: 'f4', stato: 'IN_TRATTATIVA', dataContatto: data(2026, 1, 1) }, oggi).length, 0)
})

test('collaborazione in attesa di pagamento da oltre 60 giorni', () => {
  const items = regoleCollaborazione({ id: 'c1', stato: 'ATTESA_PAGAMENTO_AGENCY', dataFirma: data(2026, 5, 1), pagamento: '9000', brandNome: 'WePlay', creatorNome: 'Talent' }, oggi)
  assert.equal(items[0].categoria, 'pagamenti')
  assert.equal(items[0].valore, 9000)
  assert.equal(items[0].giorni, 139)
})

test('collaborazioni recenti o completate: nessuna azione', () => {
  assert.equal(regoleCollaborazione({ id: 'c2', stato: 'ATTESA_PAGAMENTO_CREATOR', dataFirma: data(2026, 9, 1) }, oggi).length, 0)
  assert.equal(regoleCollaborazione({ id: 'c3', stato: 'COMPLETATA', dataFirma: data(2024, 1, 1) }, oggi).length, 0)
})

test('collaborazione in lavorazione da oltre 90 giorni', () => {
  const items = regoleCollaborazione({ id: 'c4', stato: 'IN_LAVORAZIONE', dataFirma: data(2026, 1, 20) }, oggi)
  assert.equal(items[0].tipo, 'collab_ferma')
})

test('contratti talent scaduti e in scadenza', () => {
  const scaduto = regoleCreator({ id: 'k1', nome: 'Talent', stato: '1 Sotto contratto', scadenzaContratto: data(2026, 8, 31) }, oggi)
  assert.equal(scaduto[0].tipo, 'contratto_scaduto')
  assert.equal(scaduto[0].giorni, 17)

  const inScadenza = regoleCreator({ id: 'k2', nome: 'Talent', scadenzaContratto: data(2026, 10, 15) }, oggi)
  assert.equal(inScadenza[0].tipo, 'contratto_in_scadenza')
  assert.equal(inScadenza[0].giorni, 28)

  assert.equal(regoleCreator({ id: 'k3', scadenzaContratto: data(2027, 6, 1) }, oggi).length, 0)
  assert.equal(regoleCreator({ id: 'k4', stato: '5 Perso', scadenzaContratto: data(2026, 1, 1) }, oggi).length, 0)
})

test('fee fiere raggruppate per evento concluso e non fatturate', () => {
  const evento = { id: 'e1', nome: 'Fabcon', dataInizio: data(2026, 8, 20), dataFine: data(2026, 8, 20), stato: 'APERTA' }
  const items = regoleFeeFiere([
    { id: 'p1', eventoId: 'e1', fee: 300, fatturaEmessa: false, evento },
    { id: 'p2', eventoId: 'e1', fee: 200, fatturaEmessa: false, evento },
    { id: 'p3', eventoId: 'e1', fee: 500, fatturaEmessa: true, evento },
  ], oggi)
  assert.equal(items.length, 1)
  assert.equal(items[0].valore, 500)
  assert.equal(items[0].conteggio, 2)
})

test('eventi futuri o chiusi non entrano nelle fee da fatturare', () => {
  const futuro = { id: 'e2', nome: 'Lucca', dataFine: data(2026, 11, 1), stato: 'APERTA' }
  const chiuso = { id: 'e3', nome: 'Passata', dataFine: data(2026, 1, 1), stato: 'CHIUSA' }
  const items = regoleFeeFiere([
    { id: 'p4', eventoId: 'e2', fee: 100, fatturaEmessa: false, evento: futuro },
    { id: 'p5', eventoId: 'e3', fee: 100, fatturaEmessa: false, evento: chiuso },
  ], oggi)
  assert.equal(items.length, 0)
})

test('un agente vede solo le proprie voci', () => {
  const dati = {
    trattative: [
      { id: 't1', stato: 'PRIMO_CONTATTO', dataContatto: data(2026, 9, 1), assegnatario: ['Raffaele'], brandNome: 'A' },
      { id: 't2', stato: 'PRIMO_CONTATTO', dataContatto: data(2026, 9, 1), assegnatario: ['Altro'], brandNome: 'B' },
      { id: 't3', stato: 'PRIMO_CONTATTO', dataContatto: data(2026, 9, 1), assegnatario: [], sales: 'Raffaele', brandNome: 'C' },
    ],
    collaborazioni: [], trattativeFiere: [], creators: [], partecipazioni: [],
  }
  assert.equal(costruisciDaFare(dati, { oggi, agenteNome: 'Raffaele' }).totale, 2)
  assert.equal(costruisciDaFare(dati, { oggi }).totale, 3)
})

test('contratti e fatture solo per gli admin', () => {
  const dati = {
    trattative: [], collaborazioni: [], trattativeFiere: [], partecipazioni: [],
    creators: [{ id: 'k', scadenzaContratto: data(2026, 1, 1) }],
  }
  assert.equal(costruisciDaFare(dati, { oggi, isAdmin: false }).conteggi.contratti, 0)
  assert.equal(costruisciDaFare(dati, { oggi, isAdmin: true }).conteggi.contratti, 1)
})

test('ordinamento: prima i ritardi maggiori, contratti scaduti prima di quelli in scadenza', () => {
  const dati = {
    trattative: [
      { id: 'a', stato: 'PRIMO_CONTATTO', dataContatto: data(2026, 9, 8), brandNome: 'Recente' },
      { id: 'b', stato: 'PRIMO_CONTATTO', dataContatto: data(2026, 8, 20), brandNome: 'Vecchia' },
    ],
    collaborazioni: [], trattativeFiere: [], partecipazioni: [],
    creators: [
      { id: 'x1', nome: 'Scade tra 20', scadenzaContratto: data(2026, 10, 7) },
      { id: 'x2', nome: 'Scaduto da 5', scadenzaContratto: data(2026, 9, 12) },
      { id: 'x3', nome: 'Scade tra 3', scadenzaContratto: data(2026, 9, 20) },
    ],
  }
  const risultato = costruisciDaFare(dati, { oggi, isAdmin: true })
  assert.equal(risultato.perCategoria.followup[0].riferimento, 'Vecchia')
  assert.deepEqual(
    risultato.perCategoria.contratti.map(item => item.riferimento),
    ['Scaduto da 5', 'Scade tra 3', 'Scade tra 20']
  )
})
