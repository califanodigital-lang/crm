export const creatorFee = (participation) => Math.round((Number(participation.fee) || 0) * 75) / 100

export const expenseTotal = (items = []) => items.reduce((total, item) => total + Math.round((Number(item.importo) || 0) * 100), 0) / 100

export const collaborationCreatorFee = collaboration => {
  const gross = Number(collaboration.pagamento) || 0
  const management = collaboration.feeManagement == null ? gross * 0.25 : Number(collaboration.feeManagement) || 0
  return Math.round(Math.max(0, gross - management) * 100) / 100
}

export const remainingCreatorFee = (net, tranche = []) => Math.max(0, Math.round((net - expenseTotal(tranche.filter(item => item.pagato))) * 100) / 100)
