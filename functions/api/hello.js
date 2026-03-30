import { cachedJson } from './_cache.js';

// Health check — intentionally minimal, no auth required
export async function onRequestGet() {
  return cachedJson({ status: 'ok' }, { profile: 'nocache' });
}
