export function requestIdFromHeader(
  header: string | string[] | undefined,
): string | undefined {
  if (typeof header === 'string' && header.length > 0) {
    return header
  }
  if (Array.isArray(header) && header[0] !== undefined && header[0] !== '') {
    return header[0]
  }
  return undefined
}
