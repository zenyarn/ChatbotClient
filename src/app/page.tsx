'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import ChatArea from './components/ChatArea';
import Sidebar from './components/Sidebar';
import { Search, Plus, Share, Settings, LogOut, ChevronRight, ChevronLeft, Menu } from 'lucide-react';

// 定义Conversation类型
interface Conversation {
  id: string;
  title: string;
  userId: string;
  createdAt: number;
  updatedAt?: number;
}

export default function Home() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const { isSignedIn, isLoaded, signOut } = useAuth();
  const [latestConversation, setLatestConversation] = useState<Conversation | null>(null);
  const [sidebarUpdateTrigger, setSidebarUpdateTrigger] = useState<number>(0);
  const [conversations, setConversations] = useState<any[]>([]);
  
  // 添加一个专门的状态存储当前显示的标题
  const [displayTitle, setDisplayTitle] = useState<string>("新对话");
  
  // 添加侧边栏展开状态
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  // 侧边栏切换函数
  const toggleSidebar = useCallback(() => {
    setIsSidebarExpanded(prev => !prev);
  }, []);
  
  // 修改获取当前对话标题方法，直接返回displayTitle状态
  const getCurrentConversationTitle = useCallback(() => {
    return displayTitle;
  }, [displayTitle]);

  // 在选中对话变化时更新displayTitle
  useEffect(() => {
    if (!selectedConversation) {
      setDisplayTitle("新对话");
      return;
    }
    
    // 如果是最新创建的对话，直接使用其标题
    if (latestConversation && latestConversation.id === selectedConversation) {
      setDisplayTitle(latestConversation.title);
      return;
    }
    
    // 否则在conversations数组中查找
    const conversation = conversations.find(c => c.id === selectedConversation);
    if (conversation) {
      setDisplayTitle(conversation.title);
    }
  }, [selectedConversation, conversations, latestConversation]);

  // 处理新建对话 - 关键修改
  const handleConversationCreated = useCallback((conversationId: string, conversation: Conversation) => {
    // 先更新显示标题，确保立即显示
    setDisplayTitle(conversation.title);
    
    // 再更新其他状态
    setSelectedConversation(conversationId);
    setLatestConversation(conversation);
    setSidebarUpdateTrigger(prev => prev + 1);
    setConversations(prev => [conversation, ...prev]);
  }, []);

  // 增强登出处理逻辑
  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        setSelectedConversation(null);
        setDisplayTitle("新对话"); // 登出时重置标题
        setSidebarUpdateTrigger(prev => prev + 1);
      }
    }
  }, [isSignedIn, isLoaded]);

  // 获取所有对话
  const fetchConversations = async () => {
    if (!isSignedIn) {
      setConversations([]);
      return;
    }
    
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        
        // 如果有选中的对话，确保其标题正确显示
        if (selectedConversation) {
          const currentConv = data.find((c: Conversation) => c.id === selectedConversation);
          if (currentConv) {
            setDisplayTitle(currentConv.title);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  // 添加一个useEffect来获取所有对话列表
  useEffect(() => {
    if (isSignedIn) {
      fetchConversations();
    }
  }, [isSignedIn, sidebarUpdateTrigger]);

  // 添加处理删除对话的函数
  const handleConversationDeleted = useCallback((id: string) => {
    // 如果删除的是当前选中的对话，则重置选中状态
    if (id === selectedConversation) {
      setSelectedConversation(null);
      // 如果使用了displayTitle状态，也需要重置
      setDisplayTitle("新对话");
    }
  }, [selectedConversation]);

  // 在使用latestConversation前确保它有所有必需的属性
  const enhancedLatestConversation = latestConversation ? {
    ...latestConversation,
    updatedAt: latestConversation.updatedAt || latestConversation.createdAt || Date.now()
  } : null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 侧边栏 - 根据展开状态设置宽度 */}
      <div 
        className={`${isSidebarExpanded ? 'w-64' : 'w-0'} flex-shrink-0 border-r border-gray-800 bg-[#1A1A1A] flex flex-col h-full transition-all duration-300`}
      >
        {/* 顶部DeepSeek标识 */}
        {isSidebarExpanded && (
          <div className="p-4 border-b border-gray-800 flex items-center">
            <h1 className="text-white text-lg font-semibold">DeepSeek</h1>
          </div>
        )}
        
        {/* 侧边栏内容区域 - 带有滚动条 */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <Suspense fallback={<div className="p-4 text-gray-400">加载中...</div>}>
            <Sidebar 
              selectedConversation={selectedConversation}
              onSelectConversation={(id) => {
                setSelectedConversation(id);
                // 当切换对话时，也尝试立即更新标题
                const conv = conversations.find(c => c.id === id);
                if (conv) {
                  setDisplayTitle(conv.title);
                }
              }}
              updateTrigger={sidebarUpdateTrigger}
              newConversation={enhancedLatestConversation}
              onConversationDeleted={handleConversationDeleted}
            />
          </Suspense>
        </div>
        
        {/* 底部设置按钮 */}
        {isSidebarExpanded && (
          <div className="p-4 border-t border-gray-800">
            <button 
              className="w-full flex items-center gap-2 text-gray-300 hover:bg-gray-800 p-2 rounded-md transition-colors"
              onClick={() => {/* 设置功能暂未实现 */}}
            >
              <Settings size={16} />
              <span className="text-sm">设置</span>
            </button>
            <SignedIn>
              <button 
                onClick={() => signOut?.()}
                className="mt-2 w-full flex items-center gap-2 text-gray-300 hover:bg-gray-800 p-2 rounded-md transition-colors"
              >
                <LogOut size={16} />
                <span className="text-sm">登出</span>
              </button>
            </SignedIn>
          </div>
        )}
      </div>
      
      {/* 侧边栏折叠时的悬停区域 */}
      {!isSidebarExpanded && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-5 bg-transparent z-10 cursor-pointer hover:bg-gray-800 hover:bg-opacity-20"
          onClick={toggleSidebar}
        />
      )}
      
      {/* 主聊天区域 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部操作栏 */}
        <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4">
          <div className="flex items-center">
            {/* 侧边栏伸缩按钮 */}
            <button 
              onClick={toggleSidebar}
              className="p-2 mr-3 text-gray-400 hover:text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              {isSidebarExpanded ? <ChevronLeft size={18} /> : <Menu size={18} />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <SignedIn>
              <UserButton 
                appearance={{
                  elements: {
                    userButtonBox: "hover:opacity-80",
                    userButtonTrigger: "focus:shadow-none",
                    userButtonPopoverCard: "bg-[#1a1a1a] border border-gray-800",
                    userButtonPopoverBackground: "bg-[#1a1a1a]",
                  }
                }}
              />
            </SignedIn>
            <SignedOut>
              <SignInButton>
                <button className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors">
                  登录
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
        
        {/* 聊天区域 - 添加Suspense包装 */}
        <Suspense fallback={<div className="flex-1 flex items-center justify-center">加载聊天区域...</div>}>
          <ChatArea
            conversationId={selectedConversation}
            onConversationCreated={handleConversationCreated}
            isSignedIn={!!isSignedIn}
          />
        </Suspense>
      </main>
    </div>
  );
}
