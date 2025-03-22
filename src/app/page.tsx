'use client';

import { useState, useEffect } from 'react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import ChatArea from './components/ChatArea';
import Sidebar from './components/Sidebar';

export default function Home() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const { isSignedIn, isLoaded } = useAuth();

  const handleConversationCreated = (newConversationId: string) => {
    setSelectedConversation(newConversationId);
  };

  // 当用户登出时重置对话状态
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setSelectedConversation(null);
    }
  }, [isSignedIn, isLoaded]);

  return (
    <div className="flex h-screen bg-[#1a1a1a]">
      {/* 侧边栏只在登录时显示 */}
      <SignedIn>
        <Sidebar 
          selectedConversation={selectedConversation}
          onSelectConversation={setSelectedConversation}
        />
      </SignedIn>
      
      <main className={`flex-1 flex flex-col bg-[#1a1a1a] ${isSignedIn ? 'ml-64' : ''}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#1a1a1a]">
          {/* 未登录时显示产品标题在左侧 */}
          <div>
            <SignedOut>
              <h1 className="text-white text-xl font-semibold">DeepSeek 聊天</h1>
            </SignedOut>
            {/* 登录状态下左侧留空 */}
            <SignedIn>
              <div></div>
            </SignedIn>
          </div>
          
          {/* 右侧显示用户按钮和登录选项 */}
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
              <div className="flex items-center space-x-2">
                <p className="text-gray-400 text-sm hidden md:block">登录以保存对话历史</p>
                <SignInButton>
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                    登录
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button className="border border-gray-600 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    注册
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>
          </div>
        </div>
        
        {/* 所有用户都显示聊天区域 */}
        <ChatArea
          conversationId={selectedConversation}
          onConversationCreated={handleConversationCreated}
          isSignedIn={!!isSignedIn}
        />
      </main>
    </div>
  );
}
