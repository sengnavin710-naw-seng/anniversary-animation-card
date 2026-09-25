const CARD_ID_PATTERN = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{10}$/
const CARD_FILES = new Set(['card-1.jpg', 'card-2.jpg', 'card-3.jpg', 'main-photo.jpg'])
const API_PREFIX = '/api/supabase'

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function isAllowedRequest(pathname, method) {
  const rpc = pathname.match(/^\/api\/supabase\/rest\/v1\/rpc\/(create_shared_card|get_shared_card)$/)
  if (rpc) return method === 'POST'

  const upload = pathname.match(/^\/api\/supabase\/storage\/v1\/object\/card-media\/([^/]+)\/([^/]+)$/)
  if (upload) return method === 'POST' && CARD_ID_PATTERN.test(upload[1]) && CARD_FILES.has(upload[2])

  const image = pathname.match(/^\/api\/supabase\/storage\/v1\/object\/public\/card-media\/([^/]+)\/([^/]+)$/)
  if (image) return method === 'GET' && CARD_ID_PATTERN.test(image[1]) && CARD_FILES.has(image[2])

  return false
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (!url.pathname.startsWith(`${API_PREFIX}/`)) {
      return env.ASSETS.fetch(request)
    }

    if (!isAllowedRequest(url.pathname, request.method)) {
      return jsonError('Not found', 404)
    }

    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      return jsonError('Worker runtime variables SUPABASE_URL and SUPABASE_ANON_KEY are required.', 503)
    }

    const upstreamPath = url.pathname.slice(API_PREFIX.length)
    const upstreamUrl = `${env.SUPABASE_URL.replace(/\/$/, '')}${upstreamPath}${url.search}`
    const headers = new Headers()
    headers.set('apikey', env.SUPABASE_ANON_KEY)
    headers.set('Authorization', `Bearer ${env.SUPABASE_ANON_KEY}`)

    for (const name of ['content-type', 'cache-control', 'x-upsert']) {
      const value = request.headers.get(name)
      if (value) headers.set(name, value)
    }

    try {
      return await fetch(upstreamUrl, {
        method: request.method,
        headers,
        body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
        redirect: 'follow',
      })
    } catch {
      return jsonError('Cloudflare Worker could not reach the Supabase project.', 502)
    }
  },
}
