import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { verifyMfaCode } from '../services/mfaService'
import MfaCodeInput from '../components/MfaCodeInput'

export default function MfaChallengePage() {
  const { mfaFactors, refreshAuth, signOut } = useAuth()
  const [factorId, setFactorId] = useState(mfaFactors[0]?.id || '')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const verify = async event => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await verifyMfaCode(factorId, code)
      await refreshAuth()
    } catch {
      setError('Verifica non riuscita. Inserisci un nuovo codice e riprova.')
      setCode('')
    } finally { setBusy(false) }
  }

  const exit = async () => {
    setBusy(true)
    const { error: logoutError } = await signOut()
    if (logoutError) { setError('Impossibile uscire. Riprova.'); setBusy(false) }
  }

  return <div className="brand-login min-h-screen flex items-center justify-center p-4">
    <div className="card w-full max-w-md">
      <img src="/c3-agency-logo.png" alt="C3 Agency" className="w-56 h-auto mx-auto mb-6" />
      <h1 className="text-xl font-bold mb-2">Verifica in due passaggi</h1>
      <p className="text-sm text-gray-500 mb-6">Apri la tua app di autenticazione e inserisci il codice per accedere al CRM.</p>
      {mfaFactors.length ? <form onSubmit={verify} className="space-y-4">
        {mfaFactors.length > 1 && <div><label htmlFor="mfa-factor" className="label">Dispositivo</label><select id="mfa-factor" className="input" disabled={busy} value={factorId} onChange={e => { setFactorId(e.target.value); setCode('') }}>{mfaFactors.map(f => <option key={f.id} value={f.id}>{f.friendly_name || 'App di autenticazione'}</option>)}</select></div>}
        <MfaCodeInput value={code} onChange={setCode} disabled={busy} />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button className="brand-login-button w-full rounded-xl py-3 disabled:opacity-50" disabled={busy || code.length !== 6}>{busy ? 'Verifica in corso...' : 'Verifica e accedi'}</button>
      </form> : <p role="alert" className="text-sm text-red-600">Questo account usa un secondo fattore non gestito dal CRM. Contatta l'amministratore.</p>}
      <p className="text-xs text-gray-500 mt-4">Se hai perso l'accesso all'app, contatta l'amministratore per recuperare l'account.</p>
      <button type="button" className="text-sm text-brand-blue mt-4 disabled:opacity-50" disabled={busy} onClick={exit}>Esci e torna al login</button>
    </div>
  </div>
}
