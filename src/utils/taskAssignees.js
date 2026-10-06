export const taskAssigneeIds = task => [...new Set([
  task.assignee_id,
  ...(Array.isArray(task.additional_assignee_ids) ? task.additional_assignee_ids : []),
].filter(Boolean))]

export const additionalTaskAssignees = (primaryId, ids = []) => [...new Set(ids.filter(id => id && id !== primaryId))]
