export const SUPABASE_PAGE_SIZE = 1000

export const fetchAllRows = async (buildQuery, pageSize = SUPABASE_PAGE_SIZE) => {
  const rows = []
  let from = 0

  while (true) {
    const to = from + pageSize - 1
    const { data, error } = await buildQuery().range(from, to)

    if (error) throw error
    rows.push(...(data || []))

    if (!data || data.length < pageSize) break
    from += pageSize
  }

  return rows
}
