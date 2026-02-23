import { useState, useEffect } from 'react'
import { getActiveAgents } from '../services/userService'
import CreatorMultiSelect from './CreatorMultiSelect'
import { RISPOSTE_OPTIONS, CONTATTATO_PER_OPTIONS } from '../constants/constants'

export default function BrandForm({ brand = null, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    nome: '',
    settore: '',
    target: '',
    topicTarget: '',
    categorie: [],
    referente: '',
    contatto: '',
    telefono: '',
    sitoWeb: '',
    agente: '',
    priorita: 'NORMALE',
    note: '',
    creatorSuggeriti: [],
    dataContatto: new Date().toISOString().split('T')[0],
    dataFollowup1: '',
    dataFollowup2: '',
    risposta: '',
    contattatoPer: ''
  })
  const [agenti, setAgenti] = useState([])
  const [categoriaInput, setCategoriaInput] = useState('')

  useEffect(() => {
    loadAgenti()
  }, [])

  useEffect(() => {
    if (brand) setFormData(brand)
  }, [brand])

  const loadAgenti = async () => {
    const { data } = await getActiveAgents()
    setAgenti(data || [])
  }

  const handleAddCategoria = () => {
    if (categoriaInput.trim()) {
      setFormData({ ...formData, categorie: [...formData.categorie, categoriaInput.trim()] })
      setCategoriaInput('')
    }
  }

  const handleRemoveCategoria = (index) => {
    setFormData({ ...formData, categorie: formData.categorie.filter((_, i) => i !== index) })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── DATI PRINCIPALI ── */}
        <div>
          <label className="label">Nome Brand *</label>
          <input
            className="input"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="label">Settore</label>
          <input
            className="input"
            value={formData.settore}
            onChange={(e) => setFormData({ ...formData, settore: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Target Demografico</label>
          <input
            className="input"
            value={formData.target}
            onChange={(e) => setFormData({ ...formData, target: e.target.value })}
            placeholder="es. 18-35 anni, Gaming, Tech..."
          />
        </div>

        <div>
          <label className="label">Topic del Target</label>
          <input
            className="input"
            value={formData.topicTarget}
            onChange={(e) => setFormData({...formData, topicTarget: e.target.value})}
            placeholder="es. Gaming, Cosplay, Food..."
          />
        </div>

        <div>
          <label className="label">Agente Assegnato</label>
          <select
            className="input"
            value={formData.agente}
            onChange={(e) => setFormData({ ...formData, agente: e.target.value })}
          >
            <option value="">Nessuno</option>
            {agenti.map(a => (
              <option key={a.id} value={a.agenteNome}>{a.nomeCompleto}</option>
            ))}
          </select>
        </div>

        {/* ── CATEGORIE ── */}
        <div>
          <label className="label">Categorie</label>
          <div className="flex gap-2 mb-2">
            <input
              className="input flex-1"
              value={categoriaInput}
              onChange={(e) => setCategoriaInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategoria())}
              placeholder="es. Food, Gaming..."
            />
            <button
              type="button"
              onClick={handleAddCategoria}
              className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500"
            >
              +
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.categorie.map((cat, index) => (
              <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center gap-2">
                {cat}
                <button
                  type="button"
                  onClick={() => handleRemoveCategoria(index)}
                  className="text-purple-600 hover:text-purple-900"
                >×</button>
              </span>
            ))}
          </div>
        </div>

        {/* ── CREATOR SUGGERITI — solo dal gestionale ── */}
        <div className="md:col-span-2">
          <CreatorMultiSelect
            selectedIds={formData.creatorSuggeriti || []}
            onChange={(ids) => setFormData({ ...formData, creatorSuggeriti: ids })}
          />
        </div>

        {/* ── CONTATTI ── */}
        <div>
          <label className="label">Referente</label>
          <input
            className="input"
            value={formData.referente}
            onChange={(e) => setFormData({ ...formData, referente: e.target.value })}
            placeholder="Nome referente brand"
          />
        </div>

        <div>
          <label className="label">Contatto</label>
          <input
            className="input"
            value={formData.contatto}
            onChange={(e) => setFormData({ ...formData, contatto: e.target.value })}
            placeholder="Email o URL form di contatto"
          />
          <p className="text-xs text-gray-500 mt-1">Inserisci email o URL form di contatto</p>
        </div>

        <div>
          <label className="label">Telefono</label>
          <input
            className="input"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Sito Web</label>
          <input
            type="url"
            className="input"
            value={formData.sitoWeb}
            onChange={(e) => setFormData({ ...formData, sitoWeb: e.target.value })}
          />
        </div>

        {/* ── STATO & PRIORITÀ ── */}

        <div>
          <label className="label">Priorità</label>
          <select
            className="input"
            value={formData.priorita}
            onChange={(e) => setFormData({ ...formData, priorita: e.target.value })}
          >
            <option value="BASSA">BASSA</option>
            <option value="NORMALE">NORMALE</option>
            <option value="ALTA">ALTA</option>
            <option value="URGENTE">URGENTE</option>
          </select>
        </div>

        {/* ── PIPELINE CONTATTI ── */}
        <div>
          <label className="label">Contattato Per</label>
          <select
            className="input"
            value={formData.contattatoPer}
            onChange={(e) => setFormData({ ...formData, contattatoPer: e.target.value })}
          >
            <option value="">Seleziona...</option>
            {CONTATTATO_PER_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Risposta</label>
          <select
            className="input"
            value={formData.risposta}
            onChange={(e) => setFormData({ ...formData, risposta: e.target.value })}
          >
            <option value="">Seleziona...</option>
            {RISPOSTE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Data Contatto</label>
          <input
            type="date"
            className="input"
            value={formData.dataContatto}
            onChange={(e) => setFormData({ ...formData, dataContatto: e.target.value })}
          />
        </div>

        <div>
          {/* spacer per allineare la griglia */}
        </div>

        <div>
          <label className="label">Data 1° Follow-up</label>
          <input
            type="date"
            className="input"
            value={formData.dataFollowup1}
            onChange={(e) => setFormData({ ...formData, dataFollowup1: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Data 2° Follow-up</label>
          <input
            type="date"
            className="input"
            value={formData.dataFollowup2}
            onChange={(e) => setFormData({ ...formData, dataFollowup2: e.target.value })}
          />
        </div>

        {/* ── NOTE ── */}
        <div className="md:col-span-2">
          <label className="label">Note</label>
          <textarea
            className="input min-h-[100px]"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />
        </div>

      </div>

      <div className="mt-6 flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Annulla
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
        >
          {brand ? 'Aggiorna' : 'Crea'} Brand
        </button>
      </div>
    </form>
  )
}
