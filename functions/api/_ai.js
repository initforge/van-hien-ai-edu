/**
 * Shared AI Service — van-hien-ai-edu
 *
 * Model routing by feature:
 *
 * Feature         | Model                            | Use case
 * ----------------|----------------------------------|------------------------------
 * chatbot         | @cf/meta/llama-3.1-8b-instruct  | Character chat (streaming)
 * grading         | @cf/agent/llama-4-llama-4-scout-fw| Essay rubric scoring
 * exam_gen       | @cf/qwen/qwen2.5-72b-instruct    | Exam question generation
 * multiverse     | @cf/Claude-ai/Claude-r1-distill-qwen-7b | Storyline branching
 *
 * Falls back to stub text if AI binding is not configured.
 */

const AI_BINDING = 'AI'; // Cloudflare Workers AI binding name

/**
 * @typedef {Object} AiOptions
 * @property {string}   [systemPrompt]  - System-level instructions
 * @property {Object[]} [messages]     - Chat history [{role, content}]
 * @property {number}  [maxTokens]    - Max output tokens (default 512)
 * @property {number}  [temperature]   - Randomness 0-1 (default 0.7)
 * @property {boolean} [stream]       - Enable streaming (default true)
 */

/**
 * Call Cloudflare Workers AI with streaming response.
 * Accumulates full text for DB persistence, then returns both stream + full text.
 *
 * @param {string} model   - AI model slug, e.g. '@cf/meta/llama-3.1-8b-instruct'
 * @param {AiOptions} opts
 * @param {string} feature - 'chatbot' | 'grading' | 'exam_gen' | 'multiverse'
 * @returns {{ stream: ReadableStream, fullText: Promise<string>, inputTokens: number, outputTokens: number }}
 */
export function aiStream(model, opts = {}, feature = 'unknown') {
  const { systemPrompt = '', messages = [], maxTokens = 512, temperature = 0.7 } = opts;
  const encoder = new TextEncoder();

  // Build messages array (system + history)
  const systemMsg = systemPrompt
    ? [{ role: 'system', content: systemPrompt }]
    : [];
  const allMessages = [...systemMsg, ...messages];

  // Estimate input tokens: ~4 chars/token
  const inputTokens = Math.ceil(
    allMessages.map(m => m.content).join('\n').length / 4
  );

  /** @type {string[]} */
  const chunks = [];
  let fullText = '';

  // Streaming ReadableStream for HTTP response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const ai = globalThis[AI_BINDING];
        if (!ai) {
          // Fallback: return stub
          const stub = `[AI stub — ${feature}] Model not configured. Set AI binding in wrangler.toml.`;
          controller.enqueue(encoder.encode(stub));
          controller.close();
          return;
        }

        const result = await ai.run(model, {
          messages: allMessages,
          stream: true,
          max_tokens: maxTokens,
          temperature,
        });

        // result is a StreamingNgRemoteConnection from Workers AI
        for await (const chunk of result) {
          const text = chunk?.response?.text ?? '';
          if (text) {
            chunks.push(text);
            fullText += text;
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      } catch (err) {
        console.error(`AI stream error [${feature}]:`, err);
        controller.enqueue(encoder.encode(`\n\n[Xin lỗi, có lỗi khi xử lý. Vui lòng thử lại.]\n`));
        controller.close();
      }
    },
  });

  return { stream, fullText, inputTokens };
}

/**
 * Call AI without streaming (for grading / structured output).
 *
 * @param {string} model
 * @param {AiOptions} opts
 * @returns {Promise<{ text: string; inputTokens: number; outputTokens: number }>}
 */
export async function aiCall(model, opts = {}) {
  const { systemPrompt = '', messages = [], maxTokens = 1024, temperature = 0.3 } = opts;

  const systemMsg = systemPrompt
    ? [{ role: 'system', content: systemPrompt }]
    : [];
  const allMessages = [...systemMsg, ...messages];
  const inputTokens = Math.ceil(
    allMessages.map(m => m.content).join('\n').length / 4
  );

  try {
    const ai = globalThis[AI_BINDING];
    if (!ai) {
      return {
        text: `[AI stub] Model not configured for this feature.`,
        inputTokens,
        outputTokens: 0,
      };
    }

    const result = await ai.run(model, {
      messages: allMessages,
      stream: false,
      max_tokens: maxTokens,
      temperature,
    });

    const text = result?.response?.text ?? '';
    const outputTokens = Math.ceil(text.length / 4);

    return { text, inputTokens, outputTokens };
  } catch (err) {
    console.error('AI call error:', err);
    return {
      text: '[Lỗi khi gọi AI. Vui lòng thử lại.]',
      inputTokens,
      outputTokens: 0,
    };
  }
}
