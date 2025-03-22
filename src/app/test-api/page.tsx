'use client';

import { useState, useEffect } from 'react';

interface Conversation {
  id: string;
  title: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export default function TestApiPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 获取所有会话
  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        console.log('Fetched conversations:', data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // 创建新会话
  const createConversation = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      });
      
      setLoading(false);
      
      if (response.ok) {
        const data = await response.json();
        setResult({ type: 'create', status: response.status, data });
        setNewTitle('');
        fetchConversations();
      } else {
        setResult({ 
          type: 'create', 
          status: response.status, 
          error: await response.text() 
        });
      }
    } catch (error) {
      setLoading(false);
      console.error('Error creating conversation:', error);
      setResult({ type: 'create', error: String(error) });
    }
  };

  // 获取特定会话
  const getConversation = async () => {
    if (!selectedId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/conversations/${selectedId}`);
      setLoading(false);
      
      if (response.ok) {
        const data = await response.json();
        setResult({ type: 'get', status: response.status, data });
      } else {
        setResult({ 
          type: 'get', 
          status: response.status, 
          error: await response.text() 
        });
      }
    } catch (error) {
      setLoading(false);
      console.error('Error fetching conversation:', error);
      setResult({ type: 'get', error: String(error) });
    }
  };

  // 删除会话
  const deleteConversation = async () => {
    if (!selectedId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/conversations/${selectedId}`, {
        method: 'DELETE',
      });
      setLoading(false);
      
      if (response.ok) {
        setResult({ 
          type: 'delete', 
          status: response.status, 
          data: 'Successfully deleted' 
        });
        fetchConversations();
      } else {
        setResult({ 
          type: 'delete', 
          status: response.status, 
          error: await response.text() 
        });
      }
    } catch (error) {
      setLoading(false);
      console.error('Error deleting conversation:', error);
      setResult({ type: 'delete', error: String(error) });
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API 测试</h1>
      
      {/* 创建会话 */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">创建会话</h2>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="会话标题"
            className="border p-2 flex-grow"
          />
          <button 
            onClick={createConversation}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
            disabled={loading || !newTitle}
          >
            创建
          </button>
        </div>
      </div>
      
      {/* 会话列表 */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">会话列表</h2>
        <button 
          onClick={fetchConversations}
          className="bg-gray-200 text-gray-800 px-3 py-1 rounded mb-2"
        >
          刷新
        </button>
        
        <div className="border rounded divide-y">
          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <div 
                key={conv.id} 
                className="p-2 flex justify-between items-center hover:bg-gray-100"
                onClick={() => setSelectedId(conv.id)}
              >
                <div className={selectedId === conv.id ? "font-bold" : ""}>
                  {conv.title} <span className="text-xs text-gray-500">({conv.id.slice(0,8)}...)</span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(conv.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">无会话记录</div>
          )}
        </div>
      </div>
      
      {/* 操作测试 */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">API操作测试</h2>
        <div className="flex gap-2 mb-4">
          <button 
            onClick={getConversation}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
            disabled={loading || !selectedId}
          >
            获取会话
          </button>
          <button 
            onClick={deleteConversation}
            className="bg-red-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
            disabled={loading || !selectedId}
          >
            删除会话
          </button>
        </div>
        
        <div className="mt-4">
          <h3 className="font-semibold">已选ID:</h3>
          <div className="text-sm bg-gray-100 p-2 rounded">
            {selectedId || '未选择'}
          </div>
        </div>
      </div>
      
      {/* 结果显示 */}
      {result && (
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">操作结果</h2>
          <div className="bg-gray-100 p-2 rounded overflow-auto max-h-60">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
} 