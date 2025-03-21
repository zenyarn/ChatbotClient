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
  onConversationCreated: (conversationId: string) => void;
}

export default function ChatArea({ conversationId, onConversationCreated }: ChatAreaProps) {
  const { isLoaded, userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 获取消息历史
  const fetchMessages = async (conversationId: string) => {
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
      fetchMessages(conversationId);
    }
  }, [isLoaded, userId, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createNewConversation = async () => {
    try {
      // 使用时间戳创建会话名称
      const timestamp = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: `对话 ${timestamp}` }),
      });

      if (!response.ok) throw new Error('Failed to create conversation');
      
      const newConversation = await response.json();
      onConversationCreated(newConversation.id);
      return newConversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageToSend = newMessage;
    setNewMessage('');
    setIsLoading(true);

    try {
      // 确保有会话 ID
      const currentConversationId = conversationId || await createNewConversation();

      // 发送用户消息
      const userMessageResponse = await fetch(`/api/conversations/${currentConversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageToSend,
          role: 'user',
        }),
      });

      if (!userMessageResponse.ok) throw new Error('Failed to send user message');

      // 获取更新后的消息列表
      await fetchMessages(currentConversationId);

      // 获取 AI 响应
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: messageToSend }],
        }),
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      if (reader) {
        // 在本地状态中添加一个临时消息用于显示流式响应
        setMessages(prevMessages => [
          ...prevMessages,
          {
            id: 'temp-' + Date.now(),
            conversationId: currentConversationId,
            content: '',
            role: 'assistant',
            createdAt: Date.now(),
          }
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          aiResponse += chunk;

          // 更新本地状态显示实时响应
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages];
            const lastMessage = updatedMessages[updatedMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = aiResponse;
            }
            return updatedMessages;
          });
        }

        // 流式响应结束后，保存最终消息
        await fetch(`/api/conversations/${currentConversationId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: aiResponse,
            role: 'assistant',
          }),
        });

        // 获取最终的消息列表
        await fetchMessages(currentConversationId);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('发送消息失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#222222] border-l border-gray-700">
      {/* 聊天内容区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-8">
          {messages.length === 0 ? (
            <div className="text-gray-300 text-center">
              <h1 className="text-2xl font-semibold mb-8">DeepSeek AI</h1>
              <p className="text-lg">开始对话吧！</p>
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
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="输入任何问题..."
              className="w-full bg-[#2A2B32] text-white rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 border border-gray-700"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !newMessage.trim()}
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