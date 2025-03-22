import { NextRequest } from 'next/server';
import OpenAI from 'openai';

// 初始化 OpenAI 客户端，配置 DeepSeek API
const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY
});

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // 验证消息
    if (!messages || !Array.isArray(messages)) {
      return new Response('消息格式不正确', { status: 400 });
    }

    // 创建带流的聊天完成
    const stream = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: messages,
      stream: true
    });

    // 创建并返回流式响应
    return new Response(
      new ReadableStream({
        async start(controller) {
          // 处理流式响应
          try {
            for await (const chunk of stream) {
              if (chunk.choices[0]?.delta?.content) {
                const content = chunk.choices[0].delta.content;
                controller.enqueue(new TextEncoder().encode(content));
              }
            }
          } catch (error) {
            console.error("流式响应出错:", error);
            controller.error(error);
          } finally {
            controller.close();
          }
        }
      }),
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      }
    );
  } catch (error) {
    console.error('处理聊天请求时出错:', error);
    return new Response(
      JSON.stringify({ error: '处理请求时出错' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 