import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PIATTAFORME_FEE_CONFIG, TIER_OPTIONS } from '../constants/constants'

// piattaforme: array di { nome } dal DB
// value: array di { nome, tier, fees: {}, note }
// onChange: callback con il nuovo array aggiornato

export default function CreatorPiattaforme({ piattaforme = [], value = [], onChange }) {
  const [nuovaNome, setNuovaNome] = useState('')

  const platformeDisponibili = piattaforme.filter(
    p => !value.find(v => v.nome === p.nome)
  )

  const handleAdd = () => {
    if (!nuovaNome) return
    onChange([...value, { nome: nuovaNome, tier: '', fees: {}, note: '' }])
    setNuovaNome('')
  }

  const handleRemove = (nome) => {
    onChange(value.filter(v => v.nome !== nome))
  }

  const handleUpdate = (nome, field, val) => {
    onChange(value.map(v =>
      v.nome === nome ? { ...v, [field]: val } : v
    ))
  }

  const handleFeeChange = (nome, feeKey, val) => {
    onChange(value.map(v =>
      v.nome === nome
        ? { ...v, fees: { ...v.fees, [feeKey]: val } }
        : v
    ))
  }

  const getFeeFields = (nomePiattaforma) => {
    return PIATTAFORME_FEE_CONFIG[nomePiattaforma] || [{ key: 'fee', label: 'Fee (€)' }]
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Piattaforme Attive</h3>
      </div>

      {/* Lista piattaforme aggiunte */}
      <div className="space-y-4 mb-4">
        {value.length === 0 && (
          <p className="text-sm text-gray-400 italic">Nessuna piattaforma aggiunta. Usa il menu sotto.</p>
        )}
        {value.map(p => (
          <div key={p.nome} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-gray-900 text-base">{p.nome}</span>
              <button
                type="button"
                onClick={() => handleRemove(p.nome)}
                className="p-1 text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Tier */}
              <div>
                <label className="label text-xs">Tier</label>
                <select
                  className="input"
                  value={p.tier}
                  onChange={(e) => handleUpdate(p.nome, 'tier', e.target.value)}
                >
                  <option value="">Seleziona...</option>
                  {TIER_OPTIONS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Fee fields specifici della piattaforma */}
              {getFeeFields(p.nome).map(field => (
                <div key={field.key}>
                  <label className="label text-xs">{field.label}</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={p.fees?.[field.key] || ''}
                    onChange={(e) => handleFeeChange(p.nome, field.key, e.target.value)}
                    placeholder="0"
                  />
                </div>
              ))}

              {/* Note piattaforma */}
              <div className="md:col-span-2">
                <label className="label text-xs">Note</label>
                <input
                  className="input"
                  value={p.note || ''}
                  onChange={(e) => handleUpdate(p.nome, 'note', e.target.value)}
                  placeholder={`Note specifiche ${p.nome}...`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Aggiungi piattaforma */}
      {platformeDisponibili.length > 0 && (
        <div className="flex gap-2">
          <select
            className="input flex-1"
            value={nuovaNome}
            onChange={(e) => setNuovaNome(e.target.value)}
          >
            <option value="">Aggiungi piattaforma...</option>
            {platformeDisponibili.map(p => (
              <option key={p.nome} value={p.nome}>{p.nome}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!nuovaNome}
            className="flex items-center gap-1 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            Aggiungi
          </button>
        </div>
      )}
    </div>
  )
}
