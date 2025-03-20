import React from 'react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#202123] h-screen flex flex-col">
      {/* 顶部标题 */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-white text-xl font-semibold">ChatGPT</h1>
      </div>
      
      {/* 对话历史列表 */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {/* 示例对话历史 */}
          <button className="w-full text-gray-300 hover:bg-gray-700 rounded-lg p-2 text-left">
            新对话
          </button>
        </div>
      </div>

      {/* 底部设置按钮 */}
      <div className="p-4 border-t border-gray-700">
        <button className="w-full text-gray-300 hover:bg-gray-700 rounded-lg p-2 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          设置
        </button>
      </div>
    </aside>
  );
} 