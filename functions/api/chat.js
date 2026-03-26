export async function onRequestPost({ request }) {
  try {
    const { messages, characterId } = await request.json();
    const lastUserMessage = messages?.[messages.length - 1]?.text || "";

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const responses = [
          `Chào bạn, ta là ${characterId}. Đây là tín hiệu streaming thời gian thực đang chạy trên Cloudflare Edge. Trí tuệ nhân tạo sẽ sinh ngôn ngữ từng chữ một thay vì phải chờ nguyên một khối dài.`,
          `Ta rất hiểu nỗi băn khoăn của bạn về vấn đề: "${lastUserMessage}". Trong nguyên tác, tác giả đã khắc hoạ những góc khuất trong tâm hồn con người để chúng ta chiêm nghiệm.`,
          `Tuy nhiên, đây chỉ là phiên bản MVP! Ở production, đoạn text này sẽ được sinh ra từ AI SDK hoặc GenMax.`
        ];
        const words = responses.join(' ').split(' ');
        for (const word of words) {
          controller.enqueue(encoder.encode(word + ' '));
          await new Promise(r => setTimeout(r, 40));
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to chat' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
