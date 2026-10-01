export default function MfaCodeInput({ value, onChange, disabled = false }) {
  return <div>
    <label htmlFor="mfa-code" className="label">Codice dell'app di autenticazione</label>
    <input id="mfa-code" className="input tracking-[0.3em] text-center" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={value} onChange={event => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))} disabled={disabled} placeholder="000000" required />
  </div>
}
