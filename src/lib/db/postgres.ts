import { Pool } from 'pg';
import crypto from 'crypto';
import { Conversation, Message, DbUtils } from './types';

// 从环境变量获取PostgreSQL连接URL
const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('PostgreSQL连接URL未设置！请设置POSTGRES_URL环境变量');
}

// 创建连接池
const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// 添加getPool函数，返回现有连接池
function getPool(): Pool {
  return pool;
}

// 连接成功时打印信息
pool.on('connect', () => {
  console.log('PostgreSQL连接初始化成功');
});

// 连接错误时打印详细信息
pool.on('error', (err) => {
  console.error('PostgreSQL连接错误:', err);
  console.error('连接字符串:', connectionString ? '已设置（隐藏详情）' : '未设置');
  console.error('环境:', process.env.NODE_ENV);
});

// 简单的内存缓存实现
const conversationsCache = new Map<string, Conversation[]>();
const messagesCache = new Map<string, Message[]>();

// Helper functions that return promises
const asyncUtils = {
  async createConversation(userId: string, title: string): Promise<string> {
    const id = crypto.randomUUID();
    const pool = getPool();
    const now = new Date();
    
    try {
      await pool.query(
        'INSERT INTO conversations(id, user_id, title, created_at, updated_at) VALUES($1, $2, $3, $4, $5)',
        [id, userId, title, now, now]
      );
      console.log(`会话创建成功: ${id}`);
      
      // 清除该用户的会话缓存，以便下次查询获取最新数据
      conversationsCache.delete(userId);
      
      return id;
    } catch (error) {
      console.error(`会话创建失败: ${id}`, error);
      throw error;
    }
  },
  
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const result = await getPool().query(
        'SELECT id, user_id as "userId", title, extract(epoch from created_at) * 1000 as "createdAt", extract(epoch from updated_at) * 1000 as "updatedAt" FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC',
        [userId]
      );
      
      // 添加显式类型声明
      interface RowType {
        id: string;
        userId: string;
        title: string;
        createdAt: string;
        updatedAt: string;
      }
      
      const conversations = result.rows.map((row: RowType) => ({
        ...row,
        createdAt: Number(row.createdAt),
        updatedAt: Number(row.updatedAt)
      }));
      
      console.log(`获取到${conversations.length}个会话`);
      
      // 更新缓存
      conversationsCache.set(userId, conversations);
      
      return conversations;
    } catch (error) {
      console.error(`获取会话失败`, error);
      return [];
    }
  },
  
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await getPool().query('DELETE FROM conversations WHERE id = $1', [conversationId]);
      
      // 清除相关缓存
      messagesCache.delete(conversationId);
      // 由于我们不知道用户ID，因此无法清除特定用户的会话缓存
      // 最简单的方法是清除所有会话缓存
      conversationsCache.clear();
      
      console.log(`会话删除成功: ${conversationId}`);
    } catch (error) {
      console.error(`会话删除失败: ${conversationId}`, error);
      throw error;
    }
  },
  
  async addMessage(conversationId: string, content: string, role: 'user' | 'assistant'): Promise<string> {
    const id = crypto.randomUUID();
    const pool = getPool();
    const now = new Date();
    
    try {
      await Promise.all([
        pool.query(
          'INSERT INTO messages(id, conversation_id, content, role, created_at) VALUES($1, $2, $3, $4, $5)',
          [id, conversationId, content, role, now]
        ),
        pool.query(
          'UPDATE conversations SET updated_at = $1 WHERE id = $2',
          [now, conversationId]
        )
      ]);
      
      // 清除相关缓存
      messagesCache.delete(conversationId);
      // 清除所有会话缓存，因为更新时间已变更
      conversationsCache.clear();
      
      console.log(`消息添加成功: ${id}`);
      return id;
    } catch (error) {
      console.error(`消息添加失败: ${id}`, error);
      throw error;
    }
  },
  
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const result = await getPool().query(
        'SELECT id, conversation_id as "conversationId", content, role, extract(epoch from created_at) * 1000 as "createdAt" FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
        [conversationId]
      );
      
      const messages = result.rows.map(row => ({
        ...row,
        createdAt: Number(row.createdAt)
      }));
      
      console.log(`获取到${messages.length}条消息`);
      
      // 更新缓存
      messagesCache.set(conversationId, messages);
      
      return messages;
    } catch (error) {
      console.error(`获取消息失败`, error);
      return [];
    }
  },
  
  async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    try {
      await getPool().query(
        'UPDATE conversations SET title = $1, updated_at = NOW() WHERE id = $2',
        [title, conversationId]
      );
      
      // 清除所有会话缓存，因为标题已更新
      conversationsCache.clear();
      
      console.log(`会话标题更新成功: ${conversationId}`);
    } catch (error) {
      console.error(`会话标题更新失败: ${conversationId}`, error);
      throw error;
    }
  }
};

