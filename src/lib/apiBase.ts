/** API root used by axios and raw fetch calls. Defaults to same-origin `/api` (Vite/Docker/Worker proxy). */
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${normalized}`
}

/** WebSocket base URL aligned with API_BASE (same-origin proxy or absolute backend URL). */
export function getWsBaseUrl(): string {
  if (API_BASE.startsWith('http')) {
    const url = new URL(API_BASE)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return url.toString().replace(/\/$/, '')
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}${API_BASE}`
}
