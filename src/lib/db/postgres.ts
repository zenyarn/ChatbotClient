import { Pool } from 'pg';

// 创建连接池
let pool: Pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: {
        rejectUnauthorized: true,
      },
    });
  }
  return pool;
}

// 查询会话列表
export async function getConversations(userId: string | null) {
  const pool = getPool();
  try {
    const result = await pool.query(
      'SELECT * FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('获取会话列表失败:', error);
    throw error;
  }
}

// 查询会话详情
export async function getConversation(id: string) {
  const pool = getPool();
  try {
    const result = await pool.query(
      'SELECT * FROM conversations WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('获取会话详情失败:', error);
    throw error;
  }
}

// 查询消息
export async function getMessages(conversationId: string) {
  const pool = getPool();
  try {
    const result = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId]
    );
    return result.rows;
  } catch (error) {
    console.error('获取消息列表失败:', error);
    throw error;
  }
}

// 创建会话
export async function createConversation(id: string, userId: string | null, title: string) {
  const pool = getPool();
  try {
    const result = await pool.query(
      'INSERT INTO conversations(id, user_id, title, created_at, updated_at) VALUES($1, $2, $3, NOW(), NOW()) RETURNING *',
      [id, userId, title]
    );
    return result.rows[0];
  } catch (error) {
    console.error('创建会话失败:', error);
    throw error;
  }
}

// 更新会话
export async function updateConversation(id: string, title: string) {
  const pool = getPool();
  try {
    const result = await pool.query(
      'UPDATE conversations SET title = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [title, id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('更新会话失败:', error);
    throw error;
  }
}

// 删除会话
export async function deleteConversation(id: string) {
  const pool = getPool();
  try {
    await pool.query('DELETE FROM conversations WHERE id = $1', [id]);
    return true;
  } catch (error) {
    console.error('删除会话失败:', error);
    throw error;
  }
}

// 添加消息
export async function addMessage(id: string, conversationId: string, content: string, role: string) {
  const pool = getPool();
  try {
    const result = await pool.query(
      'INSERT INTO messages(id, conversation_id, content, role, created_at) VALUES($1, $2, $3, $4, NOW()) RETURNING *',
      [id, conversationId, content, role]
    );
    
    // 更新会话的updated_at时间
    await pool.query(
      'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
      [conversationId]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('添加消息失败:', error);
    throw error;
  }
} 