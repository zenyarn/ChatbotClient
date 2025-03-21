'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: number;
}

interface ChatAreaProps {
  conversationId: string | null;
}

export default function ChatArea({ conversationId }: ChatAreaProps) {
  const { isLoaded, userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 获取消息历史
  const fetchMessages = async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // 当会话ID改变时，获取新的消息历史
  useEffect(() => {
    if (isLoaded && userId && conversationId) {
      fetchMessages();
    }
  }, [isLoaded, userId, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading || !conversationId) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // 发送用户消息到会话
      const messageResponse = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: userMessage,
          role: 'user'
        }),
      });

      if (!messageResponse.ok) {
        throw new Error('发送消息失败');
      }

      // 获取更新后的消息列表
      await fetchMessages();

      // 准备一个临时的 AI 响应消息
      const tempAssistantMessage: Message = {
        id: Date.now().toString(),
        conversationId,
        content: '',
        role: 'assistant',
        createdAt: Date.now()
      };
      setMessages(prev => [...prev, tempAssistantMessage]);

      // 准备发送给 AI 的消息列表，包括最新的用户消息
      const messagesForAI = [
        ...messages,
        { role: 'user' as const, content: userMessage }
      ];

      // 调用 AI 接口获取流式回复
      const aiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesForAI.map(msg => ({ role: msg.role, content: msg.content })),
        }),
      });

      if (!aiResponse.ok) {
        throw new Error('AI响应失败');
      }

      const reader = aiResponse.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullResponse += chunk;

          // 实时更新 AI 响应
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = fullResponse;
            }
            return newMessages;
          });
        }
      }

      // 将完整的 AI 响应保存到数据库
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: fullResponse,
          role: 'assistant'
        }),
      });

      // 获取最终的消息列表
      await fetchMessages();

    } catch (error) {
      console.error('发送消息错误:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        conversationId,
        content: '抱歉，发生了一些错误。请稍后重试。',
        role: 'assistant',
        createdAt: Date.now()
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
          {!conversationId ? (
            <div className="text-gray-300 text-center">
              <h1 className="text-2xl font-semibold mb-8">DeepSeek AI</h1>
              <p className="text-lg">请选择或创建一个会话开始聊天</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-gray-300 text-center">
              <h1 className="text-2xl font-semibold mb-8">DeepSeek AI</h1>
              <p className="text-lg">有什么可以帮忙的？</p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
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
              placeholder={conversationId ? "输入任何问题..." : "请先选择或创建一个会话"}
              className="w-full bg-[#2A2B32] text-white rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 border border-gray-700"
              disabled={isLoading || !conversationId}
            />
            <button
              type="submit"
              disabled={isLoading || !conversationId}
              className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-[#2A2B32] p-1 rounded disabled:opacity-50"
            >
              <Send className="w-5 h-5 text-gray-400" />
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