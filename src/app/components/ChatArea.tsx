'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth, SignInButton } from '@clerk/nextjs';
import { Send, ThumbsUp, ThumbsDown, Copy, Paperclip, Mic, Loader2, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Message } from '@/lib/db';
import crypto from 'crypto';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatAreaProps {
  conversationId: string | null;
  onConversationCreated: (conversationId: string, conversation: { id: string; title: string; userId: string; createdAt: number }) => void;
  isSignedIn: boolean;
}

// 添加新的接口来追踪消息反馈状态
interface MessageFeedback {
  messageId: string;
  liked: boolean;
  disliked: boolean;
}

export default function ChatArea({ conversationId, onConversationCreated, isSignedIn }: ChatAreaProps) {
  const { isLoaded, userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [tempSessionId] = useState(`temp-${Date.now()}`);

  // 添加新的状态来追踪消息反馈
  const [messageFeedback, setMessageFeedback] = useState<Record<string, 'like' | 'dislike' | null>>({});
  // 添加复制反馈状态
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const router = useRouter();

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

  const createNewConversation = async (initialMessage?: string) => {
    if (!isSignedIn) {
      return tempSessionId;
    }
    
    try {
      // 使用提供的初始消息或默认值作为标题
      const title = initialMessage || "新对话";
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) throw new Error('Failed to create conversation');
      
      const newConversation = await response.json();
      
      // 传递完整的对话对象给父组件
      onConversationCreated(newConversation.id, {
        id: newConversation.id,
        title: title, // 使用我们设置的标题
        userId: userId || '',
        createdAt: Date.now()
      });
      
      return newConversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  };

  // 改进流式处理
  const streamAIResponse = async (response: Response, tempAiMessage: Message) => {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('无法读取响应');
    
    let accumulatedContent = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        
        // 过滤掉可能的心跳信号
        const filteredChunk = chunk.replace(/<!-- keep-alive -->/g, '');
        if (filteredChunk.trim()) {
          accumulatedContent += filteredChunk;
          
          // 批量更新UI
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages];
            const aiMessageIndex = updatedMessages.findIndex(
              msg => msg.id === tempAiMessage.id
            );
            
            if (aiMessageIndex !== -1) {
              updatedMessages[aiMessageIndex] = {
                ...updatedMessages[aiMessageIndex],
                content: accumulatedContent
              };
            }
            
            return updatedMessages;
          });
        }
        
        // 小延迟确保UI渲染
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      return accumulatedContent;
    } catch (error) {
      console.error('流式处理错误:', error);
      // 即使错误也返回已累积的内容
      return accumulatedContent;
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;
    
    // 获取当前会话ID
    const currentConversationId = conversationId || tempSessionId;
    
    // 设置加载状态
    setIsLoading(true);
    
    // 创建新消息对象(用户消息)
    const userMessage = {
      id: `temp-${Date.now()}`,
      content: newMessage,
      role: 'user' as 'user',
      conversationId: currentConversationId || '',
      createdAt: Date.now()
    };
    
    // 添加到消息列表
    setMessages(prev => [...prev, userMessage]);
    
    // 清空输入框
    setNewMessage('');
    
    try {
      // 如果没有会话ID，创建新会话
      let actualConversationId = conversationId;
      if (!conversationId) {
        // 使用用户消息作为会话标题，限制长度以避免过长
        const conversationTitle = newMessage.length > 50 
          ? `${newMessage.substring(0, 47)}...` 
          : newMessage;
        
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: conversationTitle })
        });
        
        if (res.ok) {
          const data = await res.json();
          actualConversationId = data.id;
          // 确保传递正确的标题给父组件
          onConversationCreated(data.id, {
            ...data,
            title: conversationTitle // 确保使用我们设置的标题
          });
        } else {
          throw new Error('创建会话失败');
        }
      }
      
      // 保存用户消息到数据库
      await fetch(`/api/conversations/${actualConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          role: 'user'
        })
      });
      
      // 创建临时AI消息对象
      const tempAiMessage = {
        id: `temp-ai-${Date.now()}`,
        content: '',
        role: 'assistant' as 'assistant',
        conversationId: actualConversationId || '',
        createdAt: Date.now()
      };
      
      // 添加临时AI消息到列表
      setMessages(prev => [...prev, tempAiMessage]);
      
      // 修改消息转换和连接部分
      const messagesToSend = [
        ...messages.filter(msg => msg.conversationId === actualConversationId),
        { role: 'user' as 'user', content: newMessage }
      ].map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // 发送请求到我们的API，使用流式处理
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesToSend }),
      });
      
      if (!response.ok) {
        throw new Error('AI回复失败');
      }
      
      // 处理流式响应
      const accumulatedContent = await streamAIResponse(response, tempAiMessage);
      
      // 保存AI回复到数据库
      await fetch(`/api/conversations/${actualConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: accumulatedContent,
          role: 'assistant'
        })
      });
      
      // 修改这里的逻辑，避免对第一条消息进行刷新
      const isFirstMessage = !conversationId; // 判断是否是第一条消息

      if (!isFirstMessage && actualConversationId) {
        // 这是后续消息，可以安全刷新消息列表
        fetchMessages(actualConversationId);
      } else if (isFirstMessage && actualConversationId) {
        // 这是第一条消息，不刷新消息列表，但更新所有消息的 conversationId
        setMessages(prevMessages => {
          return prevMessages.map(msg => {
            // 更新所有消息的 conversationId 为新创建的 ID
            return {
              ...msg,
              conversationId: actualConversationId
            };
          });
        });
        
        // 可选: 在状态更新后立即将更新后的消息保存到本地存储，作为额外备份
        setTimeout(() => {
          const updatedMessages = messages.map(msg => ({
            ...msg,
            conversationId: actualConversationId
          }));
          
          // 可以选择将更新后的消息存储在本地，以防页面刷新
          if (typeof window !== 'undefined') {
            localStorage.setItem(`messages-${actualConversationId}`, 
              JSON.stringify(updatedMessages));
          }
        }, 500);
      }
      
    } catch (error) {
      console.error('发送消息错误:', error);
      alert('发送消息失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 点赞/点踩/复制按钮处理函数
  const handleLike = (messageId: string) => {
    setMessageFeedback(prev => ({
      ...prev,
      [messageId]: prev[messageId] === 'like' ? null : 'like'
    }));
  };

  const handleDislike = (messageId: string) => {
    setMessageFeedback(prev => ({
      ...prev,
      [messageId]: prev[messageId] === 'dislike' ? null : 'dislike'
    }));
  };

  const handleCopy = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedMessageId(messageId);
      // 3秒后重置复制状态
      setTimeout(() => setCopiedMessageId(null), 3000);
    });
  };

  // 显示简单成功提示的函数
  const showToast = (message: string) => {
    // 简单的替代toast的方式
    alert(message);
  };

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
              {messages.map((message, index) => {
                // 获取当前消息的反馈状态
                const feedback = messageFeedback[message.id] || null;
                const isCopied = copiedMessageId === message.id;
                
                return (
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
                        <div className={`p-2 ${
                          message.role === 'user' 
                            ? 'bg-[#262626] text-white rounded-2xl rounded-tr-sm'
                            : 'bg-[#2D2D2D] text-white rounded-2xl rounded-tl-sm'
                        } `}>
                        {/* } message-content`}> */}
                          {message.role === 'user' ? (
                            <div className="prose prose-invert max-w-none">
                              <div className="whitespace-pre-wrap">
                                {message.content}
                              </div>
                            </div>
                          ) : (
                            <MarkdownRenderer content={message.content} />
                          )}
                        </div>
                        
                        {/* 交互按钮 - 更新为有功能的版本 */}
                        {message.role === 'assistant' && (
                          <div className="flex items-center mt-2 gap-2 px-1">
                            <button 
                              onClick={() => handleLike(message.id)}
                              className={`p-1 rounded transition-colors ${
                                feedback === 'like' 
                                  ? 'text-blue-500 bg-blue-500 bg-opacity-10' 
                                  : 'text-gray-500 hover:text-white'
                              }`}
                              aria-label="点赞"
                              title="点赞"
                            >
                              <ThumbsUp size={14} />
                            </button>
                            <button 
                              onClick={() => handleDislike(message.id)}
                              className={`p-1 rounded transition-colors ${
                                feedback === 'dislike' 
                                  ? 'text-red-500 bg-red-500 bg-opacity-10' 
                                  : 'text-gray-500 hover:text-white'
                              }`}
                              aria-label="点踩"
                              title="点踩"
                            >
                              <ThumbsDown size={14} />
                            </button>
                            <button 
                              onClick={() => handleCopy(message.id, message.content)}
                              className={`p-1 rounded transition-colors ${
                                isCopied
                                  ? 'text-green-500 bg-green-500 bg-opacity-10' 
                                  : 'text-gray-500 hover:text-white'
                              }`}
                              aria-label="复制"
                              title="复制消息"
                            >
                              {isCopied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )})}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>
      
      {/* 输入框区域 */}
      <div className="border-t border-gray-800 bg-[#1E1E1E] p-3">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendMessage} className="relative">
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
                    if (newMessage.trim()) handleSendMessage();
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