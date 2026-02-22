export function isVenueRole(role?: string | null) {
  return role === 'horeca' || role === 'venue' || role === 'admin'
}
