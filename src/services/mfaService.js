import { supabase } from '../lib/supabase'
import { createMfaOperations } from './mfaOperations'

export const { getMfaStatus, verifyMfaCode, enrollMfa, removeMfaFactor } = createMfaOperations(supabase.auth.mfa)
