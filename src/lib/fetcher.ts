/**
 * Shared data fetcher for SWR — reads JWT from localStorage and sends as Bearer token.
 * Token is stored per-role in localStorage to allow multi-account (admin/teacher/student) sessions.
 */
const TOKEN_KEY = () => {
  // Read role from current URL path to pick correct localStorage key
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  if (path.startsWith('/admin')) return 'token_admin';
  if (path.startsWith('/teacher')) return 'token_teacher';
  if (path.startsWith('/student')) return 'token_student';
  return 'token'; // fallback
};

export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY());
};

export const fetcher = (url: string) => {
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return fetch(url, { headers }).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
};

/** Store token in localStorage after login */
export const storeToken = (token: string, role: string) => {
  const key = `token_${role}`;
  localStorage.setItem(key, token);
};

/** Clear all role tokens from localStorage */
export const clearTokens = () => {
  ['admin', 'teacher', 'student'].forEach(role => {
    localStorage.removeItem(`token_${role}`);
  });
  localStorage.removeItem('token');
};

/** Default SWR options: disable auto-revalidation on window focus */
export const SWR_OPTS = { revalidateOnFocus: false };

/** SWR options for pages needing fresh data on focus (e.g. exam timer) */
export const SWR_OPTS_REALTIME = { revalidateOnFocus: true, revalidateOnReconnect: true };
