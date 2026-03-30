// Log AI token usage to token_logs table
// For MVP: estimated tokens. When using real AI SDK, pass actual counts.

/**
 * @param {object} env - Cloudflare env
 * @param {string} teacherId - teacher who owns this feature
 * @param {string} feature - 'chatbot' | 'grading' | 'exam_gen' | 'multiverse'
 * @param {string} description
 * @param {number} inputTokens - estimated or actual input tokens
 * @param {number} outputTokens - estimated or actual output tokens
 */
export async function logTokenUsage(env, teacherId, feature, description, inputTokens = 0, outputTokens = 0) {
  try {
    await env.DB.prepare(
      `INSERT INTO token_logs (id, teacher_id, feature, description, input_tokens, output_tokens, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), teacherId, feature, description, inputTokens, outputTokens, new Date().toISOString()).run();
  } catch (e) {
    // Non-critical: log failure should not break the main flow
    console.error('token_log failed:', e);
  }
}
