import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAllUsers, updateUserProfile } from '../services/userService'
import { supabase } from '../lib/supabase'
import { Shield, User, Plus, X, Edit } from 'lucide-react'
import { toast } from '../components/Toast'

const DEFAULT_FORM = {
  email: '',
  password: '',
  nomeCompleto: '',
  agenteNome: '',
  role: 'AGENT',
  feeRicerca: 5,
  feeContatto: 10,
  feeChiusura: 15,
  riceveFee: true,
}

export default function UsersPage() {
  const { userProfile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(DEFAULT_FORM)
  const [editingUser, setEditingUser] = useState(null)

  useEffect(() => {
    if (userProfile?.role === 'ADMIN') {
      loadUsers()
    }
  }, [userProfile])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await getAllUsers()

      if (error) {
        toast.error('Errore caricamento utenti: ' + error.message)
        setUsers([])
        return
      }

      setUsers(data || [])
    } catch (err) {
      toast.error('Errore caricamento utenti: ' + err.message)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData(DEFAULT_FORM)
    setEditingUser(null)
    setShowForm(false)
  }

  const handleEditUser = (user) => {
    setFormData({
      email: user.email || '',
      password: '',
      nomeCompleto: user.nomeCompleto || '',
      agenteNome: user.agenteNome || '',
      role: user.role || 'AGENT',
      feeRicerca: user.feeRicerca ?? 5,
      feeContatto: user.feeContatto ?? 10,
      feeChiusura: user.feeChiusura ?? 15,
      riceveFee: user.riceveFee !== false,
    })
    setEditingUser(user)
    setShowForm(true)
  }

  const createUserViaEdgeFunction = async () => {
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: {
        email: formData.email,
        password: formData.password,
        nomeCompleto: formData.nomeCompleto,
        agenteNome: formData.agenteNome,
        role: formData.role,
        feeRicerca: formData.feeRicerca,
        feeContatto: formData.feeContatto,
        feeChiusura: formData.feeChiusura,
        riceveFee: formData.riceveFee
      }
    })

    if (error) {
      throw new Error(error.message || 'Errore chiamata funzione')
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Errore creazione utente')
    }

    return data
  }

  const handleSaveUser = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)

      if (editingUser) {
        const { error } = await supabase
          .from('user_profiles')
          .update({
            nome_completo: formData.nomeCompleto,
            agente_nome: formData.agenteNome,
            role: formData.role,
            fee_ricerca: formData.feeRicerca,
            fee_contatto: formData.feeContatto,
            fee_chiusura: formData.feeChiusura,
            riceve_fee: formData.riceveFee,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUser.id)

        if (error) {
          throw error
        }

        toast.success('Utente aggiornato con successo')
      } else {
        if (!formData.email || !formData.password) {
          throw new Error('Email e password sono obbligatorie')
        }

        await createUserViaEdgeFunction()
        toast.success('Utente creato con successo')
      }

      resetForm()
      await loadUsers()
    } catch (err) {
      toast.error(err.message || 'Errore salvataggio utente')
    } finally {
      setSaving(false)
    }
  }

  const toggleAttivo = async (userId, currentStatus) => {
    try {
      const { error } = await updateUserProfile(userId, { attivo: !currentStatus })
      if (error) throw error

      toast.success(!currentStatus ? 'Utente attivato' : 'Utente disattivato')
      await loadUsers()
    } catch (err) {
      toast.error('Errore aggiornamento stato: ' + err.message)
    }
  }

  const changeRole = async (userId, newRole) => {
    try {
      const { error } = await updateUserProfile(userId, { role: newRole })
      if (error) throw error

      toast.success('Ruolo aggiornato')
      await loadUsers()
    } catch (err) {
      toast.error('Errore aggiornamento ruolo: ' + err.message)
    }
  }

  if (userProfile?.role !== 'ADMIN') {
    return <div className="card"><p>Accesso negato</p></div>
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestione Utenti</h1>
        <button
          onClick={() => {
            if (showForm) {
              resetForm()
            } else {
              setFormData(DEFAULT_FORM)
              setEditingUser(null)
              setShowForm(true)
            }
          }}
          className="flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? 'Annulla' : 'Nuovo Utente'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingUser ? 'Modifica Utente' : 'Crea Nuovo Utente'}
          </h2>

          <form onSubmit={handleSaveUser}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Email {!editingUser && '*'}</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required={!editingUser}
                  disabled={!!editingUser}
                />
                {editingUser && (
                  <p className="text-xs text-gray-500 mt-1">Email non modificabile da questa schermata</p>
                )}
              </div>

              {!editingUser && (
                <div>
                  <label className="label">Password *</label>
                  <input
                    type="password"
                    className="input"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              )}

              <div>
                <label className="label">Nome Completo *</label>
                <input
                  className="input"
                  value={formData.nomeCompleto}
                  onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Nome Agente *</label>
                <input
                  className="input"
                  value={formData.agenteNome}
                  onChange={(e) => setFormData({ ...formData, agenteNome: e.target.value })}
                  required
                  placeholder="Es. Mario, Luca..."
                />
              </div>

              <div>
                <label className="label">Ruolo *</label>
                <select
                  className="input"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="AGENT">Agent</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700">Commissioni</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-gray-600">Riceve fee</span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={formData.riceveFee}
                  onChange={(e) => setFormData({ ...formData, riceveFee: e.target.checked })}
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${formData.riceveFee ? 'bg-yellow-400' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.riceveFee ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </div>
            </label>
          </div>
          {formData.riceveFee && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">% Ricerca Brand</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      className="input"
                      value={formData.feeRicerca}
                      onChange={(e) => setFormData({ ...formData, feeRicerca: parseFloat(e.target.value || 0) })}
                    />
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                </div>

                <div>
                  <label className="label">% Contatto</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      className="input"
                      value={formData.feeContatto}
                      onChange={(e) => setFormData({ ...formData, feeContatto: parseFloat(e.target.value || 0) })}
                    />
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                </div>

                <div>
                  <label className="label">% Chiusura</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      className="input"
                      value={formData.feeChiusura}
                      onChange={(e) => setFormData({ ...formData, feeChiusura: parseFloat(e.target.value || 0) })}
                    />
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                </div>
              </div>
              </div>
             )}
            </div>

            {editingUser && (
              <p className="text-xs text-gray-500 mt-3">
                Cambio password non gestito da questa pagina. Va fatto con funzione dedicata o reset password.
              </p>
            )}

            <div className="mt-4 flex gap-3 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500 disabled:opacity-50"
              >
                {saving ? 'Salvataggio...' : editingUser ? 'Aggiorna Utente' : 'Crea Utente'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4">Nome</th>
              <th className="text-left py-3 px-4">Nome Agente</th>
              <th className="text-left py-3 px-4">Ruolo</th>
              <th className="text-left py-3 px-4">Stato</th>
              <th className="text-left py-3 px-4">Fee</th>
              <th className="text-right py-3 px-4">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium">{u.nomeCompleto}</td>
                <td className="py-3 px-4">{u.agenteNome}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      u.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {u.role === 'ADMIN'
                      ? <Shield className="w-3 h-3 inline mr-1" />
                      : <User className="w-3 h-3 inline mr-1" />}
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      u.attivo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {u.attivo ? 'Attivo' : 'Disattivo'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {u.riceveFee !== false ? (
                    <span className="text-xs text-gray-600">
                      {u.feeRicerca ?? 5}% / {u.feeContatto ?? 10}% / {u.feeChiusura ?? 15}%
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Nessuna fee</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => handleEditUser(u)}
                    className="text-sm px-3 py-1 rounded bg-yellow-100 text-yellow-700 mr-2 hover:bg-yellow-200"
                  >
                    <Edit className="w-3 h-3 inline mr-1" />
                    Modifica
                  </button>

                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="text-sm border rounded px-2 py-1 mr-2"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="AGENT">Agent</option>
                  </select>

                  <button
                    onClick={() => toggleAttivo(u.id, u.attivo)}
                    className={`text-sm px-3 py-1 rounded ${
                      u.attivo ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {u.attivo ? 'Disattiva' : 'Attiva'}
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