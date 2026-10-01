import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { enrollMfa, removeMfaFactor, verifyMfaCode } from '../services/mfaService'
import MfaCodeInput from '../components/MfaCodeInput'
import { confirm } from '../components/ConfirmModal'

export default function SecurityPage() {
  const { mfaFactors, refreshAuth } = useAuth()
  const [pending, setPending] = useState(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const start = async () => {
    if (busy) return
    setBusy(true); setError('')
    try { setPending(await enrollMfa()) }
    catch { setError('Impossibile avviare la configurazione. Riprova o contatta l\'amministratore.') }
    finally { setBusy(false) }
  }

  const enable = async event => {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try {
      await verifyMfaCode(pending.id, code)
      setPending(null); setCode('')
      await refreshAuth()
    } catch { setError('Verifica non riuscita. Inserisci un nuovo codice e riprova.'); setCode('') }
    finally { setBusy(false) }
  }

  const cancel = async () => {
    setBusy(true); setError('')
    try { await removeMfaFactor(pending.id); setPending(null); setCode('') }
    catch { setError('Impossibile annullare la configurazione. Riprova.') }
    finally { setBusy(false) }
  }

  const disable = async factor => {
    if (!await confirm('Rimuovere questa app di autenticazione? Se e l\'ultima, l\'account tornera a usare solo email e password.', { title: 'Rimuovi secondo fattore', confirmLabel: 'Rimuovi' })) return
    setBusy(true); setError('')
    try {
      await removeMfaFactor(factor.id)
      await refreshAuth()
    } catch { setError('Impossibile rimuovere il secondo fattore. Riprova.') }
    finally { setBusy(false) }
  }

  const qr = pending?.totp.qr_code
  const qrSource = qr?.startsWith('data:image/svg+xml;utf-8,') ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr.slice(qr.indexOf(',') + 1))}` : qr

  return <div className="max-w-2xl">
    <h1 className="text-3xl font-bold mb-2">Sicurezza account</h1>
    <p className="text-gray-500 mb-6">Proteggi il tuo accesso con un secondo passaggio di verifica.</p>
    <div className="card space-y-4">
      <h2 className="text-lg font-bold">Autenticazione a due fattori</h2>
      <p className="text-sm text-gray-600">Usa un'app come Google Authenticator, Microsoft Authenticator o un'altra app compatibile. Dopo la password ti verra richiesto un codice a 6 cifre.</p>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {mfaFactors.length > 0 ? <div>
        <p className="text-sm font-semibold text-green-700 mb-3">Protezione attiva</p>
        {mfaFactors.map(factor => <div key={factor.id} className="flex flex-wrap justify-between items-center gap-3 py-3 border-t border-gray-100"><span className="text-sm">{factor.friendly_name || 'App di autenticazione'}</span><button className="btn-secondary text-sm disabled:opacity-50" disabled={busy} onClick={() => disable(factor)}>Rimuovi</button></div>)}
        <p className="text-xs text-gray-500 mt-3">Prima di cambiare telefono, assicurati di poter trasferire l'app di autenticazione. In caso di smarrimento contatta l'amministratore.</p>
      </div> : pending ? <form onSubmit={enable} className="space-y-4">
        <p className="text-sm">1. Scansiona il QR con la tua app di autenticazione.</p>
        <img src={qrSource} alt="QR per configurare l'autenticazione a due fattori" width="220" height="220" className="mx-auto" />
        <details><summary className="cursor-pointer text-sm text-brand-blue">Non riesci a scansionare il QR?</summary><p className="text-xs text-gray-500 mt-2">Inserisci questa chiave nell'app. Conservala riservata.</p><code className="block break-all select-all p-3 bg-gray-50 rounded-lg mt-2">{pending.totp.secret}</code></details>
        <p className="text-sm">2. Inserisci il codice per confermare l'attivazione.</p>
        <MfaCodeInput value={code} onChange={setCode} disabled={busy} />
        <div className="flex flex-wrap gap-3"><button className="btn-primary disabled:opacity-50" disabled={busy || code.length !== 6}>{busy ? 'Verifica in corso...' : 'Attiva protezione'}</button><button type="button" className="btn-secondary disabled:opacity-50" disabled={busy} onClick={cancel}>Annulla</button></div>
      </form> : <div><p className="text-sm text-gray-500 mb-3">Protezione non ancora attiva.</p><button className="btn-primary disabled:opacity-50" disabled={busy} onClick={start}>{busy ? 'Configurazione...' : 'Attiva due fattori'}</button></div>}
    </div>
  </div>
}
