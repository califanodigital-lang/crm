import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import {
  getAgendaItems,
  getCreatorAvailabilityForEventDay,
  groupAgendaItemsByDate,
  buildMonthMatrix,
  itemTypeColor,
  itemTypeLabel,
  isToday
} from '../services/agendaService'

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1)
const dateKey = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
const sameMonth = (a, b) => a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()

export default function AgendaPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [availability, setAvailability] = useState({})
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()))

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const data = await getAgendaItems()
      setItems(data)

      const eventItems = data.filter(i => i.tipo === 'EVENTO')
      const map = {}

      for (const ev of eventItems) {
        map[ev.id] = await getCreatorAvailabilityForEventDay(ev.eventoId, ev.date)
      }

      setAvailability(map)
      setLoading(false)
    }

    load()
  }, [])

  const grouped = useMemo(() => groupAgendaItemsByDate(items), [items])
  const matrix = useMemo(() => buildMonthMatrix(currentMonth), [currentMonth])

  const selectedItems = grouped[selectedDate] || []
  const selectedByType = selectedItems.reduce((acc, item) => {
    if (!acc[item.tipo]) acc[item.tipo] = []
    acc[item.tipo].push(item)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="w-7 h-7 text-yellow-500" />
        <h1 className="text-3xl font-bold text-gray-900">Agenda Operativa</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <h2 className="text-lg font-bold text-gray-900">
              {currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
            </h2>

            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
              <div key={day} className="text-xs font-bold text-gray-400 uppercase px-2 py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {matrix.map((week, idx) => (
              <div key={idx} className="grid grid-cols-7 gap-2">
                {week.map(day => {
                  const key = dateKey(day)
                  const dayItems = grouped[key] || []
                  const isSelected = key === selectedDate
                  const isCurrentMonth = sameMonth(day, currentMonth)

                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDate(key)}
                      className={`min-h-[96px] rounded-2xl border p-2 text-left transition-all ${
                        isSelected
                          ? 'border-yellow-400 ring-2 ring-yellow-200 bg-yellow-50'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-semibold ${isToday(day) ? 'text-yellow-600' : 'text-gray-900'}`}>
                          {day.getDate()}
                        </span>
                        {dayItems.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            {dayItems.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {dayItems.slice(0, 3).map(item => (
                          <div
                            key={item.id}
                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold truncate ${itemTypeColor(item.tipo)}`}
                          >
                            {itemTypeLabel(item.tipo)}
                          </div>
                        ))}
                        {dayItems.length > 3 && (
                          <div className="text-[10px] text-gray-400 px-1">+{dayItems.length - 3} altri</div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Dettaglio giorno</h2>
          <p className="text-sm text-gray-500 mb-4">{selectedDate}</p>

          {selectedItems.length === 0 ? (
            <p className="text-sm text-gray-400">Nessun impegno in questa data.</p>
          ) : (
            <div className="space-y-5">
              {Object.entries(selectedByType).map(([tipo, typeItems]) => (
                <div key={tipo}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${itemTypeColor(tipo)}`}>
                      {itemTypeLabel(tipo)}
                    </span>
                    <span className="text-xs text-gray-400">{typeItems.length}</span>
                  </div>

                  <div className="space-y-3">
                    {typeItems.map(item => (
                      <div key={item.id} className="border border-gray-100 rounded-xl p-3">
                        <p className="font-semibold text-gray-900">{item.titolo}</p>

                        {item.brandNome && <p className="text-sm text-gray-500">{item.brandNome}</p>}
                        {item.creatorNome && <p className="text-sm text-gray-500">{item.creatorNome}</p>}

                        {item.citta && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-4 h-4" /> {item.citta}{item.location ? ` · ${item.location}` : ''}
                          </p>
                        )}

                        {item.descrizione && <p className="text-sm text-gray-700 mt-2">{item.descrizione}</p>}
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline break-all mt-2 block">
                            {item.link}
                          </a>
                        )}
                        {item.note && <p className="text-sm text-gray-500 mt-2 whitespace-pre-wrap">{item.note}</p>}

                        {item.tipo === 'PRESENZA_EVENTO' && (
                          <p className="text-xs text-gray-500 mt-2">
                            Presenza: {item.presenzaInizio || '—'} {item.presenzaFine ? `→ ${item.presenzaFine}` : ''}
                          </p>
                        )}

                        {item.tipo === 'EVENTO' && availability[item.id] && (
                          <div className="mt-4 space-y-3">
                            <div className="bg-blue-50 rounded-lg p-3">
                              <p className="text-sm font-semibold text-blue-700 mb-2">Assegnati quel giorno</p>
                              <div className="space-y-2">
                                {availability[item.id].assegnatiEvento.length === 0 && (
                                  <span className="text-sm text-gray-400">Nessuno</span>
                                )}
                                {availability[item.id].assegnatiEvento.map(c => (
                                  <div key={c.id} className="text-xs text-blue-700">
                                    <span className="font-semibold">{c.nome}</span> — {c.dal}{c.al && c.al !== c.dal ? ` → ${c.al}` : ''}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="bg-red-50 rounded-lg p-3">
                              <p className="text-sm font-semibold text-red-700 mb-2">Occupati quel giorno</p>
                              <div className="space-y-2">
                                {availability[item.id].occupati.length === 0 && <span className="text-sm text-gray-400">Nessuno</span>}
                                {availability[item.id].occupati.map(c => (
                                  <div key={c.id} className="text-xs text-red-700">
                                    <span className="font-semibold">{c.nome}</span> — {c.impegni.join(', ')}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <p className="text-xs text-gray-500">
                              Creator liberi quel giorno: {availability[item.id].liberiCount}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}