import { cachedJson } from './_cache.js';

// Health check — intentionally minimal, no auth required
export async function onRequestGet({ env }) {
  // NOTE: Remove 'db_bound' in production — it leaks infrastructure config
  return cachedJson({ status: 'ok' }, { profile: 'nocache' });
}
