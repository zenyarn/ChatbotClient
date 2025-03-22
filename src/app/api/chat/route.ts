import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { Stream } from 'openai/streaming';
import { ChatCompletionChunk } from 'openai/resources';

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

    let retries = 3;
    // 明确指定response类型
    let response: Stream<ChatCompletionChunk> | undefined;
    
    while (retries > 0) {
      try {
        // 移除timeout参数，它不是OpenAI API支持的参数
        response = await openai.chat.completions.create({
          model: "deepseek-chat",
          messages,
          stream: true,
          // 如需设置超时，应在fetch选项或请求配置中设置
        });
        break; // 成功时退出循环
      } catch (error) {
        console.error('AI请求错误，尝试重试:', error);
        retries--;
        if (retries === 0) throw error;
        // 延迟后重试
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // 确保response已定义
    if (!response) {
      return new Response('无法获取AI响应', { status: 500 });
    }

    // 创建并返回流式响应
    return new Response(
      new ReadableStream({
        async start(controller) {
          // 处理流式响应
          const encoder = new TextEncoder();
          // 在正确的作用域内声明keepAliveInterval
          let keepAliveInterval: NodeJS.Timeout | null = null;
          
          try {
            // 设置心跳信号
            keepAliveInterval = setInterval(() => {
              // 发送注释作为心跳信号
              controller.enqueue(encoder.encode('<!-- keep-alive -->'));
            }, 15000); // 每15秒发送一次

            // 使用明确类型的response
            for await (const chunk of response!) {
              if (chunk.choices[0]?.delta?.content) {
                const content = chunk.choices[0].delta.content;
                controller.enqueue(encoder.encode(content));
              }
            }
          } catch (error) {
            console.error("流式响应出错:", error);
            controller.error(error);
          } finally {
            controller.close();
            // 确保keepAliveInterval存在再清除
            if (keepAliveInterval) {
              clearInterval(keepAliveInterval);
            }
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