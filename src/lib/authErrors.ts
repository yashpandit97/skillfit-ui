import axios from 'axios'

export function formatAuthError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return 'Cannot reach the API server. Check public/config.json — the backend URL must be public and use HTTPS when the site is on HTTPS.'
    }
    const detail = (err.response.data as { detail?: string } | undefined)?.detail
    return detail || err.message || 'Authentication failed'
  }
  if (err instanceof Error) return err.message
  return 'Authentication failed'
}

export function isAuthEndpoint(url?: string): boolean {
  if (!url) return false
  return url.includes('/auth/firebase') || url.includes('/auth/login')
}
