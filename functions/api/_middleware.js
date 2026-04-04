import { jwtVerify } from 'jose';
import { isTokenRevoked } from './_kv.js';

// JWT_SECRET must be set via: wrangler secret put JWT_SECRET
// Never hardcode secrets in production

// Middleware that runs before /api/* handlers
export async function onRequest(context) {
  const { request, next, data, env } = context;
  const url = new URL(request.url);

  // Skip auth checks for login and public endpoints
  if (url.pathname === '/api/auth' || url.pathname === '/api/health' || url.pathname.startsWith('/api/_')) {
    return next();
  }

  try {
    // Read Token: Authorization header first (localStorage approach), then cookies (legacy)
    let token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      const cookieHeader = request.headers.get('Cookie') || '';
      const cookies = cookieHeader.split(';').map(c => c.trim());
      for (const role of ['admin', 'teacher', 'student']) {
        const roleCookie = cookies.find(c => c.startsWith(`token_${role}=`));
        if (roleCookie) {
          token = roleCookie.split('=').slice(1).join('=');
          break;
        }
      }
    }

    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Verify JWT using env secret
    if (!env.JWT_SECRET) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500 });
    }
    const { payload } = await jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET));

    // Check if token has been revoked (logout)
    if (payload.jti && env.VANHIEN_KV) {
      const revoked = await isTokenRevoked(env.VANHIEN_KV, payload.jti);
      if (revoked) {
        return new Response(JSON.stringify({ error: "Token has been revoked" }), { status: 401 });
      }
    }

    // Attach user payload to context data so downstream API can use it
    data.user = payload;

    return next();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid Token" }), { status: 401 });
  }
}
