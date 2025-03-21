'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    createdAt: number;
}

interface Conversation {
    id: string;
    title: string;
    userId: string;
    createdAt: number;
    updatedAt: number;
}

export default function TestPage() {
    const { isLoaded, userId } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [newMessage, setNewMessage] = useState('');

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

    // 获取消息列表
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

    // 创建新会话
    const createConversation = async () => {
        try {
            const response = await fetch('/api/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title: newTitle }),
            });
            if (response.ok) {
                setNewTitle('');
                fetchConversations();
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
        }
    };

    // 发送新消息
    const sendMessage = async () => {
        if (!selectedConversation || !newMessage) return;

        try {
            const response = await fetch(`/api/conversations/${selectedConversation}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: newMessage,
                    role: 'user'
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            setNewMessage('');
            await fetchMessages(selectedConversation);
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        }
    };

    // 删除会话
    const deleteConversation = async (id: string) => {
        try {
            const response = await fetch(`/api/conversations?id=${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                if (selectedConversation === id) {
                    setSelectedConversation(null);
                    setMessages([]);
                }
                fetchConversations();
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    };

    // 选择会话
    const selectConversation = (id: string) => {
        setSelectedConversation(id);
        fetchMessages(id);
    };

    useEffect(() => {
        if (isLoaded && userId) {
            fetchConversations();
        }
    }, [isLoaded, userId]);

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    if (!userId) {
        return <div>Please sign in to test the conversation features.</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">会话管理测试</h1>
            
            <div className="mb-4">
                <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="输入会话标题"
                    className="border p-2 mr-2"
                />
                <button
                    onClick={createConversation}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    创建会话
                </button>
            </div>

            <div className="flex gap-4">
                <div className="w-1/3">
                    <h2 className="text-xl font-bold mb-2">会话列表：</h2>
                    {conversations.map((conv) => (
                        <div 
                            key={conv.id} 
                            className={`flex items-center justify-between border p-2 mb-2 cursor-pointer ${
                                selectedConversation === conv.id ? 'bg-blue-100' : ''
                            }`}
                            onClick={() => selectConversation(conv.id)}
                        >
                            <span>{conv.title}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteConversation(conv.id);
                                }}
                                className="bg-red-500 text-white px-2 py-1 rounded"
                            >
                                删除
                            </button>
                        </div>
                    ))}
                </div>

                <div className="w-2/3">
                    <h2 className="text-xl font-bold mb-2">消息列表：</h2>
                    {selectedConversation ? (
                        <>
                            <div className="border p-4 mb-4 h-[400px] overflow-y-auto">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`mb-2 p-2 rounded ${
                                            msg.role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
                                        }`}
                                        style={{ maxWidth: '80%' }}
                                    >
                                        <div className="text-sm text-gray-600">{msg.role}</div>
                                        <div>{msg.content}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="输入消息"
                                    className="border p-2 flex-1"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            sendMessage();
                                        }
                                    }}
                                />
                                <button
                                    onClick={sendMessage}
                                    className="bg-blue-500 text-white px-4 py-2 rounded"
                                >
                                    发送
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-gray-500">请选择一个会话</div>
                    )}
                </div>
            </div>
        </div>
    );
} 