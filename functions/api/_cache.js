// Cache Layer Middleware for Cloudflare Pages Functions
// Wraps response handlers with proper cache headers

const CACHE_PROFILES = {
  // Frequently read, rarely changes — cache 60s, serve stale for 5min
  static: { 'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300' },
  // Data that changes often — cache 10s, serve stale for 30s
  dynamic: { 'Cache-Control': 'public, max-age=10, s-maxage=30, stale-while-revalidate=60' },
  // Never cache — mutations, auth, streaming
  nocache: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
  // Short-lived in-memory — 5s for dashboard stats
  realtime: { 'Cache-Control': 'public, max-age=5, s-maxage=15, stale-while-revalidate=30' },
};

/**
 * Wrap a response with cache headers
 * @param {Response} response - Original response
 * @param {'static'|'dynamic'|'nocache'|'realtime'} profile - Cache profile to apply
 * @returns {Response} Response with cache headers
 */
export function withCache(response, profile = 'dynamic') {
  const headers = new Headers(response.headers);
  const cacheHeaders = CACHE_PROFILES[profile] || CACHE_PROFILES.dynamic;
  
  for (const [key, value] of Object.entries(cacheHeaders)) {
    headers.set(key, value);
  }
  
  // Add Vary header for proper cache key discrimination
  headers.set('Vary', 'Accept-Encoding');
  headers.set('Access-Control-Allow-Origin', '*');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Create a JSON response with cache headers
 * @param {any} data - Data to serialize
 * @param {object} opts - Options { status, profile }
 */
export function cachedJson(data, { status = 200, profile = 'dynamic' } = {}) {
  const body = JSON.stringify(data);
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Vary': 'Accept-Encoding',
    ...(CACHE_PROFILES[profile] || CACHE_PROFILES.dynamic),
  };
  return new Response(body, { status, headers });
}
