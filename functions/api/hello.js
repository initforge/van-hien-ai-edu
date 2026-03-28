import { cachedJson } from './_cache.js';

export async function onRequestGet({ env }) {
  return cachedJson({ status: 'ok', db_bound: !!env.DB }, { profile: 'static' });
}
