/**
 * Shared data fetcher for SWR — wraps fetch with JSON parsing.
 * Use for all SWR fetcher props.
 */
export const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });

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
