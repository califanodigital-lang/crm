import { expenseTotal } from '../utils/eventPayments'

export default function ExpenseSummary({ items = [], legacy }) {
  return <div className="text-xs text-gray-600 space-y-1">
    {items.map((item, index) => <p key={index}>{item.descrizione || 'Spesa'}: EUR {Number(item.importo || 0).toFixed(2)} · {item.gestitoDa === 'creator' ? 'Creator' : 'Agenzia'}</p>)}
    <p className="font-semibold">Totale spese: EUR {expenseTotal(items).toFixed(2)}</p>
    {legacy && <p className="text-gray-400">Rimborsi precedenti: {legacy}</p>}
  </div>
}
