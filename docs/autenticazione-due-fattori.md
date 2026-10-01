# Autenticazione a due fattori

La versione v0.22.0 aggiunge MFA TOTP facoltativa per ciascun account.
Chi non la attiva continua ad accedere con email e password.
Chi la attiva deve confermare un codice dell'app prima di accedere al CRM.

## Pubblicazione

1. Pubblicare il CRM aggiornato, prima di attivare MFA sugli account.
2. In Supabase, Authentication > Multi-Factor Authentication, verificare che enrollment e verifica TOTP siano abilitati.
3. Eseguire `supabase_migrations/20261001_mfa_opt_in_rls.sql` nel SQL Editor.
4. Controllare il risultato finale: le tabelle devono avere `rowsecurity = true`. Le policy MFA non proteggono tabelle con RLS disattivato. Non attivare RLS senza verificare le policy di accesso esistenti: gli operatori potrebbero perdere accesso ai dati.
5. Aggiungere il controllo MFA alla Edge Function `admin-create-user`, come indicato sotto.
6. Verificare con un account di prova tutti i casi sotto prima di attivarlo sugli account operativi.

La migrazione aggiunge policy restrittive alle tabelle CRM esistenti.
Non sostituisce le policy di autorizzazione, non cancella dati e non cambia i ruoli.
Gli utenti senza fattori verificati non sono obbligati ad attivare MFA.

## Uso

- Aprire Account > Sicurezza account, scegliere Attiva due fattori, scansionare il QR e confermare un codice a 6 cifre.
- Il fattore diventa attivo solo dopo la verifica. QR e chiave rimangono nello stato della pagina; il CRM non li salva nelle proprie tabelle o nei log.
- Ai nuovi accessi, inserire email e password e poi il codice generato dall'app.
- Per rimuovere un fattore, aprire Sicurezza account dopo una verifica MFA e confermare Rimuovi.
- Non lasciare screenshot del QR o della chiave condivisi con altri operatori.
- Supabase puo invalidare le altre sessioni quando un fattore viene attivato: e un comportamento previsto.

## Recupero account

Non sono generati codici di recupero dal CRM. Prima di cambiare telefono trasferire l'app.
In caso di smarrimento un amministratore deve verificare l'identita dell'utente e rimuovere il fattore tramite gli strumenti amministrativi Supabase.
L'API amministrativa e `supabase.auth.admin.mfa.deleteFactor({ id, userId })`.
Usarla esclusivamente da un ambiente server sicuro; mai inserire una service-role key nel CRM, nel browser o in variabili `VITE_*`.

## Protezione server da controllare

Il repository chiama l'Edge Function `admin-create-user`, ma non ne contiene il codice.
Anche quella funzione deve verificare MFA sul server per utenti con fattori attivi, oltre al ruolo amministratore:
validare il token con Supabase Auth, ottenere i fattori verificati e negare richieste con livello diverso da `aal2` quando esiste un fattore verificato.
Un controllo esclusivamente nel frontend non protegge questa funzione.
Nel codice della funzione, dopo aver estratto il bearer token e prima di qualsiasi operazione privilegiata,
si puo aggiungere questo controllo. `authClient` e il client Supabase server gia usato dalla funzione;
`token` e il bearer token del chiamante, non la service-role key. Il controllo del ruolo ADMIN va mantenuto.

```js
const [{ data: identity, error: identityError }, { data: claims, error: claimsError }] = await Promise.all([
  authClient.auth.getUser(token),
  authClient.auth.getClaims(token),
])
if (identityError || claimsError || !identity.user || !claims?.claims) {
  return new Response(JSON.stringify({ error: 'Accesso non valido' }), { status: 401 })
}
const hasMfa = identity.user.factors?.some(factor => factor.status === 'verified')
if (hasMfa && claims.claims.aal !== 'aal2') {
  return new Response(JSON.stringify({ error: 'Verifica a due fattori richiesta' }), { status: 403 })
}
// Proseguire con la verifica del ruolo ADMIN e con le operazioni esistenti.
```

Integrare le risposte con gli header CORS gia previsti dalla funzione.
Controllare allo stesso modo eventuali viste con privilegi del proprietario, RPC SECURITY DEFINER, Storage privato o altri endpoint aggiunti fuori da questo repository.

## Verifiche manuali

- Account senza MFA: login normale, profilo e funzioni abituali disponibili.
- Attivazione annullata: nessuna richiesta del codice al login successivo.
- Attivazione confermata: eseguire logout e login; nessuna pagina CRM o richiesta ai dati prima del codice.
- Codice errato/scaduto: accesso negato, nuovo tentativo possibile.
- Ricaricare la pagina o aprire direttamente `/finance` dopo la password: richiesta MFA.
- API con token `aal1` di un account con fattore verificato: nessuna lettura/scrittura alle tabelle protette.
- API con token `aal2`: accesso consentito nei limiti del ruolo e delle policy esistenti.
- Ultimo fattore rimosso: login successivo con email e password.
- Cambiare tab senza cambio di sessione: il form CRM corrente resta aperto.
- Interruzione di rete durante controllo sessione: schermata di errore con Riprova, nessun accesso CRM.

Riferimenti: https://supabase.com/docs/guides/auth/auth-mfa e https://supabase.com/docs/guides/auth/auth-mfa/totp.
