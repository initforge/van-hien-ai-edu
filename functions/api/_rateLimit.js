/**
 * Rate Limiting — KV-backed sliding window.
 * No in-memory fallback (fail-secure when KV unavailable).
 *
 * Limits per user (by user.id) for write/AI operations.
 */
import { rateLimit } from './_kv.js';

/**
 * Check if a user is rate-limited.
 * @param {string|number} userId
 * @param {number} maxRequests - max requests per window
 * @param {object} env - Cloudflare env (with CACHE KV binding)
 * @returns {Promise<{ allowed: boolean, remaining: number, resetIn: number }>}
 */
export async function checkRateLimit(userId, maxRequests = 10, env = {}) {
  return rateLimit(env.CACHE, String(userId), maxRequests, 60);
}
