'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Plus, Trash2, Settings } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  userId: string;
  createdAt: number;
}

interface SidebarProps {
  selectedConversation: string | null;
  onSelectConversation: (id: string) => void;
}

export default function Sidebar({ selectedConversation, onSelectConversation }: SidebarProps) {
  const { isLoaded, userId } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  // 获取会话列表
  const fetchConversations = async () => {
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

  // 创建新会话
  const createConversation = async () => {
    if (!newTitle.trim()) return;
    
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!response.ok) throw new Error('Failed to create conversation');
      
      const newConversation = await response.json();
      
      // 立即更新本地状态
      setConversations(prev => [...prev, newConversation]);
      
      // 选中新创建的会话
      onSelectConversation(newConversation.id);
      
      // 重置创建状态
      setIsCreating(false);
      setNewTitle('');
      
      // 重新获取会话列表以确保数据同步
      fetchConversations();
    } catch (error) {
      console.error('Error creating conversation:', error);
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

  useEffect(() => {
    if (isLoaded && userId) {
      fetchConversations();
    }
  }, [isLoaded, userId]);

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
            onClick={() => setIsCreating(true)}
            className="w-full text-gray-300 hover:bg-gray-700 rounded-lg p-2 flex items-center gap-2"
          >
            <Plus size={20} />
            新对话
          </button>

          {/* 新建会话输入框 */}
          {isCreating && (
            <div className="p-2 bg-gray-700 rounded-lg">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    createConversation();
                  } else if (e.key === 'Escape') {
                    setIsCreating(false);
                    setNewTitle('');
                  }
                }}
                placeholder="输入会话标题..."
                className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                autoFocus
              />
            </div>
          )}

          {/* 会话列表 */}
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`group flex items-center justify-between w-full text-gray-300 hover:bg-gray-700 rounded-lg p-2 cursor-pointer ${
                selectedConversation === conversation.id ? 'bg-gray-700' : ''
              }`}
            >
              <span className="flex-1 truncate">{conversation.title || '新对话'}</span>
              <button
                onClick={(e) => deleteConversation(conversation.id, e)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 底部设置按钮 */}
      <div className="p-4 border-t border-gray-700 mt-auto flex-shrink-0 bg-[#202123]">
        <button className="w-full text-gray-300 hover:bg-gray-700 rounded-lg p-2 flex items-center gap-2">
          <Settings size={20} />
          设置
        </button>
      </div>
    </aside>
  );
} 