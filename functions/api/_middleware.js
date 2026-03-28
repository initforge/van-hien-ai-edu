import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode("V4nHocA1_SuperS3cretKey_2026!");

// Middleware that runs before /api/* handlers
export async function onRequest(context) {
  const { request, next, data } = context;
  const url = new URL(request.url);

  // Skip auth checks for login and public endpoints
  if (url.pathname === '/api/auth' || url.pathname.startsWith('/api/_')) {
    return next();
  }

  try {
    // Read Token from Cookies
    const cookieHeader = request.headers.get('Cookie');
    let token = null;

    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim());
      const tokenCookie = cookies.find(c => c.startsWith('token='));
      if (tokenCookie) {
        token = tokenCookie.split('=')[1];
      }
    }

    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Attach user payload to context data so downstream API can use it
    data.user = payload;

    return next();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid Token" }), { status: 401 });
  }
}
