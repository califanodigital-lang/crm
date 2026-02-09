import { useState, useEffect } from 'react'
import { getActiveAgents } from '../services/userService'

export default function BrandForm({ brand = null, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    nome: '',
    settore: '',
    target: '',
    categorie: [],
    referente: '',
    contatto: '',
    telefono: '',
    sitoWeb: '',
    agente: '',
    priorita: 'NORMALE',
    stato: 'DA_CONTATTARE',
    note: '',
  })
  const [agenti, setAgenti] = useState([])

  const [categoriaInput, setCategoriaInput] = useState('')

  const loadAgenti = async () => {
    const { data } = await getActiveAgents()
    setAgenti(data || [])
  }

  useEffect(() => {
      loadAgenti()
    }, [])

  const handleAddCategoria = () => {
  if (categoriaInput.trim()) {
    setFormData({...formData, categorie: [...formData.categorie, categoriaInput.trim()]})
    setCategoriaInput('')
  }
  }

  const handleRemoveCategoria = (index) => {
    setFormData({...formData, categorie: formData.categorie.filter((_, i) => i !== index)})
  }

  useEffect(() => {
    if (brand) setFormData(brand)
  }, [brand])

  

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label">Nome Brand *</label>
          <input
            className="input"
            value={formData.nome}
            onChange={(e) => setFormData({...formData, nome: e.target.value})}
            required
          />
        </div>
        
        <div>
          <label className="label">Settore</label>
          <input
            className="input"
            value={formData.settore}
            onChange={(e) => setFormData({...formData, settore: e.target.value})}
          />
        </div>
        
        <div>
          <label className="label">Target</label>
          <input
            className="input"
            value={formData.target}
            onChange={(e) => setFormData({...formData, target: e.target.value})}
          />
        </div>
        
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
              Aggiungi
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
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <label className="label">Referente</label>
          <input
            className="input"
            value={formData.referente}
            onChange={(e) => setFormData({...formData, referente: e.target.value})}
          />
        </div>
        
        <div>
          <label className="label">Contatto</label>
          <input
            className="input"
            value={formData.contatto}
            onChange={(e) => setFormData({...formData, contatto: e.target.value})}
            placeholder="Email o link form di contatto"
          />
          <p className="text-xs text-gray-500 mt-1">
            Inserisci email o URL del form di contatto
          </p>
        </div>
        
        <div>
          <label className="label">Telefono</label>
          <input
            className="input"
            value={formData.telefono}
            onChange={(e) => setFormData({...formData, telefono: e.target.value})}
          />
        </div>
        
        <div>
          <label className="label">Sito Web</label>
          <input
            type="url"
            className="input"
            value={formData.sitoWeb}
            onChange={(e) => setFormData({...formData, sitoWeb: e.target.value})}
          />
        </div>
        
        <div>
          <label className="label">Agente Assegnato</label>
          <select
            className="input"
            value={formData.agente}
            onChange={(e) => setFormData({...formData, agente: e.target.value})}
          >
            <option value="">Nessuno</option>
            {agenti.map(a => (
              <option key={a.id} value={a.agenteNome}>{a.nomeCompleto}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="label">Priorità</label>
          <select
            className="input"
            value={formData.priorita}
            onChange={(e) => setFormData({...formData, priorita: e.target.value})}
          >
            <option value="BASSA">BASSA</option>
            <option value="NORMALE">NORMALE</option>
            <option value="ALTA">ALTA</option>
            <option value="URGENTE">URGENTE</option>
          </select>
        </div>
        
        <div>
          <label className="label">Stato</label>
          <select
            className="input"
            value={formData.stato}
            onChange={(e) => setFormData({...formData, stato: e.target.value})}
          >
            <option value="DA_CONTATTARE">Da Contattare</option>
            <option value="CONTATTATO">Contattato</option>
            <option value="IN_TRATTATIVA">In Trattativa</option>
            <option value="CHIUSO">Chiuso</option>
          </select>
        </div>
        
        <div className="md:col-span-2">
          <label className="label">Note</label>
          <textarea
            className="input min-h-[100px]"
            value={formData.note}
            onChange={(e) => setFormData({...formData, note: e.target.value})}
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
