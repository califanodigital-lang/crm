export default function ExtraContactsField({ value = [], onChange }) {
  const rows = Array.isArray(value) ? value : []
  const update = (index, field, text) => onChange(rows.map((row, i) => i === index ? { ...row, [field]: text } : row))
  return (
    <div className="md:col-span-2 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="label mb-0">Contatti aggiuntivi</span>
        <button type="button" className="text-sm text-blue-700 hover:underline" onClick={() => onChange([...rows, { referente: '', contatto: '', telefono: '' }])}>+ Aggiungi contatto</button>
      </div>
      {rows.map((row, index) => (
        <div key={index} className="rounded-lg border p-3 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <label className="text-xs text-gray-600">Referente<input className="input" value={row.referente || ''} onChange={e => update(index, 'referente', e.target.value)} /></label>
            <label className="text-xs text-gray-600">Email / contatto<input className="input" value={row.contatto || ''} onChange={e => update(index, 'contatto', e.target.value)} /></label>
            <label className="text-xs text-gray-600">Telefono<input className="input" value={row.telefono || ''} onChange={e => update(index, 'telefono', e.target.value)} /></label>
          </div>
          <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => onChange(rows.filter((_, i) => i !== index))}>Rimuovi contatto {index + 1}</button>
        </div>
      ))}
    </div>
  )
}
