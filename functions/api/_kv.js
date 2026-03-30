/**
 * KV Service — van-hien-ai-edu
 *
 * Namespace: VH_KV (dedicated)
 * Prefix: vh: (project isolation)
 *
 * Usage:
 *   import { kvGet, kvSet, kvDelete, rateLimit } from './_kv.js';
 *   const cached = await kvGet(env.CACHE, 'user:42:profile');
 *   const allowed = await rateLimit(env.CACHE, user.id, 10, 60);
 */

const PREFIX = 'vh:';
const DEFAULT_TTL = 300; // 5 minutes

// ─── Core KV ops ───────────────────────────────────────────

/**
 * Get value from KV, parsed as JSON.
 * @param {KVNamespace} kv
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export async function kvGet(kv, key) {
  if (!kv) return null;
  const raw = await kv.get(PREFIX + key, 'text');
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch { return null; }
}

/**
 * Set value in KV as JSON.
 * @param {KVNamespace} kv
 * @param {string} key
 * @param {any} data
 * @param {number} ttl - seconds
 */
export async function kvSet(kv, key, data, ttl = DEFAULT_TTL) {
  if (!kv) return;
  await kv.put(PREFIX + key, JSON.stringify(data), {
    expirationTtl: Math.max(ttl, 60), // min 60s
  });
}

/**
 * Delete a key.
 * @param {KVNamespace} kv
 * @param {string} key
 */
export async function kvDelete(kv, key) {
  if (!kv) return;
  await kv.delete(PREFIX + key);
}

/**
 * Invalidate all keys matching a prefix.
 * @param {KVNamespace} kv
 * @param {string} prefix
 */
export async function kvInvalidatePrefix(kv, prefix) {
  if (!kv) return;
  const list = await kv.list({ prefix: PREFIX + prefix });
  await Promise.all(list.keys.map(k => kv.delete(k.name)));
}

// ─── Rate Limiting ─────────────────────────────────────────

const RATE_WINDOW_MS = 60_000;

/**
 * Sliding-window rate limiter using KV.
 * KV-only — no in-memory fallback (prevents cold-start bypass).
 * If KV is unavailable, denies the request (fail-secure).
 *
 * @param {KVNamespace} kv
 * @param {string} userId
 * @param {number} limit - max requests per window
 * @param {number} windowSec
 * @returns {Promise<{ allowed: boolean, remaining: number, resetIn: number }>}
 */
export async function rateLimit(kv, userId, limit = 10, windowSec = 60) {
  const key = `rl:${userId}`;
  const now = Date.now();
  const windowMs = windowSec * 1000;

  if (!kv) {
    // Fail-secure: deny when KV unavailable
    console.error('rateLimit: KV unavailable, denying request');
    return { allowed: false, remaining: 0, resetIn: windowSec * 1000 };
  }

  const raw = await kv.get(PREFIX + key, 'text');
  const entries = raw ? JSON.parse(raw) : [];

  // Remove expired entries
  const cutoff = now - windowMs;
  const recent = entries.filter(([ts]) => ts > cutoff);

  if (recent.length >= limit) {
    const oldestTs = recent[recent.length - 1][0];
    return {
      allowed: false,
      remaining: 0,
      resetIn: oldestTs + windowMs - now,
    };
  }

  recent.unshift([now]);
  await kv.put(PREFIX + key, JSON.stringify(recent), {
    expirationTtl: windowSec + 5,
  });

  return { allowed: true, remaining: limit - recent.length, resetIn: 0 };
}

// ─── Token Denylist (for logout/revoke) ────────────────────

/**
 * Add a JWT jti to the denylist (logout).
 * @param {KVNamespace} kv
 * @param {string} jti
 * @param {number} ttlSec - how long until token expires
 */
export async function revokeToken(kv, jti, ttlSec = 86400) {
  if (!kv) return;
  // Store jti with TTL = token's remaining lifetime
  await kv.put(PREFIX + `deny:${jti}`, '1', { expirationTtl: Math.max(ttlSec, 60) });
}

/**
 * Check if a token jti is revoked.
 * @param {KVNamespace} kv
 * @param {string} jti
 * @returns {Promise<boolean>}
 */
export async function isTokenRevoked(kv, jti) {
  if (!kv) return false;
  const val = await kv.get(PREFIX + `deny:${jti}`, 'text');
  return val === '1';
}
