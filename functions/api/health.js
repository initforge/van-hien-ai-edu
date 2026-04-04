export default {
  async fetch(request, env) {
    const keys = Object.keys(env || {});
    const jwtDirect = env?.JWT_SECRET;
    const dbDirect = !!env?.DB;
    const kvDirect = !!env?.VANHIEN_KV;
    const url = new URL(request.url);

    return new Response(JSON.stringify({
      url: url.pathname,
      envType: typeof env,
      envKeys: keys,
      jwtPresent: 'JWT_SECRET' in (env || {}),
      jwtValue: jwtDirect ? 'SET(' + jwtDirect.length + ' chars)' : 'MISSING',
      dbPresent: 'DB' in (env || {}),
      dbWorking: dbDirect,
      kvPresent: 'VANHIEN_KV' in (env || {}),
      kvWorking: kvDirect,
    }), { headers: { 'Content-Type': 'application/json' } });
  }
};
