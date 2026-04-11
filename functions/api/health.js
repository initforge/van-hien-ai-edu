import { cachedJson } from './_cache.js';

// Health check — no auth required
export async function onRequestGet({ env }) {
  const ai = env?.['AI'] ?? null;
  let aiStatus = 'not configured';
  if (ai) {
    try {
      const result = await ai.run('@cf/google/gemma-3-12b-it', {
        messages: [{ role: 'user', content: 'OK?' }],
        max_tokens: 5,
        temperature: 0.1,
      });
      aiStatus = result?.response ? 'ok' : 'no-response';
    } catch (e) {
      aiStatus = 'error: ' + (e?.message || String(e));
    }
  }
  return cachedJson({ status: 'ok', ai: aiStatus }, { profile: 'nocache' });
}
