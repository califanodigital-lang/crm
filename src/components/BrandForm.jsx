import { useState, useEffect } from 'react'
import { getActiveAgents } from '../services/userService'
import CreatorMultiSelect from './CreatorMultiSelect'

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
    note: '',
    creatorSuggeriti: []
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
  <form onSubmit={handleSubmit} className="space-y-0">
    {/* ── ANAGRAFICA ── */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-8">
      <div className="md:col-span-2">
        <p className="form-section-title">Anagrafica</p>
      </div>

      <div>
        <label className="label">Nome Brand *</label>
        <input className="input" value={formData.nome}
          onChange={(e) => setFormData({...formData, nome: e.target.value})} required />
      </div>
      <div>
        <label className="label">Settore</label>
        <input className="input" value={formData.settore}
          onChange={(e) => setFormData({...formData, settore: e.target.value})} />
      </div>
      <div>
        <label className="label">Target Demografico</label>
        <input className="input" value={formData.target}
          onChange={(e) => setFormData({...formData, target: e.target.value})}
          placeholder="es. 18-35 anni, Gaming..." />
      </div>
      <div>
        <label className="label">Topic del Target</label>
        <input className="input" value={formData.topicTarget}
          onChange={(e) => setFormData({...formData, topicTarget: e.target.value})}
          placeholder="es. Gaming, Cosplay, Food..." />
      </div>
      <div>
        <label className="label">Categorie</label>
        <div className="flex gap-2 mb-2">
          <input className="input flex-1" value={categoriaInput}
            onChange={(e) => setCategoriaInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategoria())}
            placeholder="es. Food, Gaming..." />
          <button type="button" onClick={handleAddCategoria}
            className="px-4 py-2.5 bg-yellow-400 text-gray-900 rounded-xl font-bold hover:bg-yellow-500 transition-colors">+</button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {formData.categorie.map((cat, i) => (
            <span key={i} className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium flex items-center gap-1.5">
              {cat}
              <button type="button" onClick={() => handleRemoveCategoria(i)} className="hover:text-purple-900 font-bold">×</button>
            </span>
          ))}
        </div>
      </div>
      <div className="md:col-span-2">
        <label className="label">Creator Suggeriti</label>
        <CreatorMultiSelect
          selectedIds={formData.creatorSuggeriti || []}
          onChange={(ids) => setFormData({...formData, creatorSuggeriti: ids})}
        />
      </div>
    </div>

    {/* ── CONTATTI ── */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-8 pt-6 border-t border-gray-100">
      <div className="md:col-span-2">
        <p className="form-section-title">Contatti</p>
      </div>
      <div>
        <label className="label">Referente</label>
        <input className="input" value={formData.referente}
          onChange={(e) => setFormData({...formData, referente: e.target.value})}
          placeholder="Nome referente brand" />
      </div>
      <div>
        <label className="label">Email / Form di Contatto</label>
        <input className="input" value={formData.contatto}
          onChange={(e) => setFormData({...formData, contatto: e.target.value})}
          placeholder="email@brand.com oppure https://..." />
      </div>
      <div>
        <label className="label">Telefono</label>
        <input className="input" value={formData.telefono}
          onChange={(e) => setFormData({...formData, telefono: e.target.value})} />
      </div>
      <div>
        <label className="label">Sito Web</label>
        <input type="url" className="input" value={formData.sitoWeb}
          onChange={(e) => setFormData({...formData, sitoWeb: e.target.value})}
          placeholder="https://..." />
      </div>
    </div>

    {/* ── NOTE ── */}
    <div className="pt-6 border-t border-gray-100 mb-8">
      <p className="form-section-title">Note</p>
      <textarea className="input" value={formData.note}
        onChange={(e) => setFormData({...formData, note: e.target.value})}
        placeholder="Note aggiuntive sul brand..." />
    </div>

    <div className="flex gap-3 justify-end pt-2">
      <button type="button" onClick={onCancel}
        className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
        Annulla
      </button>
      <button type="submit"
        className="px-6 py-2.5 bg-yellow-400 text-gray-900 rounded-xl text-sm font-bold hover:bg-yellow-500 transition-colors shadow-sm">
        {brand ? 'Aggiorna Brand' : 'Crea Brand'}
      </button>
    </div>
  </form>
)
}
