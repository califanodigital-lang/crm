import { expenseTotal } from '../utils/eventPayments'

export default function ExpenseItems({ value = [], onChange }) {
  return <div className="my-4 space-y-2">
    <label className="label">Rimborsi spesa</label>
    {value.map((item, index) => <div key={index} className="flex flex-wrap gap-2">
      <input aria-label="Voce rimborso" className="input flex-1" placeholder="Treno, hotel..." value={item.descrizione || ''} onChange={e => onChange(value.map((v, i) => i === index ? { ...v, descrizione: e.target.value } : v))} />
      <input aria-label="Importo rimborso" className="input w-28" type="number" min="0" step="0.01" value={item.importo ?? ''} onChange={e => onChange(value.map((v, i) => i === index ? { ...v, importo: e.target.value } : v))} />
      <select aria-label="Chi gestisce la spesa" className="input w-36" value={item.gestitoDa || 'agency'} onChange={e => onChange(value.map((v, i) => i === index ? { ...v, gestitoDa: e.target.value } : v))}><option value="agency">Agenzia</option><option value="creator">Creator</option></select>
      <button type="button" onClick={() => onChange(value.filter((_, i) => i !== index))}>Rimuovi</button>
    </div>)}
    <button type="button" className="btn-secondary" onClick={() => onChange([...value, { descrizione: '', importo: '', gestitoDa: 'agency' }])}>+ Voce spesa</button>
    <p className="text-sm font-semibold">Totale rimborsi: EUR {expenseTotal(value).toFixed(2)}</p>
    <p className="text-xs text-gray-500">I rimborsi sono separati dalla fee del creator.</p>
  </div>
}
