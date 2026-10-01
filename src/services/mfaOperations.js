export const createMfaOperations = mfa => {
  const getMfaStatus = async () => {
    const [assurance, factors] = await Promise.all([
      mfa.getAuthenticatorAssuranceLevel(),
      mfa.listFactors(),
    ])
    if (assurance.error) throw assurance.error
    if (factors.error) throw factors.error
    if (!['aal1', 'aal2'].includes(assurance.data?.currentLevel)) throw new Error('Sessione non valida.')
    const verified = factors.data.all.filter(factor => factor.status === 'verified')
    return {
      required: verified.length > 0 && assurance.data.currentLevel !== 'aal2',
      factors: verified.filter(factor => factor.factor_type === 'totp'),
      allFactors: factors.data.all,
    }
  }
  
  const verifyMfaCode = async (factorId, code) => {
    if (!/^\d{6}$/.test(code)) throw new Error('Inserisci il codice a 6 cifre.')
    const { error } = await mfa.challengeAndVerify({ factorId, code })
    if (error) throw error
  }
  
  const enrollMfa = async () => {
    const { allFactors } = await getMfaStatus()
    // Elimina soltanto configurazioni CRM precedenti mai confermate.
    for (const factor of allFactors.filter(f => f.factor_type === 'totp' && f.status === 'unverified' && f.friendly_name === 'C3 CRM')) {
      const { error } = await mfa.unenroll({ factorId: factor.id })
      if (error) throw error
    }
    const { data, error } = await mfa.enroll({ factorType: 'totp', friendlyName: 'C3 CRM', issuer: 'C3 Agency' })
    if (error) throw error
    return data
  }
  
  const removeMfaFactor = async factorId => {
    const { error } = await mfa.unenroll({ factorId })
    if (error) throw error
  }
  return { getMfaStatus, verifyMfaCode, enrollMfa, removeMfaFactor }
}
