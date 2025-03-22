// 从SQLite导出数据并导入到PostgreSQL的迁移脚本
import sqliteDb from './index';
import { Pool } from 'pg';
import { initPostgresDb, pgUtils } from './postgres';
import fs from 'fs';
import path from 'path';

// 会话和消息的类型定义
interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: number;
  updated_at: number;
}

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: number;
}

// SQLite查询函数
function getDataFromSqlite(): { conversations: Conversation[], messages: Message[] } {
  // 获取所有会话
  const conversations = sqliteDb.prepare(`
    SELECT id, user_id, title, created_at, updated_at 
    FROM conversations
  `).all() as Conversation[];

  // 获取所有消息
  const messages = sqliteDb.prepare(`
    SELECT id, conversation_id, content, role, created_at 
    FROM messages
  `).all() as Message[];

  return { conversations, messages };
}

// 迁移数据到PostgreSQL
export async function migrateToPostgres() {
  try {
    if (!process.env.POSTGRES_URL) {
      throw new Error("未找到PostgreSQL连接信息，请确保在.env.local中设置了POSTGRES_URL");
    }

    console.log("开始迁移数据到PostgreSQL...");
    
    // 获取SQLite中的数据
    const { conversations, messages } = getDataFromSqlite();
    console.log(`从SQLite获取到 ${conversations.length} 个会话和 ${messages.length} 条消息`);
    
    // 备份数据到JSON文件
    const backupDir = path.join(process.cwd(), 'db-backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupFile = path.join(backupDir, `sqlite-backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify({ conversations, messages }, null, 2));
    console.log(`数据已备份到 ${backupFile}`);
    
    // 初始化PostgreSQL数据库表
    await initPostgresDb();
    
    // 创建PostgreSQL连接池
    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });
    
    // 开始批量导入数据
    const client = await pool.connect();
    try {
      // 开始事务
      await client.query('BEGIN');
      
      // 导入会话数据
      for (const conv of conversations) {
        await client.query(
          `INSERT INTO conversations (id, user_id, title, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO NOTHING`,
          [conv.id, conv.user_id, conv.title, conv.created_at, conv.updated_at]
        );
      }
      
      // 导入消息数据
      for (const msg of messages) {
        await client.query(
          `INSERT INTO messages (id, conversation_id, content, role, created_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO NOTHING`,
          [msg.id, msg.conversation_id, msg.content, msg.role, msg.created_at]
        );
      }
      
      // 提交事务
      await client.query('COMMIT');
      
      console.log(`成功导入 ${conversations.length} 个会话和 ${messages.length} 条消息到PostgreSQL`);
    } catch (error) {
      // 发生错误时回滚事务
      await client.query('ROLLBACK');
      console.error("导入数据时发生错误:", error);
      throw error;
    } finally {
      client.release();
    }
    
    // 关闭连接池
    await pool.end();
    
    console.log("数据迁移完成！");
    return { success: true, conversationsCount: conversations.length, messagesCount: messages.length };
  } catch (error: any) {
    console.error("迁移过程中发生错误:", error);
    return { success: false, error: error.message };
  }
}

// 如果直接运行此文件，执行迁移
if (require.main === module) {
  migrateToPostgres()
    .then((result) => {
      console.log("迁移结果:", result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("迁移失败:", error);
      process.exit(1);
    });
} 