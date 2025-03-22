import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';

// 定义消息接口
export interface ChatMessage {
  role: string;
  content: string;
}

// 定义流式文本选项
export interface StreamTextOptions {
  model: string;
  messages: ChatMessage[];
  provider: 'openai' | 'anthropic' | 'deepseek'; // 支持多种提供商
}

// 创建OpenAI客户端（根据提供商）
function createClient(provider: string) {
  switch (provider) {
    case 'deepseek':
      return new OpenAI({
        baseURL: "https://api.deepseek.com",
        apiKey: process.env.DEEPSEEK_API_KEY || ''
      });
    case 'anthropic':
      // 可以在这里添加Anthropic客户端创建逻辑
      throw new Error('Anthropic provider not implemented');
    case 'openai':
    default:
      return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || ''
      });
  }
}

// 流式文本函数
export async function streamText(options: StreamTextOptions): Promise<Response> {
  const { model, messages, provider } = options;
  
  const client = createClient(provider);
  
  // 将我们的ChatMessage转换为OpenAI期望的ChatCompletionMessageParam
  const formattedMessages: ChatCompletionMessageParam[] = messages.map(message => {
    // 确保role是OpenAI支持的类型之一
    const role = message.role === 'user' ? 'user' :
                 message.role === 'system' ? 'system' : 
                 'assistant';
    
    // 创建符合OpenAI格式的消息对象
    return {
      role,
      content: message.content
    } as ChatCompletionMessageParam;
  });
  
  // 调用API获取流式响应
  const response = await client.chat.completions.create({
    model,
    messages: formattedMessages,
    stream: true,
  });
  
  // 将流转换为Response
  const encoder = new TextEncoder();
  
  const transformStream = new TransformStream({
    async transform(chunk, controller) {
      if (chunk.choices[0]?.delta?.content) {
        controller.enqueue(encoder.encode(chunk.choices[0].delta.content));
      }
    },
  });
  
  // 使用原生流处理API
  (async () => {
    try {
      for await (const chunk of response) {
        if (chunk.choices[0]?.delta?.content) {
          const content = chunk.choices[0].delta.content;
          const encodedContent = encoder.encode(content);
          transformStream.writable.getWriter().write(encodedContent).catch(err => {
            console.error('Error writing to stream:', err);
          });
        }
      }
    } catch (error) {
      console.error('Error processing response stream:', error);
    } finally {
      transformStream.writable.getWriter().close().catch(err => {
        console.error('Error closing stream writer:', err);
      });
    }
  })();
  
  return new Response(transformStream.readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
} 