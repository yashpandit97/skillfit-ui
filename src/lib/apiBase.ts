/** API root for axios and fetch. Loaded from /config.json at startup (works on Cloudflare static assets). */
let apiBase = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export function getApiBase(): string {
  return apiBase
}

export function isLocalDevHost(): boolean {
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
}

function getHealthCheckUrl(): string {
  const base = getApiBase()
  if (base.startsWith('http')) {
    const url = new URL(base)
    url.pathname = '/health'
    url.search = ''
    url.hash = ''
    return url.toString()
  }
  return '/health'
}

/** Returns a user-facing message when the configured API is unreachable (hosted deploys). */
export async function validateApiReachable(): Promise<string | null> {
  if (isLocalDevHost()) return null
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(getHealthCheckUrl(), { cache: 'no-store', signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return `API at ${getApiBase()} returned ${res.status}. Check public/config.json and redeploy.`
    return null
  } catch {
    return `Cannot reach the API at ${getApiBase()}. Start your backend tunnel, update public/config.json, then redeploy the UI.`
  }
}

export async function loadApiConfig(): Promise<void> {
  // Local Vite dev uses the /api proxy to localhost:8000; ignore production config.json.
  if (isLocalDevHost()) return

  try {
    const res = await fetch('/config.json', { cache: 'no-store' })
    if (!res.ok) return
    const data = (await res.json()) as { apiBaseUrl?: string }
    if (typeof data.apiBaseUrl === 'string' && data.apiBaseUrl.trim()) {
      apiBase = data.apiBaseUrl.trim().replace(/\/$/, '')
    }
  } catch {
    // Keep Vite proxy default (/api) for local dev when config.json is missing.
  }
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${getApiBase()}${normalized}`
}

/** WebSocket base URL aligned with API base (same-origin proxy or absolute backend URL). */
export function getWsBaseUrl(): string {
  const base = getApiBase()
  if (base.startsWith('http')) {
    const url = new URL(base)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return url.toString().replace(/\/$/, '')
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}${base}`
}
