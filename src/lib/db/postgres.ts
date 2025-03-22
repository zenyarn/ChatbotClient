import { Pool, QueryResult } from 'pg';

// 创建数据库连接池
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// 初始化数据库
export async function initPostgresDb() {
  try {
    const client = await pool.connect();
    try {
      // 创建会话表
      await client.query(`
        CREATE TABLE IF NOT EXISTS conversations (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          created_at BIGINT NOT NULL,
          updated_at BIGINT NOT NULL
        );
      `);

      // 创建消息表
      await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          conversation_id TEXT NOT NULL,
          content TEXT NOT NULL,
          role TEXT CHECK(role IN ('user', 'assistant')) NOT NULL,
          created_at BIGINT NOT NULL,
          FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        );
      `);

      console.log('PostgreSQL数据库表已创建');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('初始化PostgreSQL数据库时发生错误:', error);
    throw error;
  }
}

// 数据库操作函数
export const pgUtils = {
  // 会话相关操作
  createConversation: async (userId: string, title: string): Promise<string> => {
    const client = await pool.connect();
    try {
      const now = Date.now();
      const id = crypto.randomUUID();
      await client.query(
        `INSERT INTO conversations (id, user_id, title, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, userId, title, now, now]
      );
      return id;
    } finally {
      client.release();
    }
  },

  getConversations: async (userId: string): Promise<any[]> => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, user_id as "userId", title, created_at as "createdAt", updated_at as "updatedAt"
         FROM conversations
         WHERE user_id = $1
         ORDER BY updated_at DESC`,
        [userId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    const client = await pool.connect();
    try {
      await client.query(
        `DELETE FROM conversations
         WHERE id = $1`,
        [conversationId]
      );
    } finally {
      client.release();
    }
  },

  // 消息相关操作
  addMessage: async (conversationId: string, content: string, role: 'user' | 'assistant'): Promise<string> => {
    const client = await pool.connect();
    try {
      const now = Date.now();
      const id = crypto.randomUUID();
      await client.query(
        `INSERT INTO messages (id, conversation_id, content, role, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, conversationId, content, role, now]
      );
      
      // 更新会话的更新时间
      await client.query(
        `UPDATE conversations
         SET updated_at = $1
         WHERE id = $2`,
        [now, conversationId]
      );
      
      return id;
    } finally {
      client.release();
    }
  },

  getMessages: async (conversationId: string): Promise<any[]> => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, conversation_id as "conversationId", content, role, created_at as "createdAt"
         FROM messages
         WHERE conversation_id = $1
         ORDER BY created_at ASC`,
        [conversationId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  },
}; 