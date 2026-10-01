import test from 'node:test'
import assert from 'node:assert/strict'
import { addCivilDays, addCivilMonths } from '../src/utils/civilDate.js'
import { financeSummary, invoiceSourceValid } from '../src/utils/financeSummary.js'
import { chronologicalNotes } from '../src/utils/noteLog.js'
import { canUseCrm, canAccessAdministration } from '../src/utils/permissions.js'
import { userProfilePayload } from '../src/utils/profilePayload.js'

test('Update parziali utenti non azzerano fisso o anagrafica', () => {
  assert.deepEqual(userProfilePayload({attivo:false}), {attivo:false})
  assert.deepEqual(userProfilePayload({role:'ADMIN'}), {role:'ADMIN'})
  assert.deepEqual(userProfilePayload({fissoMensile:0}), {fisso_mensile:0})
})

test('Date civili: followup, sei mesi e fine mese senza shift UTC', () => {
  assert.equal(addCivilDays('2026-06-12', 4), '2026-06-16')
  assert.equal(addCivilMonths('2026-06-12', 6), '2026-12-12')
  assert.equal(addCivilMonths('2026-08-31', 6), '2027-02-28')
  assert.equal(addCivilDays('2028-02-28', 1), '2028-02-29')
  assert.equal(addCivilMonths('2026-02-30', 6), null)
})
test('Account inattivo: nessun accesso anche con ruolo Admin', () => {
  for (const role of ['ADMIN','AGENT']) {
    assert.equal(canUseCrm({role,attivo:false}), false)
    assert.equal(canAccessAdministration({role,attivo:false}), false)
  }
})
test('Fatture: ogni tipo richiede la propria sorgente', () => {
  assert.equal(invoiceSourceValid({tipo:'FIERA',partecipazioneId:'p'}), true)
  assert.equal(invoiceSourceValid({tipo:'FIERA',collabId:'c'}), false)
  assert.equal(invoiceSourceValid({tipo:'MANUALE',collabId:'c'}), false)
  assert.equal(invoiceSourceValid({tipo:'MANUALE'}), true)
})
test('Note ordinate per istante reale, cancellazioni nascoste', () => {
  const notes = chronologicalNotes([
    {id:'a',timestamp:'2026-10-01T12:00:00+02:00'},
    {id:'b',timestamp:'2026-10-01T10:30:00Z'},
    {id:'c',timestamp:'2026-10-02T00:00:00Z',_deleted:true},
  ])
  assert.deepEqual(notes.map(n=>n.id), ['b','a'])
})
test('Cassa: gross incassato meno creator, spese e fissi; fatture non duplicate', () => {
  const result = financeSummary({
    month:'2026-10',
    collaborations:[{id:'adv',pagamento:1000,feeManagement:250,pagato_agency:true,dataPagamentoAgency:'2026-10-01',pagato:true,dataPagamentoCreator:'2026-10-02'}],
    participations:[{fee:200,pagato_agency:true,dataPagamentoAgency:'2026-10-03',pagato:true,dataPagamentoCreator:'2026-10-04',rimborsiSpese:[{importo:20,pagata:true,dataPagamento:'2026-10-05'},{importo:50,pagata:false}]}],
    invoices:[{collabId:'adv',importo:250,incassata:true,dataIncasso:'2026-10-01'},{importo:100,incassata:true,dataIncasso:'2026-10-02'}],
    agentPayments:[{importoPagato:50,mese:'2026-10'}],
    expenses:[{importo:10,pagata:true,dataPagamento:'2026-10-06'},{importo:500,pagata:false}],
    versamenti:[{importoVersato:30,verificato:true,mese:'2026-10-01'},{importoVersato:999,verificato:false,mese:'2026-10-01'}],
    contracts:[{id:'k',importoMensile:40}],
    contractPayments:[{contrattoId:'k',pagato:true,dataPagamento:'2026-10-01',importo:40}],
  })
  assert.equal(result.incoming,1370)
  assert.equal(result.outgoing,980)
  assert.equal(result.balance,390)
})
test('Tranche e dati senza date: residui distinti dai movimenti del mese', () => {
  const result = financeSummary({month:'2026-10', collaborations:[
    {pagamento:1000,feeManagement:250,pagato_agency:true,dataPagamentoAgency:'2026-09-01',pagato:false,tranche:[{importo:200,pagato:true,data:'2026-10-01'},{importo:550,pagato:false}]},
    {pagamento:100,pagato_agency:true,pagato:false},
    {pagamento:400,pagato_agency:false,pagato:false},
  ]})
  assert.equal(result.incoming,0)
  assert.equal(result.outgoing,200)
  assert.equal(result.undated,1)
  assert.equal(result.receivables,400)
  assert.equal(result.creatorDebt,625)
})
