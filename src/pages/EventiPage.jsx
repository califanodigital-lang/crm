import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAllEventi, createEvento, updateEvento, deleteEvento } from '../services/eventoService'
import { getAllCircuiti } from '../services/circuitiService'
import { getPartecipazioniByEvento, addPartecipazione, updatePartecipazione, deletePartecipazione } from '../services/partecipazioneService'
import { getAllCreators } from '../services/creatorService'
import { upsertFieraFromEvento } from '../services/fieraDbService'
import { Calendar, MapPin, Plus, Edit, Trash2, X, LayoutGrid, List } from 'lucide-react'
import { confirm } from '../components/ConfirmModal'
import { formatDate } from '../utils/date'
import { ATTIVITA_EVENTO, TIPOLOGIE_EVENTO } from '../constants/constants'
import { toast } from '../components/Toast'

const EMPTY_PART_FORM = {
  creatorId: '',
  tipo: 'partecipante',
  rimborsoSpese: '',
  dataInizioPartecipazione: '',
  dataFinePartecipazione: '',
  panel: false, workshop: false, masterGdr: false, giochiTavolo: false,
  giudiceCosplay: false, firmacopie: false, palco: false, moderazione: false,
  accredito: false, meetGreet: false, hostPalco: false, hostGaraCosplay: false,
  fee: '', pagato: false, pagato_agency: false,
}

const EMPTY_EVENTO_FORM = {
  nome: '',
  tipo: '',
  circuitoId: '',
  dataInizio: '',
  dataFine: '',
  location: '',
  citta: '',
  descrizione: '',
  link: '',
  note: '',
}

