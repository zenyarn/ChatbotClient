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

    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: fullMessages,
    });

    console.log('API响应成功'); // 添加日志
    
    // 返回完整的响应
    return new Response(JSON.stringify({
      content: completion.choices[0].message.content
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('API错误:', error); // 添加错误日志
    return new Response(JSON.stringify({ error: '处理请求时出错' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 