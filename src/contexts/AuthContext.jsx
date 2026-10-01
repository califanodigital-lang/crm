import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentUserProfile } from '../services/userService'
import { getMfaStatus } from '../services/mfaService'

const AuthContext = createContext(null)

// Mantiene gli import esistenti del hook insieme al provider.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

const EMPTY_AUTH = { user: null, userProfile: null, loading: true, mfaRequired: false, mfaFactors: [], authError: null }

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(undefined)
  const [auth, setAuth] = useState(EMPTY_AUTH)
  const lastSessionToken = useRef(undefined)

  useEffect(() => {
    let active = true
    let receivedEvent = false
    // Il callback resta sincrono per evitare lock con Supabase Auth.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      receivedEvent = true
      const token = nextSession?.access_token || null
      if (token === lastSessionToken.current) return
      lastSessionToken.current = token
      setAuth(previous => ({ ...previous, loading: previous.loading || previous.user?.id !== nextSession?.user.id || _event !== 'TOKEN_REFRESHED', authError: null }))
      setSession(nextSession ? { ...nextSession } : null)
    })
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active || receivedEvent) return
      if (error) setAuth({ ...EMPTY_AUTH, loading: false, authError: 'Impossibile verificare la sessione.' })
      else setSession(data.session)
    }).catch(() => {
      if (active && !receivedEvent) setAuth({ ...EMPTY_AUTH, loading: false, authError: 'Impossibile verificare la sessione.' })
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (session === undefined) return
    let active = true
    const check = async () => {
      if (!session?.user) {
        if (active) setAuth({ ...EMPTY_AUTH, loading: false })
        return
      }
      try {
        const status = await getMfaStatus()
        // Non caricare dati CRM prima della verifica MFA.
        const profile = status.required ? null : await getCurrentUserProfile()
        if (profile?.error) throw profile.error
        if (active) setAuth({ user: session.user, userProfile: profile?.data || null, loading: false, mfaRequired: status.required, mfaFactors: status.factors, authError: null })
      } catch {
        if (active) setAuth({ ...EMPTY_AUTH, user: session.user, loading: false, authError: "Impossibile verificare la sicurezza dell'account. Riprova." })
      }
    }
    void check()
    return () => { active = false }
  }, [session])

  const refreshAuth = async () => {
    setAuth(previous => ({ ...previous, loading: true, authError: null }))
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      setAuth(previous => ({ ...previous, loading: false, authError: 'Impossibile verificare la sessione.' }))
      throw error
    }
    setSession(data.session ? { ...data.session } : null)
  }

  const signIn = async (email, password) => supabase.auth.signInWithPassword({ email, password })

  const signOut = async () => {
    const result = await supabase.auth.signOut()
    if (!result.error) {
      setSession(null)
      setAuth({ ...EMPTY_AUTH, loading: false })
    }
    return result
  }

  return <AuthContext.Provider value={{ ...auth, signIn, signOut, refreshAuth }}>{children}</AuthContext.Provider>
}
