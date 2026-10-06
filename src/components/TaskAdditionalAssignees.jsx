export default function TaskAdditionalAssignees({ operators, primaryId, value = [], onChange, disabled = false }) {
  const choices = operators.filter(operator => operator.id !== primaryId)
  const unavailable = value.filter(id => id !== primaryId && !operators.some(operator => operator.id === id))
  return <fieldset disabled={disabled} className="rounded-lg border border-gray-200 p-3 mt-3">
    <legend className="px-1 text-sm font-medium text-gray-700">Altri assegnatari (facoltativi)</legend>
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {choices.map(operator => <label key={operator.id} className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={value.includes(operator.id)} onChange={e => onChange(e.target.checked ? [...value, operator.id] : value.filter(id => id !== operator.id))} />
        {operator.nomeCompleto || operator.agenteNome}
      </label>)}
      {unavailable.map(id => <label key={id} className="flex items-center gap-2 text-sm text-gray-500"><input type="checkbox" checked onChange={() => onChange(value.filter(item => item !== id))} />Operatore non attivo</label>)}
      {!choices.length && !unavailable.length && <span className="text-xs text-gray-500">Nessun altro operatore attivo.</span>}
    </div>
    <p className="text-xs text-gray-500 mt-2">Una task condivisa: completarla aggiorna lo stato per tutti gli assegnatari.</p>
  </fieldset>
}
