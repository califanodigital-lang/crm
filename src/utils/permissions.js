export const canUseCrm = profile => ['ADMIN', 'AGENT'].includes(profile?.role)

export const canAccessAdministration = profile => profile?.role === 'ADMIN'
