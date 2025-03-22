import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Conversation, Message, DbUtils } from './types';

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
try {
    initDb();
} catch (error) {
    console.error('SQLite数据库初始化失败:', error);
}

// 数据库操作函数 - 返回Promise以保持接口一致性
export const dbUtils: DbUtils = {
    // 会话相关操作
    createConversation: async (userId: string, title: string): Promise<string> => {
        return new Promise((resolve) => {
            const stmt = db.prepare(`
                INSERT INTO conversations (id, user_id, title, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
            `);
            const now = Date.now();
            const id = crypto.randomUUID();
            stmt.run(id, userId, title, now, now);
            resolve(id);
        });
    },

    getConversations: async (userId: string): Promise<Conversation[]> => {
        return new Promise((resolve) => {
            const stmt = db.prepare(`
                SELECT id, user_id as userId, title, created_at as createdAt, updated_at as updatedAt
                FROM conversations
                WHERE user_id = ?
                ORDER BY updated_at DESC
            `);
            resolve(stmt.all(userId) as Conversation[]);
        });
    },

    deleteConversation: async (conversationId: string): Promise<void> => {
        return new Promise((resolve) => {
            const stmt = db.prepare(`
                DELETE FROM conversations
                WHERE id = ?
            `);
            stmt.run(conversationId);
            resolve();
        });
    },

    // 消息相关操作
    addMessage: async (conversationId: string, content: string, role: 'user' | 'assistant'): Promise<string> => {
        return new Promise((resolve) => {
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
            
            resolve(id);
        });
    },

    getMessages: async (conversationId: string): Promise<Message[]> => {
        return new Promise((resolve) => {
            const stmt = db.prepare(`
                SELECT id, conversation_id as conversationId, content, role, created_at as createdAt
                FROM messages
                WHERE conversation_id = ?
                ORDER BY created_at ASC
            `);
            resolve(stmt.all(conversationId) as Message[]);
        });
    },

    // 新增更新会话标题的函数
    updateConversationTitle: async (conversationId: string, title: string): Promise<void> => {
        return new Promise((resolve) => {
            const stmt = db.prepare(`
                UPDATE conversations
                SET title = ?, updated_at = ?
                WHERE id = ?
            `);
            stmt.run(title, Date.now(), conversationId);
            resolve();
        });
    }
};

export default db; 