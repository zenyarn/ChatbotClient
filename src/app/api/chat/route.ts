import OpenAI from 'openai';

// 建议将 API key 移到环境变量中
const client = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    console.log('收到请求:', messages); // 添加日志

    // 添加system message
    const fullMessages = [
      { role: "system", content: "You are a helpful assistant." },
      ...messages
    ];

    const stream = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: fullMessages,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    console.log('API响应成功'); // 添加日志
    
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
    
  } catch (error) {
    console.error('API错误:', error); // 添加错误日志
    return new Response(JSON.stringify({ error: '处理请求时出错' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 