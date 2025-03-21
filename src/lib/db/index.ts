import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// 创建数据库连接
const db = new Database('sqlite.db');

// 初始化数据库
const initDb = () => {
    const initSQL = fs.readFileSync(
        path.join(process.cwd(), 'src/lib/db/init.sql'),
        'utf-8'
    );
    db.exec(initSQL);
};

// 确保数据库表已创建
initDb();

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

// 数据库操作函数
export const dbUtils = {
    // 会话相关操作
    createConversation: (userId: string, title: string) => {
        const stmt = db.prepare(`
            INSERT INTO conversations (id, user_id, title, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        `);
        const now = Date.now();
        const id = crypto.randomUUID();
        stmt.run(id, userId, title, now, now);
        return id;
    },

    getConversations: (userId: string) => {
        const stmt = db.prepare(`
            SELECT id, user_id as userId, title, created_at as createdAt, updated_at as updatedAt
            FROM conversations
            WHERE user_id = ?
            ORDER BY updated_at DESC
        `);
        return stmt.all(userId) as Conversation[];
    },

    deleteConversation: (conversationId: string) => {
        const stmt = db.prepare(`
            DELETE FROM conversations
            WHERE id = ?
        `);
        stmt.run(conversationId);
    },

    // 消息相关操作
    addMessage: (conversationId: string, content: string, role: 'user' | 'assistant') => {
        const stmt = db.prepare(`
            INSERT INTO messages (id, conversation_id, content, role, created_at)
            VALUES (?, ?, ?, ?, ?)
        `);
        const now = Date.now();
        const id = crypto.randomUUID();
        stmt.run(id, conversationId, content, role, now);
        
        // 更新会话的更新时间
        db.prepare(`
            UPDATE conversations
            SET updated_at = ?
            WHERE id = ?
        `).run(now, conversationId);
        
        return id;
    },

    getMessages: (conversationId: string) => {
        const stmt = db.prepare(`
            SELECT id, conversation_id as conversationId, content, role, created_at as createdAt
            FROM messages
            WHERE conversation_id = ?
            ORDER BY created_at ASC
        `);
        return stmt.all(conversationId) as Message[];
    }
};

export default db; 