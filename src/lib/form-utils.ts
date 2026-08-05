export function sanitizeForForm<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v === null ? undefined : v])
  )
}

export function emptyToNull<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v === '' || v === undefined ? null : v])
  )
}
