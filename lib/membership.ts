export function formatMembershipId(termId: string): string {
  return '4WS-' + termId.slice(0, 8).toUpperCase()
}

export function isExpired(validUntil: string): boolean {
  return new Date(validUntil) < new Date()
}
