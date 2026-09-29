/** Short, human-readable unique id: "rst_9f3ka2" */
export function makeId(prefix = 'id') {
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now().toString(36)}${random}`
}
