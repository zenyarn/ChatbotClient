'use client';

import { useState } from 'react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import ChatArea from './components/ChatArea';
import Sidebar from './components/Sidebar';

export default function Home() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const handleConversationCreated = (newConversationId: string) => {
    setSelectedConversation(newConversationId);
  };

  return (
    <div className="flex h-screen bg-[#1a1a1a]">
      <Sidebar 
        selectedConversation={selectedConversation}
        onSelectConversation={setSelectedConversation}
      />
      <main className="flex-1 flex flex-col bg-[#1a1a1a]">
        <div className="flex items-center justify-end p-4 gap-2 border-b border-gray-800 bg-[#1a1a1a]">
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
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                登录
              </button>
            </SignInButton>
            <SignUpButton>
              <button className="border border-gray-600 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                注册
              </button>
            </SignUpButton>
          </SignedOut>
        </div>
        <ChatArea
          conversationId={selectedConversation}
          onConversationCreated={handleConversationCreated}
        />
      </main>
    </div>
  );
}
