import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAllEventi, createEvento, updateEvento, deleteEvento } from '../services/eventoService'
import { getPartecipazioniByEvento, addPartecipazione, deletePartecipazione } from '../services/partecipazioneService'
import { getAllCreators } from '../services/creatorService'
import { Calendar, MapPin, Plus, Edit, Trash2, Users, X } from 'lucide-react'

export default function EventiPage() {
  const { userProfile } = useAuth()
  const [eventi, setEventi] = useState([])
  const [creators, setCreators] = useState([])
  const [view, setView] = useState('list') // list | add | edit | detail
  const [selectedEvento, setSelectedEvento] = useState(null)
  const [partecipazioni, setPartecipazioni] = useState([])
  const [loading, setLoading] = useState(true)
  const [eventoForm, setEventoForm] = useState({
    nome: '', tipo: '', dataInizio: '', dataFine: '', location: '', citta: '', descrizione: '', link: ''
  })
  const [partForm, setPartForm] = useState({
    creatorId: '', tipoContratto: '', panel: false, workshop: false, masterGdr: false,
    giochiTavolo: false, giudiceCosplay: false, firmacopie: false, palco: false, 
    moderazione: false, accredito: false, fee: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [eventiRes, creatorsRes] = await Promise.all([
      getAllEventi(),
      getAllCreators()
    ])
    setEventi(eventiRes.data || [])
    setCreators(creatorsRes.data || [])
    setLoading(false)
  }

  const loadPartecipazioni = async (eventoId) => {
    const { data } = await getPartecipazioniByEvento(eventoId)
    setPartecipazioni(data || [])
  }

  const handleSaveEvento = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    if (selectedEvento) {
      await updateEvento(selectedEvento.id, eventoForm)
    } else {
      await createEvento(eventoForm)
    }
    
    setEventoForm({ nome: '', tipo: '', dataInizio: '', dataFine: '', location: '', citta: '', descrizione: '', link: '' })
    setView('list')
    setSelectedEvento(null)
    await loadData()
    setLoading(false)
  }

  const handleDeleteEvento = async (id) => {
    if (!confirm('Eliminare evento?')) return
    await deleteEvento(id)
    loadData()
  }

  const handleViewDetail = async (evento) => {
    setSelectedEvento(evento)
    await loadPartecipazioni(evento.id)
    setView('detail')
  }

  const handleAddPartecipazione = async () => {
    if (!partForm.creatorId) return
    await addPartecipazione({ ...partForm, eventoId: selectedEvento.id })
    setPartForm({
      creatorId: '', tipoContratto: '', panel: false, workshop: false, masterGdr: false,
      giochiTavolo: false, giudiceCosplay: false, firmacopie: false, palco: false, 
      moderazione: false, accredito: false, fee: ''
    })
    loadPartecipazioni(selectedEvento.id)
  }

  const handleDeletePartecipazione = async (id) => {
    if (!confirm('Rimuovere partecipazione?')) return
    await deletePartecipazione(id)
    loadPartecipazioni(selectedEvento.id)
  }

  if (loading && view === 'list') {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div></div>
  }

  // FORM ADD/EDIT
  if (view === 'add' || view === 'edit') {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {view === 'add' ? 'Nuovo Evento' : 'Modifica Evento'}
        </h1>
        <div className="card">
          <form onSubmit={handleSaveEvento}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Nome Evento *</label>
                <input className="input" value={eventoForm.nome} onChange={(e) => setEventoForm({...eventoForm, nome: e.target.value})} required />
              </div>
              <div>
                <label className="label">Tipo</label>
                <input className="input" value={eventoForm.tipo} onChange={(e) => setEventoForm({...eventoForm, tipo: e.target.value})} placeholder="Fiera, Convention..." />
              </div>
              <div>
                <label className="label">Data Inizio</label>
                <input type="date" className="input" value={eventoForm.dataInizio} onChange={(e) => setEventoForm({...eventoForm, dataInizio: e.target.value})} />
              </div>
              <div>
                <label className="label">Data Fine</label>
                <input type="date" className="input" value={eventoForm.dataFine} onChange={(e) => setEventoForm({...eventoForm, dataFine: e.target.value})} />
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input" value={eventoForm.location} onChange={(e) => setEventoForm({...eventoForm, location: e.target.value})} />
              </div>
              <div>
                <label className="label">Città</label>
                <input className="input" value={eventoForm.citta} onChange={(e) => setEventoForm({...eventoForm, citta: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Descrizione</label>
                <textarea className="input" rows="3" value={eventoForm.descrizione} onChange={(e) => setEventoForm({...eventoForm, descrizione: e.target.value})} />
              </div>
              <div>
                <label className="label">Link</label>
                <input type="url" className="input" value={eventoForm.link} onChange={(e) => setEventoForm({...eventoForm, link: e.target.value})} />
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button type="button" onClick={() => { setView('list'); setSelectedEvento(null); }} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Annulla
              </button>
              <button type="submit" className="px-6 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500">
                {view === 'add' ? 'Crea' : 'Aggiorna'} Evento
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // DETTAGLIO EVENTO
  if (view === 'detail' && selectedEvento) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{selectedEvento.nome}</h1>
          <button onClick={() => setView('list')} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Evento */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedEvento.tipo && <p><span className="font-semibold">Tipo:</span> {selectedEvento.tipo}</p>}
            {selectedEvento.dataInizio && <p><span className="font-semibold">Date:</span> {selectedEvento.dataInizio} - {selectedEvento.dataFine || '...'}</p>}
            {selectedEvento.location && <p><span className="font-semibold">Location:</span> {selectedEvento.location}</p>}
            {selectedEvento.citta && <p><span className="font-semibold">Città:</span> {selectedEvento.citta}</p>}
          </div>
        </div>

        {/* Partecipazioni */}
        {userProfile?.role === 'ADMIN' && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4">Aggiungi Creator</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <select className="input" value={partForm.creatorId} onChange={(e) => setPartForm({...partForm, creatorId: e.target.value})}>
                <option value="">Seleziona...</option>
                {creators.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <input className="input" placeholder="Tipo Contratto" value={partForm.tipoContratto} onChange={(e) => setPartForm({...partForm, tipoContratto: e.target.value})} />
              <input type="number" className="input" placeholder="Fee €" value={partForm.fee} onChange={(e) => setPartForm({...partForm, fee: e.target.value})} />
              <button onClick={handleAddPartecipazione} className="px-4 py-2 bg-yellow-400 rounded-lg font-semibold hover:bg-yellow-500">Aggiungi</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['panel', 'workshop', 'masterGdr', 'giochiTavolo', 'giudiceCosplay', 'firmacopie', 'palco', 'moderazione', 'accredito'].map(key => (
                <label key={key} className="flex items-center gap-2">
                  <input type="checkbox" checked={partForm[key]} onChange={(e) => setPartForm({...partForm, [key]: e.target.checked})} />
                  <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Lista Partecipanti */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Creator Partecipanti ({partecipazioni.length})</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Creator</th>
                <th className="text-left py-2">Attività</th>
                <th className="text-right py-2">Fee</th>
                {userProfile?.role === 'ADMIN' && <th className="text-right py-2">Azioni</th>}
              </tr>
            </thead>
            <tbody>
              {partecipazioni.map(p => (
                <tr key={p.id} className="border-b">
                  <td className="py-2 font-medium">{p.creatorNome}</td>
                  <td className="py-2 text-sm">
                    {[p.panel && 'Panel', p.workshop && 'Workshop', p.masterGdr && 'Master GDR', p.giochiTavolo && 'Giochi', 
                      p.giudiceCosplay && 'Giudice', p.firmacopie && 'Firmacopie', p.palco && 'Palco', p.moderazione && 'Moderazione']
                      .filter(Boolean).join(', ') || '-'}
                  </td>
                  <td className="py-2 text-right">€{p.fee || 0}</td>
                  {userProfile?.role === 'ADMIN' && (
                    <td className="py-2 text-right">
                      <button onClick={() => handleDeletePartecipazione(p.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // LISTA EVENTI
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Fiere & Eventi</h1>
        {userProfile?.role === 'ADMIN' && (
          <button onClick={() => { setView('add'); setEventoForm({ nome: '', tipo: '', dataInizio: '', dataFine: '', location: '', citta: '', descrizione: '', link: '' }); }} className="flex items-center gap-2 bg-yellow-400 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500">
            <Plus className="w-5 h-5" />
            Nuovo Evento
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventi.map(evento => (
          <div key={evento.id} className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewDetail(evento)}>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{evento.nome}</h3>
            {evento.tipo && <p className="text-sm text-gray-600 mb-2">{evento.tipo}</p>}
            {evento.dataInizio && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Calendar className="w-4 h-4" />
                {evento.dataInizio} {evento.dataFine && `- ${evento.dataFine}`}
              </div>
            )}
            {evento.citta && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <MapPin className="w-4 h-4" />
                {evento.citta}
              </div>
            )}
            {userProfile?.role === 'ADMIN' && (
              <div className="flex gap-2 pt-3 border-t">
                <button onClick={(e) => { e.stopPropagation(); setSelectedEvento(evento); setEventoForm(evento); setView('edit'); }} className="flex-1 text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded">
                  <Edit className="w-3 h-3 inline mr-1" />
                  Modifica
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteEvento(evento.id); }} className="text-sm px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
