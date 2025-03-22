// 类型定义
export interface Conversation {
    id: string;
    userId: string;
    title: string;
    createdAt: number;
    updatedAt: number;
}

export interface Message {
    id: string;
    conversationId: string;
    content: string;
    role: 'user' | 'assistant';
    createdAt: number;
}

// 数据库工具接口定义
export interface DbUtils {
    createConversation: (userId: string, title: string) => Promise<string>;
    getConversations: (userId: string) => Promise<Conversation[]>;
    deleteConversation: (conversationId: string) => Promise<void>;
    addMessage: (conversationId: string, content: string, role: 'user' | 'assistant') => Promise<string>;
    getMessages: (conversationId: string) => Promise<Message[]>;
    updateConversationTitle: (conversationId: string, title: string) => Promise<void>;
} 