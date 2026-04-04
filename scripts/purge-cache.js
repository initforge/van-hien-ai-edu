/**
 * post-deploy cache purge for Cloudflare Pages
 * Usage: node scripts/purge-cache.js <account-id> <project-name>
 *
 * Purges the CDN cache after deploy to prevent stale asset references.
 * Runs automatically after wrangler pages deploy via package.json postdeploy.
 */
import { fetch } from 'undici';

const ACCOUNT_ID = process.argv[2] || process.env.CLOUDFLARE_ACCOUNT_ID;
const PROJECT   = process.argv[3] || process.env.CLOUDFLARE_PROJECT || 'van-hien';

if (!ACCOUNT_ID) {
  console.warn('⚠️  CLOUDFLARE_ACCOUNT_ID not set — skipping purge');
  process.exit(0);
}

async function purgeCache() {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}/deployments`;

  const res = await fetch(url, {
    headers: {
      // wrangler stores its auth token in ~/.cloudflare/credentials.json
      'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN || ''}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    // If auth fails, warn but don't fail the deploy
    if (res.status === 403 || res.status === 401) {
      console.warn(`⚠️  Cache purge skipped — auth issue (${res.status}). Add CLOUDFLARE_API_TOKEN env var.`);
      return;
    }
    console.error(`❌ Cache purge failed: ${res.status} ${text}`);
    return;
  }

  const data = await res.json();
  const latest = data?.result?.[0];

  if (!latest) {
    console.warn('⚠️  No deployment found to purge');
    return;
  }

  const purgeUrl = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}/deployments/${latest.id}/cache`;

  const purgeRes = await fetch(purgeUrl, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN || ''}`,
    },
  });

  if (purgeRes.ok) {
    console.log(`✅ Cache purged for deployment ${latest.id}`);
  } else {
    const text = await purgeRes.text();
    console.warn(`⚠️  Cache purge returned ${purgeRes.status}: ${text}`);
  }
}

purgeCache();
