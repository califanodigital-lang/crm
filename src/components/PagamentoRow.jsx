import { useState } from 'react'

export function PagamentoRow({ pagamento, onSave }) {
  const [editing, setEditing] = useState(false)
  const [importo, setImporto] = useState('')

  const totale = pagamento.importoTotale || pagamento.importoFisso || 0
  const diff = totale - pagamento.importoPagato

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-3 px-4 font-medium text-sm">{pagamento.agenteNome}</td>
      <td className="py-3 px-4 text-right text-sm">
        {pagamento.importoFisso > 0
          ? `€${pagamento.importoFisso.toLocaleString()}`
          : <span className="text-gray-300">—</span>}
      </td>
      <td className="py-3 px-4 text-right text-sm">
        {(pagamento.importoFee || 0) > 0
          ? `€${pagamento.importoFee.toLocaleString()}`
          : <span className="text-gray-300">—</span>}
      </td>
      <td className="py-3 px-4 text-right text-sm font-bold text-gray-900">
        {totale > 0 ? `€${totale.toLocaleString()}` : <span className="text-gray-300">—</span>}
      </td>
      <td className="py-3 px-4 text-right text-sm font-semibold text-green-600">
        €{pagamento.importoPagato.toLocaleString()}
      </td>
      <td className="py-3 px-4 text-right text-sm">
        {totale === 0
          ? <span className="text-gray-300">—</span>
          : diff > 0
            ? <span className="text-red-600 font-semibold">-€{diff.toLocaleString()}</span>
            : <span className="text-green-600 font-semibold">✓ Saldato</span>}
      </td>
      <td className="py-3 px-4 text-right">
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
          totale > 0 && pagamento.importoPagato >= totale
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700'
        }`}>
          {totale > 0 && pagamento.importoPagato >= totale ? 'Pagato' : 'Da pagare'}
        </span>
      </td>
      <td className="py-3 px-4 text-right">
        {editing ? (
          <div className="flex items-center justify-end gap-2">
            <input
              type="number" className="input w-24 text-sm py-1"
              value={importo} onChange={(e) => setImporto(e.target.value)}
              placeholder="€ aggiuntivo" autoFocus
            />
            <button onClick={() => {
              onSave(pagamento.agenteNome, pagamento.importoPagato + parseFloat(importo || 0), pagamento.importoFisso, totale)
              setEditing(false)
              setImporto('')
            }} className="px-2 py-1 bg-green-500 text-white rounded text-xs font-bold">✓</button>
            <button onClick={() => setEditing(false)}
              className="px-2 py-1 bg-gray-200 rounded text-xs">✕</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium">
            + Registra
          </button>
        )}
      </td>
    </tr>
  )
}