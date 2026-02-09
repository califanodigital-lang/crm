import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAllUsers, updateUserProfile } from '../services/userService'
import { supabase } from '../lib/supabase'
import { Shield, User, Plus, X } from 'lucide-react'

export default function UsersPage() {
  const { userProfile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nomeCompleto: '',
    agenteNome: '',
    role: 'AGENT'
  })

  useEffect(() => {
    if (userProfile?.role === 'ADMIN') loadUsers()
  }, [userProfile])

  const loadUsers = async () => {
    const { data } = await getAllUsers()
    setUsers(data || [])
    setLoading(false)
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setLoading(true)

    // 1. Signup normale (crea utente + profilo manualmente)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          nome_completo: formData.nomeCompleto,
          agente_nome: formData.agenteNome
        }
      }
    })

    if (authError) {
      alert('Errore creazione utente: ' + authError.message)
      setLoading(false)
      return
    }

    // 2. Crea profilo in user_profiles (se signup istantaneo)
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          id: authData.user.id,
          role: formData.role,
          nome_completo: formData.nomeCompleto,
          agente_nome: formData.agenteNome,
          attivo: true
        }])

      if (profileError) {
        alert('Errore creazione profilo: ' + profileError.message)
        setLoading(false)
        return
      }
    }

    alert('Utente creato! Controlla email per conferma.')
    setFormData({ email: '', password: '', nomeCompleto: '', agenteNome: '', role: 'AGENT' })
    setShowForm(false)
    loadUsers()
  }

  const toggleAttivo = async (userId, currentStatus) => {
    await updateUserProfile(userId, { attivo: !currentStatus })
    loadUsers()
  }

  const changeRole = async (userId, newRole) => {
    await updateUserProfile(userId, { role: newRole })
    loadUsers()
  }

  if (userProfile?.role !== 'ADMIN') {
    return <div className="card"><p>Accesso negato</p></div>
  }

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div></div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestione Utenti</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? 'Annulla' : 'Nuovo Utente'}
        </button>
      </div>

      {/* Form Nuovo Utente */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Crea Nuovo Utente</h2>
          <form onSubmit={handleCreateUser}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="label">Password *</label>
                <input
                  type="password"
                  className="input"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="label">Nome Completo *</label>
                <input
                  className="input"
                  value={formData.nomeCompleto}
                  onChange={(e) => setFormData({...formData, nomeCompleto: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="label">Nome Agente *</label>
                <input
                  className="input"
                  value={formData.agenteNome}
                  onChange={(e) => setFormData({...formData, agenteNome: e.target.value})}
                  required
                  placeholder="Es. Mario, Luca..."
                />
              </div>
              <div>
                <label className="label">Ruolo *</label>
                <select
                  className="input"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="AGENT">Agent</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500"
              >
                Crea Utente
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Tabella Utenti */}
      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4">Nome</th>
              <th className="text-left py-3 px-4">Nome Agente</th>
              <th className="text-left py-3 px-4">Ruolo</th>
              <th className="text-left py-3 px-4">Stato</th>
              <th className="text-right py-3 px-4">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium">{u.nomeCompleto}</td>
                <td className="py-3 px-4">{u.agenteNome}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    u.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {u.role === 'ADMIN' ? <Shield className="w-3 h-3 inline mr-1" /> : <User className="w-3 h-3 inline mr-1" />}
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    u.attivo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {u.attivo ? 'Attivo' : 'Disattivo'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
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