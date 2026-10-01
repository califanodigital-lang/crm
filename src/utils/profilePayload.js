export const userProfilePayload = profile => {
  const fields = { role:'role', nomeCompleto:'nome_completo', agenteNome:'agente_nome', attivo:'attivo', fissoMensile:'fisso_mensile' }
  return Object.fromEntries(Object.entries(fields)
    .filter(([key]) => Object.hasOwn(profile, key) && profile[key] !== undefined)
    .map(([key, column]) => [column, key === 'fissoMensile' ? (profile[key] ?? 0) : profile[key]]))
}
