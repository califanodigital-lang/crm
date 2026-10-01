export const canUseCrm = profile => profile?.attivo !== false && ['ADMIN', 'AGENT'].includes(profile?.role)

export const canAccessAdministration = profile => canUseCrm(profile) && profile.role === 'ADMIN'
