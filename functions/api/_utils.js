/**
 * Shared helpers — van-hien-ai-edu API functions
 */

/**
 * @param {string} message
 * @param {number} status
 * @returns {Response}
 */
export function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Rough token estimation: ~4 chars per token.
 * @param {string} text
 * @returns {number}
 */
export function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/**
 * Estimate tokens from an array of messages.
 * @param {{ role: string; content: string }[]} messages
 * @returns {number}
 */
export function estimateMessagesTokens(messages) {
  return estimateTokens(messages.map(m => m.content).join('\n'));
}

/**
 * Extract JSON object from AI raw text response.
 * Falls back to the provided default if parsing fails.
 *
 * @param {string} rawText   - Raw AI response text
 * @param {*} fallback       - Value to return on parse failure
 * @returns {{ parsed: object|null, raw: string }}
 */
export function parseAiJson(rawText, fallback = null) {
  try {
    const match = String(rawText).match(/\{[\s\S]*\}/);
    if (match) return { parsed: JSON.parse(match[0]), raw: rawText };
  } catch {
    // fall through
  }
  return { parsed: fallback, raw: rawText };
}
