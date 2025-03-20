'use client';

import { useState, useRef, useEffect } from 'react';
import { sendMessage } from '../lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatArea() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
        }),
      });

      if (!response.ok) {
        throw new Error('API请求失败');
      }

      // 初始化空的AI响应
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          console.log('收到chunk:', chunk);
          fullResponse += chunk;

          // 实时更新最后一条消息
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              role: 'assistant',
              content: fullResponse,
            };
            return newMessages;
          });
        }
      }

    } catch (error) {
      console.error('发送消息错误:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，发生了一些错误。请稍后重试。'
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#222222] border-l border-gray-700">
      {/* 聊天内容区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-8">
          {messages.length === 0 ? (
            <div className="text-gray-300 text-center">
              <h1 className="text-2xl font-semibold mb-8">DeepSeek AI</h1>
              <p className="text-lg">有什么可以帮忙的？</p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 ${
                    message.role === 'user' 
                      ? 'bg-[#1A1B1E]'
                      : 'bg-[#2A2B32]'
                  }`}
                >
                  <div className="max-w-2xl mx-auto">
                    <div className="font-semibold mb-2">
                      {message.role === 'user' ? '你' : 'DeepSeek'}
                    </div>
                    <div className="text-gray-300 whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>
      
      {/* 输入框区域 */}
      <div className="border-t border-gray-700 bg-[#222222] p-4">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入任何问题..."
              className="w-full bg-[#2A2B32] text-white rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 border border-gray-700"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-[#2A2B32] p-1 rounded disabled:opacity-50"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <div className="text-xs text-center text-gray-400 mt-2">
            DeepSeek AI 可能会产生错误信息。考虑验证重要信息。
          </div>
        </form>
      </div>
    </div>
  );
} 