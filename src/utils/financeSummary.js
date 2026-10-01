import { collaborationCreatorFee, creatorFee, remainingCreatorFee } from './eventPayments.js'

const cents = value => Math.round((Number(value) || 0) * 100)
export const financeSummary = ({ month, collaborations = [], participations = [], invoices = [], versamenti = [], contracts = [], contractPayments = [], agentPayments = [], expenses = [] }) => {
  let incoming = 0, outgoing = 0, undated = 0
  const entry = (direction, amount, date) => {
    if (!date) { undated++; return }
    if (!String(date).startsWith(month)) return
    if (direction === 'in') incoming += cents(amount)
    else outgoing += cents(amount)
  }
  const active = collaborations.filter(c => c.stato !== 'ANNULLATA')
  for (const c of active) {
    if (c.pagato_agency) entry('in', c.pagamento, c.dataPagamentoAgency)
    if (c.tranche?.length) {
      for (const t of c.tranche.filter(t => t.pagato)) entry('out', t.importo, t.data)
    } else if (c.pagato) entry('out', collaborationCreatorFee(c), c.dataPagamentoCreator)
  }
  for (const p of participations) {
    if (p.pagato_agency) entry('in', p.fee, p.dataPagamentoAgency)
    if (p.pagato) entry('out', creatorFee(p), p.dataPagamentoCreator)
    for (const e of p.rimborsiSpese || []) if (e.pagata) entry('out', e.importo, e.dataPagamento)
  }
  // Fatture operative gia contate dalla sorgente: non sommarle una seconda volta.
  for (const f of invoices) if (!f.collabId && !f.partecipazioneId && !f.contrattoId && !f.versamentoId && f.incassata) entry('in', f.importo, f.dataIncasso)
  for (const v of versamenti) if (v.verificato) entry('in', v.importoVersato, v.mese)
  for (const p of contractPayments.filter(p => p.pagato)) {
    const c = contracts.find(c => c.id === p.contrattoId)
    if (c && p.importo != null) entry('in', p.importo, p.dataPagamento)
    else if (c) undated++
  }
  for (const p of agentPayments) if (Number(p.importoPagato) > 0) entry('out', p.importoPagato, p.mese)
  for (const e of expenses) if (e.pagata) entry('out', e.importo, e.dataPagamento)
  const receivables = active.filter(c => !c.pagato_agency).reduce((s, c) => s + cents(c.pagamento), 0)
    + participations.filter(p => !p.pagato_agency).reduce((s, p) => s + cents(p.fee), 0)
  const creatorDebt = active.filter(c => c.pagato_agency && !c.pagato).reduce((s, c) => s + cents(remainingCreatorFee(collaborationCreatorFee(c), c.tranche)), 0)
    + participations.filter(p => p.pagato_agency && !p.pagato).reduce((s, p) => s + cents(creatorFee(p)), 0)
  return { incoming: incoming / 100, outgoing: outgoing / 100, balance: (incoming - outgoing) / 100, receivables: receivables / 100, creatorDebt: creatorDebt / 100, undated }
}
export const invoiceSourceValid = invoice => {
  const field = { COLLAB: 'collabId', FIERA: 'partecipazioneId', RICORRENTE: 'contrattoId', VERSAMENTO: 'versamentoId' }[invoice.tipo]
  return invoice.tipo === 'MANUALE' ? !['collabId','partecipazioneId','contrattoId','versamentoId'].some(k => invoice[k]) : !!field && !!invoice[field]
}
