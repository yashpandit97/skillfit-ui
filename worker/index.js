/**
 * Cloudflare Worker: proxy /api/* and /health to the FastAPI backend.
 * Set BACKEND_URL in Cloudflare (e.g. https://api.yourdomain.com) — no trailing slash.
 */
export default {
  /**
   * @param {Request} request
   * @param {{ ASSETS: { fetch: (req: Request) => Promise<Response> }, BACKEND_URL?: string }} env
   */
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api') || url.pathname === '/health') {
      const backend = env.BACKEND_URL?.replace(/\/$/, '')
      if (!backend) {
        return Response.json(
          { detail: 'BACKEND_URL is not configured on the Cloudflare Worker' },
          { status: 503 },
        )
      }

      const target = `${backend}${url.pathname}${url.search}`
      const headers = new Headers(request.headers)
      headers.delete('host')

      return fetch(target, {
        method: request.method,
        headers,
        body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
        redirect: 'manual',
      })
    }

    return env.ASSETS.fetch(request)
  },
}
