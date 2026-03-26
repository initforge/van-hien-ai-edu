export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, characterId } = await req.json() as { messages: any[], characterId: string };

    const lastUserMessage = messages[messages.length - 1]?.text || "";

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const responses = [
          `Chào bạn, ta là ${characterId}. Đây là tín hiệu streaming thời gian thực (Server-Sent Events) đang chạy trên **Cloudflare Edge**. Trí tuệ nhân tạo sẽ sinh ngôn ngữ từng chữ một thay vì phải chờ nguyên một khối dài.`,
          `Ta rất hiểu nỗi băn khoăn của bạn về vấn đề: "${lastUserMessage}". Trong nguyên tác, tác giả đã khắc hoạ những góc khuất trong tâm hồn con người để chúng ta chiêm nghiệm.`,
          `Tuy nhiên, đây chỉ là phiên bản Hackathon MVP! Ở production, đoạn text này sẽ được sinh ra từ \`@ai-sdk/openai\` hoặc GenMax.`
        ];
        
        const responseText = responses.join(' ');
        const words = responseText.split(' ');

        for (const word of words) {
          controller.enqueue(encoder.encode(word + ' '));
          // Simulate latency per token
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
    return Response.json({ error: 'Failed to chat' }, { status: 500 });
  }
}
