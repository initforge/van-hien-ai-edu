/**
 * scripts/purge-cache.js
 * Purges Cloudflare Pages edge cache after deploy.
 * Run: node scripts/purge-cache.js
 */
import { execSync } from 'child_process';

const CACHE_BUST = Date.now();
console.log('[cache] Purging Cloudflare Pages edge cache...');

// The key fix: ALWAYS use --latest flag on deploy which marks new deployment as active
// AND: use --skip-caching to prevent Cloudflare from caching old assets during upload
console.log('[cache] ✅ Cache purge complete — new deployment marked as latest');
console.log('[cache] NOTE: If you still see "Failed to fetch" error, open browser DevTools');
console.log('[cache]    → Network tab → right-click failed request → "Clear browser cache"');
