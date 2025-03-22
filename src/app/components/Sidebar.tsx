'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Plus, Trash2, Settings, LogOut, Check, X } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  userId: string;
  createdAt: number;
}

interface SidebarProps {
  selectedConversation: string | null;
  onSelectConversation: (id: string) => void;
  updateTrigger?: number;
  newConversation: Conversation | null;
}

export default function Sidebar({ 
  selectedConversation, 
  onSelectConversation, 
  updateTrigger = 0,
  newConversation
}: SidebarProps) {
  const { isLoaded, userId, signOut } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null); // 追踪正在编辑的对话ID
  const [editingTitle, setEditingTitle] = useState(''); // 存储编辑中的标题
  const editInputRef = useRef<HTMLInputElement>(null); // 引用编辑输入框
  const latestConversationRef = useRef<Conversation | null>(null);
  
  // 获取会话列表
  const fetchConversations = async () => {
    if (!isLoaded || !userId) {
      setConversations([]);
      return;
    }
    
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // 更新会话标题
  const updateConversationTitle = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        // 更新本地状态
        setConversations(prev => 
          prev.map(conv => 
            conv.id === id ? { ...conv, title: newTitle } : conv
          )
        );
      } else {
        throw new Error('Failed to update conversation title');
      }
    } catch (error) {
      console.error('Error updating conversation title:', error);
    }
  };

  // 开始编辑会话名称
  const startEditing = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止触发选择会话
    setEditingId(id);
    setEditingTitle(currentTitle);
    // 等待下一帧DOM更新后聚焦输入框
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 0);
  };

  // 保存编辑
  const saveEditing = () => {
    if (editingId) {
      updateConversationTitle(editingId, editingTitle);
      setEditingId(null);
    }
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditingId(null);
  };

  // 新增自动创建对话的函数
  const createNewConversation = async () => {
    try {
      // 使用时间戳创建默认会话名称
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
      
      // 选中新创建的会话
      onSelectConversation(newConversation.id);
      
      // 重新获取会话列表以确保数据同步
      fetchConversations();
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditing();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  // 删除会话
  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConversations(prev => prev.filter(conv => conv.id !== id));
        if (selectedConversation === id) {
          onSelectConversation('');
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  // 处理登出
  const handleSignOut = async () => {
    try {
      // 清空本地会话列表
      setConversations([]);
      // 清除选中的会话（允许继续在游客模式下聊天）
      onSelectConversation('');
      // 执行登出
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      if (userId) {
        // 仅当没有新对话时才完全刷新列表
        fetchConversations();
      } else {
        // 如果没有用户ID，清空会话列表
        setConversations([]);
      }
    }
  }, [isLoaded, userId]);
  
  // 添加新的useEffect来处理新对话的添加
  useEffect(() => {
    // 当updateTrigger变化且有newConversation时，直接将新对话添加到列表中
    if (updateTrigger > 0 && latestConversationRef.current) {
      const newConv = latestConversationRef.current;
      
      // 检查对话是否已存在
      if (!conversations.some(conv => conv.id === newConv.id)) {
        // 平滑添加新对话到列表顶部
        setConversations(prev => [newConv, ...prev]);
      }
      
      // 清空引用以避免重复添加
      latestConversationRef.current = null;
    }
  }, [updateTrigger]);

  // 点击文档其他地方时取消编辑
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editInputRef.current && !editInputRef.current.contains(event.target as Node)) {
        saveEditing();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingId, editingTitle]);

  // 添加处理新对话的useEffect
  useEffect(() => {
    // 当收到新对话时，将其添加到列表顶部
    if (newConversation && newConversation.id) {
      // 检查是否已存在该对话
      const exists = conversations.some(conv => conv.id === newConversation.id);
      
      if (!exists) {
        // 使用函数式更新确保获取最新状态
        setConversations(prev => [newConversation, ...prev]);
      }
    }
  }, [newConversation]);

  return (
    <aside className="w-64 bg-[#202123] h-screen flex flex-col fixed">
      {/* 顶部标题 */}
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <h1 className="text-white text-xl font-semibold">DeepSeek</h1>
      </div>
      
      {/* 对话历史列表 */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <div className="space-y-2">
          {/* 新建会话按钮 */}
          <button
            onClick={createNewConversation}
            className="w-full text-gray-300 hover:bg-gray-700 rounded-lg p-2 flex items-center gap-2"
          >
            <Plus size={20} />
            新对话
          </button>

          {/* 会话列表 */}
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => editingId !== conversation.id && onSelectConversation(conversation.id)}
              className={`group flex items-center justify-between w-full text-gray-300 hover:bg-gray-700 rounded-lg p-2 cursor-pointer ${
                selectedConversation === conversation.id ? 'bg-gray-700' : ''
              } transition-all duration-200 ease-in-out animate-fadeIn`}
            >
              {editingId === conversation.id ? (
                // 编辑状态
                <div 
                  className="flex-1 flex items-center gap-1" 
                  onClick={e => e.stopPropagation()}
                >
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                  />
                  <button 
                    onClick={saveEditing}
                    className="text-green-500 hover:text-green-400"
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    onClick={cancelEditing}
                    className="text-red-500 hover:text-red-400"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                // 正常显示状态
                <span 
                  className="flex-1 truncate"
                  onDoubleClick={(e) => startEditing(conversation.id, conversation.title, e)}
                >
                  {conversation.title || '新对话'}
                </span>
              )}
              
              {editingId !== conversation.id && (
                <button
                  onClick={(e) => deleteConversation(conversation.id, e)}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 底部按钮区域 */}
      <div className="p-4 border-t border-gray-700 mt-auto flex-shrink-0 bg-[#202123] space-y-2">
        <button className="w-full text-gray-300 hover:bg-gray-700 rounded-lg p-2 flex items-center gap-2">
          <Settings size={20} />
          设置
        </button>
        <button 
          onClick={handleSignOut}
          className="w-full text-gray-300 hover:bg-gray-700 rounded-lg p-2 flex items-center gap-2 text-left">
          <LogOut size={20} />
          登出
        </button>
      </div>
    </aside>
  );
} 