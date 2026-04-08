import { estimateTokens, estimateMessagesTokens } from './_utils.js';

/**
 * Shared AI Service — van-hien-ai-edu
 *
 * Model routing by feature (CF Workers AI — April 2026):
 *
 * Feature       | Model                                        | Use case
 * --------------|----------------------------------------------|------------------------------
 * chatbot       | @cf/google/gemma-3-12b-it                    | Character chat (streaming)
 * grading       | @cf/google/gemma-3-12b-it                    | Essay rubric scoring
 * work_analysis | @cf/mistralai/mistral-small-3.1-24b-instruct | Literary analysis (Vietnamese)
 * exam_gen      | @cf/mistralai/mistral-small-3.1-24b-instruct | Exam question generation
 * multiverse    | @cf/qwen/qwq-32b                             | Storyline branching (reasoning)
 */

const AI_BINDING = 'AI';

/**
 * @typedef {Object} AiOptions
 * @property {string}   [systemPrompt]
 * @property {Object[]} [messages]
 * @property {number}  [maxTokens]
 * @property {number}  [temperature]
 */

/**
 * Call Cloudflare Workers AI with streaming response.
 *
 * @param {any} env
 * @param {string} model
 * @param {AiOptions} opts
 * @param {string} feature
 * @returns {{ stream: ReadableStream, fullText: Promise<string>, inputTokens: number }}
 */
export function aiStream(env, model, opts = {}, feature = 'unknown') {
  const { systemPrompt = '', messages = [], maxTokens = 512, temperature = 0.7 } = opts;
  const encoder = new TextEncoder();

  const systemMsg = systemPrompt ? [{ role: 'system', content: systemPrompt }] : [];
  const allMessages = [...systemMsg, ...messages];
  const inputTokens = estimateMessagesTokens(allMessages);

  /** @type {string[]} */
  const chunks = [];
  let fullText = '';
  let resolveFullText;
  const fullTextPromise = new Promise(resolve => { resolveFullText = resolve; });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const ai = env?.['AI'] ?? null;
        if (!ai) {
          controller.enqueue(encoder.encode('[Lỗi: AI chưa được cấu hình trên server.]\n'));
          controller.close();
          resolveFullText('[Lỗi: AI chưa được cấu hình trên server.]');
          return;
        }

        const result = await ai.run(model, {
          messages: allMessages,
          stream: true,
          max_tokens: maxTokens,
          temperature,
        });

        for await (const chunk of result) {
          const text = chunk?.response ?? '';
          if (text) {
            chunks.push(text);
            fullText += text;
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
        resolveFullText(fullText);
      } catch (err) {
        console.error(`AI stream error [${feature}]:`, err);
        controller.enqueue(encoder.encode(`\n\n[Xin lỗi, có lỗi khi xử lý. Vui lòng thử lại.]\n`));
        controller.close();
        resolveFullText('');
      }
    },
  });

  return { stream, fullText: fullTextPromise, inputTokens };
}

/**
 * Call AI without streaming.
 *
 * @param {any} env
 * @param {string} model
 * @param {AiOptions} opts
 * @returns {Promise<{ text: string; inputTokens: number; outputTokens: number }>}
 */
export async function aiCall(env, model, opts = {}) {
  const { systemPrompt = '', messages = [], maxTokens = 1024, temperature = 0.3 } = opts;
  const msgs = Array.isArray(messages) ? messages : [];
  const systemMsg = systemPrompt ? [{ role: 'system', content: systemPrompt }] : [];
  const allMessages = [...systemMsg, ...msgs];
  const inputTokens = estimateMessagesTokens(allMessages);

  try {
    const ai = env?.['AI'] ?? null;
    if (!ai) {
      throw Object.assign(new Error('AI binding not configured on this deployment'), { code: 'AI_NOT_CONFIGURED' });
    }

    const result = await ai.run(model, {
      messages: allMessages,
      stream: false,
      max_tokens: maxTokens,
      temperature,
    });

    const text = result?.response ?? '';
    const outputTokens = estimateTokens(text);

    return { text, inputTokens, outputTokens };
  } catch (err) {
    console.error('AI call error:', err);
    throw Object.assign(new Error(err?.message || 'AI call failed'), { code: err?.code || 'AI_ERROR' });
  }
}
