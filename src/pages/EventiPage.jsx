import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAllEventi, createEvento, updateEvento, deleteEvento } from '../services/eventoService'
import { getPartecipazioniByEvento, addPartecipazione, updatePartecipazione, deletePartecipazione } from '../services/partecipazioneService'
import { getAllCreators } from '../services/creatorService'
import { Calendar, MapPin, Plus, Edit, Trash2, Users, X } from 'lucide-react'
import { confirm } from '../components/ConfirmModal'
import {formatDate} from '../utils/date'

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
    creatorId: '',
    tipoContratto: '',
    dataInizioPartecipazione: '',
    dataFinePartecipazione: '',
    panel: false,
    workshop: false,
    masterGdr: false,
    giochiTavolo: false,
    giudiceCosplay: false,
    firmacopie: false,
    palco: false,
    moderazione: false,
    accredito: false,
    fee: '',
    pagato: false,
    pagato_agency: false,
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (view !== 'add' && view !== 'edit') return
    const handler = (e) => {
      if (e.key === 'Escape') { setView('list'); setSelectedEvento(null) }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [view])

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
    const ok = await confirm('Questa azione è irreversibile.', {
      title: 'Eliminare evento?',
      confirmLabel: 'Elimina'
    })
    if (!ok) return
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
      creatorId: '',
      tipoContratto: '',
      dataInizioPartecipazione: '',
      dataFinePartecipazione: '',
      panel: false,
      workshop: false,
      masterGdr: false,
      giochiTavolo: false,
      giudiceCosplay: false,
      firmacopie: false,
      palco: false,
      moderazione: false,
      accredito: false,
      fee: '',
      pagato: false,
      pagato_agency: false,
    })
    loadPartecipazioni(selectedEvento.id)
  }

  const handleDeletePartecipazione = async (id) => {
    const ok = await confirm('Questa azione è irreversibile.', {
      title: 'Rimuovere partecipazione?',
      confirmLabel: 'Elimina'
    })
    if (!ok) return
    await deletePartecipazione(id)
    loadPartecipazioni(selectedEvento.id)
  }

  const handleTogglePagamento = async (partecipazione, campo) => {
    const updated = { ...partecipazione, [campo]: !partecipazione[campo] }
    await updatePartecipazione(partecipazione.id, updated)
    loadPartecipazioni(selectedEvento.id)
  }

  const handleCreatorSelect = (creatorId) => {
    const selectedCreator = creators.find(c => c.id === creatorId)

    setPartForm(prev => ({
      ...prev,
      creatorId,
      fee: prev.fee,
      dataInizioPartecipazione: prev.dataInizioPartecipazione || selectedEvento?.dataInizio || '',
      dataFinePartecipazione: prev.dataFinePartecipazione || selectedEvento?.dataFine || selectedEvento?.dataInizio || ''
    }))
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
          <button onClick={() => { setView('list'); setSelectedEvento(null) }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Evento */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedEvento.tipo && <p><span className="font-semibold">Tipo:</span> {selectedEvento.tipo}</p>}
            {selectedEvento.dataInizio && <p><span className="font-semibold">Date:</span> {formatDate(selectedEvento.dataInizio)} - {formatDate(selectedEvento.dataFine) || '...'}</p>}
            {selectedEvento.location && <p><span className="font-semibold">Location:</span> {selectedEvento.location}</p>}
            {selectedEvento.citta && <p><span className="font-semibold">Città:</span> {selectedEvento.citta}</p>}
            {selectedEvento.descrizione && (
              <div className="mt-4">
                <p className="font-semibold mb-1">Descrizione</p>
                <p className="text-sm text-gray-700">{selectedEvento.descrizione}</p>
              </div>
            )}

            {selectedEvento.link && (
              <div className="mt-4">
                <p className="font-semibold mb-1">Link</p>
                <a
                  href={selectedEvento.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  {selectedEvento.link}
                </a>
              </div>
            )}

            {selectedEvento.note && (
              <div className="mt-4">
                <p className="font-semibold mb-1">Note</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedEvento.note}</p>
              </div>
            )}
          </div>
        </div>

        {/* Partecipazioni */}
        {userProfile?.role === 'ADMIN' && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4">Aggiungi Creator</h2>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
              <select
                className="input"
                value={partForm.creatorId}
                onChange={(e) => handleCreatorSelect(e.target.value)}  // <-- USA funzione
                required
              >
                <option value="">Seleziona creator...</option>
                {creators.filter(c => c.stato == "1 Sotto contratto").map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <input className="input" placeholder="Tipo Contratto" value={partForm.tipoContratto} onChange={(e) => setPartForm({...partForm, tipoContratto: e.target.value})} />
             
              <div>
                <label className="label">Dal</label>
                <input
                  type="date"
                  className="input"
                  value={partForm.dataInizioPartecipazione}
                  onChange={(e) => setPartForm({ ...partForm, dataInizioPartecipazione: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Al</label>
                <input
                  type="date"
                  className="input"
                  value={partForm.dataFinePartecipazione}
                  onChange={(e) => setPartForm({ ...partForm, dataFinePartecipazione: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Fee €</label>
                <input
                  type="number"
                  step="0.01"
                  className="input bg-gray-50"  // <-- Grigio = auto-compilato
                  value={partForm.fee}
                  onChange={(e) => setPartForm({...partForm, fee: e.target.value})}
                  placeholder="Auto-compilato da creator"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Fee standard del creator, modificabile
                </p>
              </div>
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
                <th className="text-left py-2">Presenza</th>
                <th className="text-right py-2">Fee</th>
                <th className="text-center py-2 text-xs">Pag. Creator</th>
                <th className="text-center py-2 text-xs">Pag. Agency</th>
                <th className="text-right py-2">Azioni</th>
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
                  <td className="py-2 text-sm">
                    {formatDate(p.dataInizioPartecipazione) || formatDate(p.dataFinePartecipazione)
                      ? `${formatDate(p.dataInizioPartecipazione) || '—'} ${formatDate(p.dataFinePartecipazione) ? `→ ${formatDate(p.dataFinePartecipazione)}` : ''}`
                      : 'Tutto evento'}
                  </td>
                  <td className="py-2 text-right">€{p.fee || 0}</td>
                  <td className="py-2 text-center">
                    <button
                      onClick={() => handleTogglePagamento(p, 'pagato')}
                      title={p.pagato ? 'Creator pagato' : 'Creator non pagato'}
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${p.pagato ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    >
                      {p.pagato ? '✓ Sì' : '✗ No'}
                    </button>
                  </td>
                  <td className="py-2 text-center">
                    <button
                      onClick={() => handleTogglePagamento(p, 'pagato_agency')}
                      title={p.pagato_agency ? 'Noi pagati' : 'Noi non pagati'}
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${p.pagato_agency ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    >
                      {p.pagato_agency ? '✓ Sì' : '✗ No'}
                    </button>
                  </td>
                  <td className="py-2 text-right">
                    <button onClick={() => handleDeletePartecipazione(p.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
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
        {(
          <button onClick={() => { setSelectedEvento(null); setEventoForm({ nome: '', tipo: '', dataInizio: '', dataFine: '', location: '', citta: '', descrizione: '', link: '' }); setView('add'); }} className="flex items-center gap-2 bg-yellow-400 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500">
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
                {formatDate(evento.dataInizio)} {formatDate(evento.dataFine) && `- ${formatDate(evento.dataFine)}`}
              </div>
            )}
            {evento.citta && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <MapPin className="w-4 h-4" />
                {evento.citta}
              </div>
            )}
            {(
              <div className="flex gap-2 pt-3 border-t">
                <button onClick={(e) => { e.stopPropagation(); setSelectedEvento(evento); setEventoForm({ nome: evento.nome || '', tipo: evento.tipo || '', dataInizio: evento.dataInizio || '', dataFine: evento.dataFine || '', location: evento.location || '', citta: evento.citta || '', descrizione: evento.descrizione || '', link: evento.link || '' }); setView('edit'); }} className="flex-1 text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded">
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
