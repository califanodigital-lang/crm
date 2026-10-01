import { romeToday } from '../utils/civilDate'
import { useState } from 'react'
import { updateCollaboration } from '../services/collaborationService'
import { updatePartecipazione } from '../services/partecipazioneService'
import { creatorFee, expenseTotal, collaborationCreatorFee, remainingCreatorFee } from '../utils/eventPayments'
import { toast } from './Toast'
import { confirm } from './ConfirmModal'

const money = amount => `EUR ${Number(amount || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`

export default function PaymentOverview({ collaborations, participations, onRefresh }) {
  const [saving, setSaving] = useState(null)
  const rows = [
    ...collaborations.filter(c => c.stato !== 'ANNULLATA').map(c => ({ ...c, key: `adv-${c.id}`, source: c, kind: 'adv', label: c.brandNome, gross: Number(c.pagamento) || 0, net: collaborationCreatorFee(c), invoiced: c.fatturaEmessa, expenses: [] })),
    ...participations.map(p => ({ ...p, key: `fiera-${p.id}`, source: p, kind: 'fiera', label: p.eventoNome, gross: Number(p.fee) || 0, net: creatorFee(p), invoiced: p.fatturaEmessa, expenses: p.rimborsiSpese || [] })),
  ]
  const receivables = rows.filter(r => !r.invoiced || !r.pagato_agency)
  const payables = rows.filter(r => r.pagato_agency && !r.pagato && r.net > 0).map(r => {
    return { ...r, outstanding: remainingCreatorFee(r.net, r.tranche) }
  }).filter(r => r.outstanding > 0)

  const markPaid = async row => {
    const approved = await confirm(`Registrare il saldo di ${money(row.outstanding)} per ${row.creatorNome}?`, { title: 'Pagamento creator', confirmLabel: 'Registra pagamento' })
    if (!approved) return
    setSaving(row.key)
    const today = romeToday()
    try {
    const result = row.kind === 'fiera'
      ? await updatePartecipazione(row.id, { ...row.source, pagato: true, dataPagamentoCreator: today })
      : await updateCollaboration(row.id, { ...row.source, stato: row.source.stato === 'ATTESA_PAGAMENTO_CREATOR' ? 'COMPLETATA' : row.source.stato, pagato: true, dataPagamentoCreator: today, tranche: (row.tranche || []).map(t => ({ ...t, pagato: true, data: t.data || today })) })
    if (result.error) toast.error('Impossibile registrare il pagamento')
    else { toast.success('Pagamento creator registrato'); await onRefresh() }
    } catch { toast.error('Impossibile completare il pagamento. Ricarica e verifica.') }
    finally { setSaving(null) }
  }

  return <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
    <div className="card overflow-x-auto">
      <h2 className="font-bold text-lg mb-2">Da fatturare e incassare</h2>
      <p className="text-xs text-gray-500 mb-3">Fiere e ADV di tutti i mesi ancora da regolarizzare.</p>
      <table className="w-full text-sm"><thead><tr><th className="text-left">Evento / Brand</th><th className="text-left">Creator</th><th>Importo</th><th>Stato</th></tr></thead><tbody>
        {receivables.map(r => <tr key={r.key} className="border-t"><td className="py-2">{r.label}</td><td>{r.creatorNome}</td><td>{money(r.gross)}</td><td>{!r.invoiced ? 'Da fatturare' : 'Fatturato'} · {r.pagato_agency ? 'Incassato' : 'Da incassare'}</td></tr>)}
      </tbody></table>{!receivables.length && <p className="text-sm text-gray-500">Nessun incasso in sospeso.</p>}
    </div>
    <div className="card overflow-x-auto">
      <h2 className="font-bold text-lg mb-2">Creator da pagare</h2>
      <p className="text-xs text-gray-500 mb-3">Compaiono dopo l'incasso dell'agenzia. Rimborsi separati dalla quota della fee.</p>
      <table className="w-full text-sm"><thead><tr><th className="text-left">Creator / Attivita</th><th>Quota fee residua</th><th>Spese creator</th><th>Azioni</th></tr></thead><tbody>
        {payables.map(r => <tr key={r.key} className="border-t"><td className="py-2">{r.creatorNome}<div className="text-xs text-gray-500">{r.label}</div></td><td>{money(r.outstanding)}</td><td>{money(expenseTotal(r.expenses.filter(e => e.gestitoDa === 'creator')))}</td><td><button className="btn-secondary" disabled={saving !== null} onClick={() => markPaid(r)}>Segna pagato</button></td></tr>)}
      </tbody></table>
      <p className="font-semibold mt-3">Totale fee da pagare: {money(payables.reduce((sum, r) => sum + r.outstanding, 0))}</p>
    </div>
  </div>
}
