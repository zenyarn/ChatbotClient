'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth, SignInButton } from '@clerk/nextjs';
import { Send, ThumbsUp, ThumbsDown, Copy, Paperclip, Mic, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: number;
}

interface ChatAreaProps {
  conversationId: string | null;
  onConversationCreated: (conversationId: string, conversation: { id: string; title: string; userId: string; createdAt: number }) => void;
  isSignedIn: boolean;
}

export default function ChatArea({ conversationId, onConversationCreated, isSignedIn }: ChatAreaProps) {
  const { isLoaded, userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [tempSessionId] = useState(`temp-${Date.now()}`);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 获取消息历史
  const fetchMessages = async (conversationId: string) => {
    if (!isSignedIn) return;
    
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

  // 添加新的useEffect来监听isSignedIn的变化
  useEffect(() => {
    // 当用户登出时(isSignedIn变为false)，清空消息列表
    if (!isSignedIn) {
      setMessages([]);
    }
  }, [isSignedIn]);

  // 修改现有的useEffect，确保在登录状态变化时响应
  useEffect(() => {
    if (isLoaded && userId && conversationId && isSignedIn) {
      fetchMessages(conversationId);
    } else if (!isSignedIn) {
      // 确保在未登录状态下清空消息
      setMessages([]);
    }
  }, [isLoaded, userId, conversationId, isSignedIn]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createNewConversation = async () => {
    if (!isSignedIn) {
      return tempSessionId;
    }
    
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
        body: JSON.stringify({ title: timestamp }),
      });

      if (!response.ok) throw new Error('Failed to create conversation');
      
      const newConversation = await response.json();
      
      // 传递完整的对话对象给父组件，而不仅仅是ID
      onConversationCreated(newConversation.id, {
        id: newConversation.id,
        title: timestamp,
        userId: userId || '',
        createdAt: Date.now()
      });
      
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

      // 添加用户消息到本地状态
      const userMessage: Message = {
        id: `local-${Date.now()}`,
        conversationId: currentConversationId,
        content: messageToSend,
        role: 'user',
        createdAt: Date.now()
      };
      
      setMessages(prevMessages => [...prevMessages, userMessage]);
      
      // 如果用户已登录，则保存用户消息到数据库
      if (isSignedIn) {
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
      }

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

        // 登录用户才保存到数据库
        if (isSignedIn) {
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
      }
    } catch (error) {
      console.error('Error:', error);
      alert('发送消息失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 在useEffect中监听conversationId的变化
  useEffect(() => {
    if (conversationId) {
      // 获取消息的代码保持不变...
      fetchMessages(conversationId);
    } else {
      // 当conversationId为null时，清空消息列表
      setMessages([]);
    }
  }, [conversationId]);

  return (
    <div className="flex-1 flex flex-col bg-[#1E1E1E] h-full overflow-hidden">
      {/* 聊天内容区域 */}
      <div className="flex-1 overflow-y-auto bg-[#1E1E1E] scroll-smooth">
        <div className="max-w-3xl mx-auto py-8 px-4">
          {messages.length === 0 ? (
            <div className="text-center pt-10">
              <h1 className="text-3xl font-bold text-white mb-6">DeepSeek AI</h1>
              <p className="text-xl text-gray-300 mb-10">有什么可以帮助您？</p>
              {!isSignedIn && (
                <div className="max-w-md mx-auto">
                  <p className="text-gray-400 text-sm border border-gray-800 rounded-lg p-4 bg-gray-900 bg-opacity-50">
                    您当前处于访客模式。对话不会被保存，页面刷新后将丢失。<br/>
                    <SignInButton>
                      <span className="text-blue-500 hover:underline cursor-pointer">登录</span>
                    </SignInButton>
                    &nbsp;以保存对话历史。
                  </p>
                </div>
              )}
              
              {/* 快速提示卡片 */}
              <div className="grid grid-cols-2 gap-3 mt-8 max-w-2xl mx-auto">
                {[
                  "给我写一个Python快速排序算法",
                  "解释量子计算的基本原理",
                  "帮我起草一封工作邮件",
                  "创建一个健康饮食的周计划"
                ].map(prompt => (
                  <button 
                    key={prompt}
                    onClick={() => {
                      setNewMessage(prompt);
                      setTimeout(() => {
                        const form = document.querySelector('form');
                        if (form) form.dispatchEvent(new Event('submit', { cancelable: true }));
                      }, 100);
                    }}
                    className="text-left p-4 bg-[#202123] rounded-xl hover:bg-[#2b2c2f] transition-colors text-sm text-gray-300"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex items-start ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* 头像 */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 
                        ${message.role === 'user' 
                          ? 'bg-gray-700 bg-opacity-80 text-gray-300' 
                          : 'bg-gray-800 bg-opacity-80 text-gray-200'}`}>
                        {message.role === 'user' 
                          ? <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                          : <span className="text-xs font-semibold">AI</span>}
                      </div>
                      
                      {/* 消息内容 */}
                      <div>
                        <div className={`p-4 ${
                          message.role === 'user' 
                            ? 'bg-[#262626] text-white rounded-2xl rounded-tr-sm'
                            : 'bg-[#2D2D2D] text-white rounded-2xl rounded-tl-sm'
                        }`}>
                          <div className="prose prose-invert max-w-none">
                            <div className="whitespace-pre-wrap">
                              {message.content}
                            </div>
                          </div>
                        </div>
                        
                        {/* 交互按钮 */}
                        {message.role === 'assistant' && (
                          <div className="flex items-center mt-2 gap-2 px-1">
                            <button className="p-1 text-gray-500 hover:text-white rounded transition-colors">
                              <ThumbsUp size={14} />
                            </button>
                            <button className="p-1 text-gray-500 hover:text-white rounded transition-colors">
                              <ThumbsDown size={14} />
                            </button>
                            <button className="p-1 text-gray-500 hover:text-white rounded transition-colors">
                              <Copy size={14} />
                            </button>
                          </div>
                        )}
                      </div>
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
      <div className="border-t border-gray-800 bg-[#1E1E1E] p-3">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="rounded-lg border border-gray-700 bg-[#252525] overflow-hidden focus-within:border-gray-500 transition-colors">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="输入消息..."
                className="w-full bg-transparent text-white p-3 resize-none min-h-[40px] max-h-[120px] focus:outline-none scroll-smooth"
                rows={1}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (newMessage.trim()) handleSubmit(e);
                  }
                }}
              />
              
              <div className="py-1 px-2 flex items-center justify-between border-t border-gray-700">
                <div className="flex items-center gap-1">
                  <button type="button" className="p-1 text-gray-500 hover:text-white rounded transition-colors">
                    <Paperclip size={14} />
                  </button>
                  <button type="button" className="p-1 text-gray-500 hover:text-white rounded transition-colors">
                    <Mic size={14} />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !newMessage.trim()}
                  className={`p-1.5 rounded-md ${
                    newMessage.trim() && !isLoading
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                      : 'bg-gray-800 text-gray-500'
                  } transition-colors`}
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </div>
            
            <div className="text-xs text-center text-gray-600 mt-1">
              DeepSeek AI 可能会产生错误信息。考虑验证重要信息。
              {!isSignedIn && (
                <span className="block mt-0.5">您处于访客模式，此对话不会被保存。</span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 