/**
 * Shared data fetcher for SWR — wraps fetch with JSON parsing.
 * IMPORTANT: Always include credentials (cookie) so JWT auth works.
 */
export const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });

/** Default SWR options: disable auto-revalidation on window focus */
export const SWR_OPTS = { revalidateOnFocus: false, credentials: 'include' as RequestCredentials };

/** SWR options for pages needing fresh data on focus (e.g. exam timer) */
export const SWR_OPTS_REALTIME = { revalidateOnFocus: true, revalidateOnReconnect: true };

/**
 * Formats an ISO date string as DD/MM/YYYY.
 */
export function formatDate(value: string | undefined | null): string {
  if (!value) return '--/--/----';
  try {
    const d = new Date(value);
    return [
      String(d.getDate()).padStart(2, '0'),
      String(d.getMonth() + 1).padStart(2, '0'),
      d.getFullYear(),
    ].join('/');
  } catch {
    return '--/--/----';
  }
}