export default function EventiPage() {
  const { userProfile } = useAuth()
  const isAdmin = userProfile?.role === 'ADMIN'

  const [eventi, setEventi] = useState([])
  const [creators, setCreators] = useState([])
  const [circuiti, setCircuiti] = useState([])
  const [view, setView] = useState('list') // list | add | edit | detail
  const [selectedEvento, setSelectedEvento] = useState(null)
  const [partecipazioni, setPartecipazioni] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('table') // table | cards
  const [eventoForm, setEventoForm] = useState(EMPTY_EVENTO_FORM)
  const [partForm, setPartForm] = useState(EMPTY_PART_FORM)
  const [editingPart, setEditingPart] = useState(null)

  const getCircuitoName = (circuitoId) =>
    circuiti.find(circuito => circuito.id === circuitoId)?.nome || '—'

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
    const [eventiRes, creatorsRes, circuitiRes] = await Promise.all([getAllEventi(), getAllCreators(), getAllCircuiti()])
    setEventi(eventiRes.data || [])
    setCreators(creatorsRes.data || [])
    setCircuiti(circuitiRes.data || [])
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
      await updateEvento(selectedEvento.id, {
        ...eventoForm,
        stato: selectedEvento.stato,
        fieraDbId: selectedEvento.fieraDbId || null,
        trattativaFieraId: selectedEvento.trattativaFieraId || null,
      })
    } else {
      await createEvento(eventoForm)
    }
    setEventoForm(EMPTY_EVENTO_FORM)
    setView('list')
    setSelectedEvento(null)
    await loadData()
    setLoading(false)
  }

  const handleDeleteEvento = async (id) => {
    const ok = await confirm('Questa azione è irreversibile.', { title: 'Eliminare evento?', confirmLabel: 'Elimina' })
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
    setPartForm({ ...EMPTY_PART_FORM })
    loadPartecipazioni(selectedEvento.id)
  }

  const handleDeletePartecipazione = async (id) => {
    const ok = await confirm('Questa azione è irreversibile.', { title: 'Rimuovere partecipazione?', confirmLabel: 'Elimina' })
    if (!ok) return
    await deletePartecipazione(id)
    loadPartecipazioni(selectedEvento.id)
  }

  const handleStartEditPart = (p) => setEditingPart({ ...p })
  const handleCancelEditPart = () => setEditingPart(null)
  const handleSaveEditPart = async () => {
    await updatePartecipazione(editingPart.id, editingPart)
    setEditingPart(null)
    loadPartecipazioni(selectedEvento.id)
  }

  const handleTogglePagamento = async (partecipazione, campo) => {
    const updated = { ...partecipazione, [campo]: !partecipazione[campo] }
    await updatePartecipazione(partecipazione.id, updated)
    loadPartecipazioni(selectedEvento.id)
  }

  const handleSwitchTipo = async (p) => {
    const newTipo = (p.tipo === 'proposto') ? 'partecipante' : 'proposto'
    await updatePartecipazione(p.id, { ...p, tipo: newTipo })
    loadPartecipazioni(selectedEvento.id)
  }

  const handleChiudiFiera = async () => {
    const partecipanti = partecipazioni.filter(p => (p.tipo || 'partecipante') === 'partecipante')
    const nonPagati = partecipanti.filter(p => !p.pagato)
    if (nonPagati.length > 0) {
      toast.error(`${nonPagati.length} creator non ancora pagati. Completa i pagamenti prima di chiudere.`)
      return
    }
    const ok = await confirm('La fiera verrà chiusa e aggiunta al DB Fiere con una data di ricontatto tra 6 mesi.', {
      title: 'Chiudi Fiera?',
      confirmLabel: 'Chiudi Fiera'
    })
    if (!ok) return

    const { data: updatedEvento, error } = await updateEvento(selectedEvento.id, { ...selectedEvento, stato: 'CHIUSA' })
    if (error) { toast.error('Errore nella chiusura'); return }

    const eventoToSync = updatedEvento || { ...selectedEvento, stato: 'CHIUSA' }
    const { data: syncedFiera } = await upsertFieraFromEvento(eventoToSync)

    setSelectedEvento(prev => prev ? { ...prev, stato: 'CHIUSA', fieraDbId: syncedFiera?.id || prev.fieraDbId } : prev)
    setEventi(prev => prev.map(e =>
      e.id === selectedEvento.id
        ? { ...e, stato: 'CHIUSA', fieraDbId: syncedFiera?.id || e.fieraDbId }
        : e
    ))
    toast.success('Fiera chiusa e aggiunta al DB Fiere!')
  }

  const handleCreatorSelect = (creatorId) => {
    setPartForm(prev => ({
      ...prev,
      creatorId,
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
                <label className="label">Tipologia evento</label>
                <select className="input" value={eventoForm.tipo} onChange={(e) => setEventoForm({...eventoForm, tipo: e.target.value})}>
                  <option value="">Seleziona tipologia...</option>
                  {TIPOLOGIE_EVENTO.map(tipologia => (
                    <option key={tipologia} value={tipologia}>{tipologia}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Circuito</label>
                <select className="input" value={eventoForm.circuitoId} onChange={(e) => setEventoForm({...eventoForm, circuitoId: e.target.value})}>
                  <option value="">Nessun circuito</option>
                  {circuiti.map(circuito => (
                    <option key={circuito.id} value={circuito.id}>{circuito.nome}</option>
                  ))}
                </select>
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
                <label className="label">Regione</label>
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
              <div className="md:col-span-2">
                <label className="label">Note</label>
                <textarea className="input" rows="3" value={eventoForm.note} onChange={(e) => setEventoForm({...eventoForm, note: e.target.value})} />
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button type="button" onClick={() => { setView('list'); setSelectedEvento(null) }} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
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
    const partecipanti = partecipazioni.filter(p => (p.tipo || 'partecipante') === 'partecipante')
    const proposti = partecipazioni.filter(p => p.tipo === 'proposto')
    const isClosed = selectedEvento.stato === 'CHIUSA'

    return (
      <>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{selectedEvento.nome}</h1>
            {isClosed && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-600">CHIUSA</span>
            )}
          </div>
          <div className="flex gap-2">
            {isAdmin && !isClosed && (
              <button onClick={handleChiudiFiera} className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 text-sm">
                Chiudi Fiera
              </button>
            )}
            <button onClick={() => { setView('list'); setSelectedEvento(null) }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info Evento */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedEvento.tipo && <p><span className="font-semibold">Tipo:</span> {selectedEvento.tipo}</p>}
            {selectedEvento.circuitoId && <p><span className="font-semibold">Circuito:</span> {getCircuitoName(selectedEvento.circuitoId)}</p>}
            {selectedEvento.dataInizio && <p><span className="font-semibold">Date:</span> {formatDate(selectedEvento.dataInizio)} - {formatDate(selectedEvento.dataFine) || '...'}</p>}
            {selectedEvento.location && <p><span className="font-semibold">Regione:</span> {selectedEvento.location}</p>}
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
                <a href={selectedEvento.link} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline break-all">{selectedEvento.link}</a>
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

        {/* Aggiungi Creator */}
        {isAdmin && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4">Aggiungi Creator</h2>
            <div className="flex gap-6 mb-4">
              {['partecipante', 'proposto'].map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="partTipo" value={t} checked={partForm.tipo === t}
                    onChange={() => setPartForm(p => ({ ...p, tipo: t }))} />
                  <span className="text-sm font-medium capitalize">{t}</span>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
              <select className="input" value={partForm.creatorId} onChange={(e) => handleCreatorSelect(e.target.value)} required>
                <option value="">Seleziona creator...</option>
                {creators.filter(c => !["4 Possibilità future","5 Perso"].includes(c.stato)).map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <div>
                <label className="label">Dal</label>
                <input type="date" className="input" value={partForm.dataInizioPartecipazione}
                  onChange={(e) => setPartForm({ ...partForm, dataInizioPartecipazione: e.target.value })} />
              </div>
              <div>
                <label className="label">Al</label>
                <input type="date" className="input" value={partForm.dataFinePartecipazione}
                  onChange={(e) => setPartForm({ ...partForm, dataFinePartecipazione: e.target.value })} />
              </div>
              <div>
                <label className="label">Fee €</label>
                <input type="number" step="0.01" className="input bg-gray-50" value={partForm.fee}
                  onChange={(e) => setPartForm({ ...partForm, fee: e.target.value })}
                  placeholder="Auto-compilato da creator" />
              </div>
              <div>
                <label className="label">Rimborso Spese</label>
                <input className="input" value={partForm.rimborsoSpese}
                  onChange={(e) => setPartForm({ ...partForm, rimborsoSpese: e.target.value })}
                  placeholder="es. 150€ hotel" />
              </div>
              <button onClick={handleAddPartecipazione} className="px-4 py-2 bg-yellow-400 rounded-lg font-semibold hover:bg-yellow-500">
                Aggiungi
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ATTIVITA_EVENTO.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2">
                  <input type="checkbox" checked={partForm[key]}
                    onChange={(e) => setPartForm({ ...partForm, [key]: e.target.checked })} />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Creator Partecipanti */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Creator Partecipanti ({partecipanti.length})</h2>
            <div className="flex gap-1 border rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('table')}
                className={`p-1.5 transition-colors ${viewMode === 'table' ? 'bg-yellow-400 text-gray-900' : 'hover:bg-gray-100 text-gray-500'}`}
                title="Vista tabella">
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('cards')}
                className={`p-1.5 transition-colors ${viewMode === 'cards' ? 'bg-yellow-400 text-gray-900' : 'hover:bg-gray-100 text-gray-500'}`}
                title="Vista schede">
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {viewMode === 'table' ? (
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
                {partecipanti.map(p => (
                  <tr key={p.id} className="border-b">
                    <td className="py-2 font-medium">{p.creatorNome}</td>
                    <td className="py-2 text-sm">
                      {ATTIVITA_EVENTO.map(({ key, label }) => p[key] && label).filter(Boolean).join(', ') || '-'}
                    </td>
                    <td className="py-2 text-sm">
                      {formatDate(p.dataInizioPartecipazione) || formatDate(p.dataFinePartecipazione)
                        ? `${formatDate(p.dataInizioPartecipazione) || '—'} ${formatDate(p.dataFinePartecipazione) ? `→ ${formatDate(p.dataFinePartecipazione)}` : ''}`
                        : 'Tutto evento'}
                    </td>
                    <td className="py-2 text-right">€{p.fee || 0}</td>
                    <td className="py-2 text-center">
                      <button onClick={() => handleTogglePagamento(p, 'pagato')}
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${p.pagato ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                        {p.pagato ? '✓ Sì' : '✗ No'}
                      </button>
                    </td>
                    <td className="py-2 text-center">
                      <button onClick={() => handleTogglePagamento(p, 'pagato_agency')}
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${p.pagato_agency ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                        {p.pagato_agency ? '✓ Sì' : '✗ No'}
                      </button>
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => handleSwitchTipo(p)} title="Sposta a Proposti"
                          className="text-xs px-1.5 py-0.5 rounded border border-gray-200 hover:bg-gray-50 text-gray-500">
                          → Prop.
                        </button>
                        <button onClick={() => handleStartEditPart(p)} className="text-yellow-600 hover:text-yellow-800">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeletePartecipazione(p.id)} className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {partecipanti.length === 0 && (
                  <tr><td colSpan={7} className="py-4 text-center text-gray-400 text-sm">Nessun creator partecipante</td></tr>
                )}
              </tbody>
            </table>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partecipanti.map(p => (
                <div key={p.id} className="border rounded-xl p-4 bg-gray-50 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{p.creatorNome}</h4>
                    <div className="flex gap-1">
                      <button onClick={() => handleSwitchTipo(p)} title="Sposta a Proposti"
                        className="text-xs px-1.5 py-0.5 rounded border border-gray-200 hover:bg-white text-gray-500">
                        → Prop.
                      </button>
                      <button onClick={() => handleStartEditPart(p)} className="text-yellow-600 hover:text-yellow-800">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeletePartecipazione(p.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {(() => {
                    const attivita = ATTIVITA_EVENTO.filter(({ key }) => p[key]).map(({ label }) => label)
                    return attivita.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {attivita.map(a => (
                          <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">{a}</span>
                        ))}
                      </div>
                    ) : null
                  })()}
                  <div className="text-sm text-gray-600 mb-3 space-y-0.5">
                    {p.fee ? <div><span className="font-medium">Fee:</span> €{p.fee}</div> : null}
                    {p.rimborsoSpese ? <div><span className="font-medium">Rimborso:</span> {p.rimborsoSpese}</div> : null}
                    {(formatDate(p.dataInizioPartecipazione) || formatDate(p.dataFinePartecipazione)) && (
                      <div className="text-xs text-gray-400">
                        {formatDate(p.dataInizioPartecipazione) || '—'}{formatDate(p.dataFinePartecipazione) ? ` → ${formatDate(p.dataFinePartecipazione)}` : ''}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleTogglePagamento(p, 'pagato')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${p.pagato ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                      {p.pagato ? '✓ Creator Pagato' : '✗ Creator'}
                    </button>
                    <button onClick={() => handleTogglePagamento(p, 'pagato_agency')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${p.pagato_agency ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                      {p.pagato_agency ? '✓ Agency Pagata' : '✗ Agency'}
                    </button>
                  </div>
                </div>
              ))}
              {partecipanti.length === 0 && (
                <p className="col-span-full text-gray-400 text-sm text-center py-4">Nessun creator partecipante</p>
              )}
            </div>
          )}
        </div>

        {/* Creator Proposti */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Creator Proposti ({proposti.length})</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Creator</th>
                <th className="text-left py-2">Attività</th>
                <th className="text-right py-2">Fee</th>
                <th className="text-right py-2">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {proposti.map(p => (
                <tr key={p.id} className="border-b">
                  <td className="py-2 font-medium">{p.creatorNome}</td>
                  <td className="py-2 text-sm">
                    {ATTIVITA_EVENTO.map(({ key, label }) => p[key] && label).filter(Boolean).join(', ') || '-'}
                  </td>
                  <td className="py-2 text-right">€{p.fee || 0}</td>
                  <td className="py-2 text-right">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => handleSwitchTipo(p)} title="Sposta a Partecipanti"
                        className="text-xs px-2 py-0.5 rounded border border-gray-200 hover:bg-yellow-50 text-gray-600">
                        → Part.
                      </button>
                      <button onClick={() => handleStartEditPart(p)} className="text-yellow-600 hover:text-yellow-800">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeletePartecipazione(p.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {proposti.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-center text-gray-400 text-sm">Nessun creator proposto</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal modifica partecipazione */}
        {editingPart && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Modifica — {editingPart.creatorNome}</h3>
              <div className="flex gap-6 mb-4">
                {['partecipante', 'proposto'].map(t => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="editTipo" value={t}
                      checked={(editingPart.tipo || 'partecipante') === t}
                      onChange={() => setEditingPart(p => ({ ...p, tipo: t }))} />
                    <span className="text-sm font-medium capitalize">{t}</span>
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="label">Dal</label>
                  <input type="date" className="input" value={editingPart.dataInizioPartecipazione || ''}
                    onChange={(e) => setEditingPart(p => ({ ...p, dataInizioPartecipazione: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Al</label>
                  <input type="date" className="input" value={editingPart.dataFinePartecipazione || ''}
                    onChange={(e) => setEditingPart(p => ({ ...p, dataFinePartecipazione: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Fee €</label>
                  <input type="number" step="0.01" className="input" value={editingPart.fee || ''}
                    onChange={(e) => setEditingPart(p => ({ ...p, fee: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Rimborso Spese</label>
                  <input className="input" value={editingPart.rimborsoSpese || ''}
                    onChange={(e) => setEditingPart(p => ({ ...p, rimborsoSpese: e.target.value }))}
                    placeholder="es. 150€ hotel" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {ATTIVITA_EVENTO.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2">
                    <input type="checkbox" checked={!!editingPart[key]}
                      onChange={(e) => setEditingPart(p => ({ ...p, [key]: e.target.checked }))} />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-4 mb-4 pt-2 border-t">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!editingPart.pagato}
                    onChange={(e) => setEditingPart(p => ({ ...p, pagato: e.target.checked }))} />
                  Pagato Creator
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!editingPart.pagato_agency}
                    onChange={(e) => setEditingPart(p => ({ ...p, pagato_agency: e.target.checked }))} />
                  Pagato Agency
                </label>
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={handleCancelEditPart}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Annulla</button>
                <button onClick={handleSaveEditPart}
                  className="px-4 py-2 bg-yellow-400 rounded-lg font-semibold text-sm hover:bg-yellow-500">Salva</button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // LISTA EVENTI
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Fiere & Eventi</h1>
        <button
          onClick={() => {
            setSelectedEvento(null)
            setEventoForm(EMPTY_EVENTO_FORM)
            setView('add')
          }}
          className="flex items-center gap-2 bg-yellow-400 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500">
          <Plus className="w-5 h-5" /> Nuovo Evento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventi.map(evento => (
          <div
            key={evento.id}
            className={`card hover:shadow-lg transition-shadow cursor-pointer ${evento.stato === 'CHIUSA' ? 'opacity-60' : ''}`}
            onClick={() => handleViewDetail(evento)}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-gray-900">{evento.nome}</h3>
              {evento.stato === 'CHIUSA' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 font-semibold">CHIUSA</span>
              )}
            </div>
            {evento.tipo && <p className="text-sm text-gray-600 mb-2">{evento.tipo}</p>}
            {evento.circuitoId && <p className="text-xs text-gray-400 mb-2">{getCircuitoName(evento.circuitoId)}</p>}
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
            <div className="flex gap-2 pt-3 border-t">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedEvento(evento)
                  setEventoForm({
                    nome: evento.nome || '', tipo: evento.tipo || '',
                    circuitoId: evento.circuitoId || '',
                    dataInizio: evento.dataInizio || '', dataFine: evento.dataFine || '',
                    location: evento.location || '', citta: evento.citta || '',
                    descrizione: evento.descrizione || '', link: evento.link || '', note: evento.note || ''
                  })
                  setView('edit')
                }}
                className="flex-1 text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded">
                <Edit className="w-3 h-3 inline mr-1" /> Modifica
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteEvento(evento.id) }}
                className="text-sm px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