// 导出符合DbUtils接口的异步工具
export const dbUtils: DbUtils = {
  createConversation: async (userId: string, title: string): Promise<string> => {
    const id = crypto.randomUUID();
    const pool = getPool();
    const now = new Date();
    
    try {
      await pool.query(
        'INSERT INTO conversations(id, user_id, title, created_at, updated_at) VALUES($1, $2, $3, $4, $5)',
        [id, userId, title, now, now]
      );
      console.log(`会话创建成功: ${id}`);
      return id;
    } catch (error) {
      console.error(`会话创建失败: ${id}`, error);
      throw error;
    }
  },
  
  getConversations: async (userId: string): Promise<Conversation[]> => {
    try {
      const result = await getPool().query(
        'SELECT id, user_id as "userId", title, extract(epoch from created_at) * 1000 as "createdAt", extract(epoch from updated_at) * 1000 as "updatedAt" FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC',
        [userId]
      );
      
      const conversations = result.rows.map(row => ({
        ...row,
        createdAt: Number(row.createdAt),
        updatedAt: Number(row.updatedAt)
      }));
      
      console.log(`获取到${conversations.length}个会话`);
      return conversations;
    } catch (error) {
      console.error(`获取会话失败`, error);
      return [];
    }
  },
  
  deleteConversation: async (conversationId: string): Promise<void> => {
    try {
      await getPool().query('DELETE FROM conversations WHERE id = $1', [conversationId]);
      console.log(`会话删除成功: ${conversationId}`);
    } catch (error) {
      console.error(`会话删除失败: ${conversationId}`, error);
      throw error;
    }
  },
  
  addMessage: async (conversationId: string, content: string, role: 'user' | 'assistant'): Promise<string> => {
    const id = crypto.randomUUID();
    const pool = getPool();
    const now = new Date();
    
    try {
      await Promise.all([
        pool.query(
          'INSERT INTO messages(id, conversation_id, content, role, created_at) VALUES($1, $2, $3, $4, $5)',
          [id, conversationId, content, role, now]
        ),
        pool.query(
          'UPDATE conversations SET updated_at = $1 WHERE id = $2',
          [now, conversationId]
        )
      ]);
      
      console.log(`消息添加成功: ${id}`);
      return id;
    } catch (error) {
      console.error(`消息添加失败: ${id}`, error);
      throw error;
    }
  },
  
  getMessages: async (conversationId: string): Promise<Message[]> => {
    try {
      const result = await getPool().query(
        'SELECT id, conversation_id as "conversationId", content, role, extract(epoch from created_at) * 1000 as "createdAt" FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
        [conversationId]
      );
      
      const messages = result.rows.map(row => ({
        ...row,
        createdAt: Number(row.createdAt)
      }));
      
      console.log(`获取到${messages.length}条消息`);
      return messages;
    } catch (error) {
      console.error(`获取消息失败`, error);
      return [];
    }
  },
  
  updateConversationTitle: async (conversationId: string, title: string): Promise<void> => {
    try {
      await getPool().query(
        'UPDATE conversations SET title = $1, updated_at = NOW() WHERE id = $2',
        [title, conversationId]
      );
      
      console.log(`会话标题更新成功: ${conversationId}`);
    } catch (error) {
      console.error(`会话标题更新失败: ${conversationId}`, error);
      throw error;
    }
  }
};

// 最后导出getPool函数，确保它可以在模块外被访问
export { getPool };