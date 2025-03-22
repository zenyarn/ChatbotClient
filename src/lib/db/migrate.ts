// 添加在文件最顶部
require('dotenv').config({ path: '.env.local' });

// 从SQLite导出数据并导入到PostgreSQL的迁移脚本
const { Pool } = require('pg');
const fs = require('fs/promises');
const path = require('path');
const sqlite3 = require('sqlite3');
// 重命名open函数以避免与全局window.open冲突
const { open: sqliteOpen } = require('sqlite');

// 会话和消息的类型定义
interface Conversation {
  id: string;
  user_id: string | null;
  title: string;
  created_at: string | number;
  updated_at: string | number;
}

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  role: string;
  created_at: string | number;
}

interface MigrationData {
  conversations: Conversation[];
  messages: Message[];
}

// 目录常量
const BACKUP_DIR = path.join(process.cwd(), 'db-backup');

// 添加在文件顶部
console.log('Database URL:', process.env.POSTGRES_URL_NON_POOLING);
console.log('Database Name:', process.env.POSTGRES_DATABASE);

// 方式1：仅使用连接字符串
const pgPool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING,
  ssl: {
    rejectUnauthorized: false  // 需要保留SSL配置但允许自签名证书
  }
});

// 确保表结构存在
async function initPostgresDB() {
  const client = await pgPool.connect();
  try {
    // 创建conversations表
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 创建messages表
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
        content TEXT,
        role TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('PostgreSQL表创建完成');
  } catch (error) {
    console.error('创建PostgreSQL表失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 从SQLite导出数据
async function exportFromSQLite(): Promise<MigrationData> {
  try {
    // 确保备份目录存在
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    
    // 打开SQLite数据库 - 使用重命名后的sqliteOpen函数
    const db = await sqliteOpen({
      filename: 'sqlite.db',
      driver: sqlite3.Database,
    });

    // 添加类型断言以解决类型问题
    const conversations = await db.all('SELECT * FROM conversations') as Conversation[];
    
    // 导出messages
    const messages = await db.all('SELECT * FROM messages') as Message[];
    
    // 写入备份文件
    await fs.writeFile(
      path.join(BACKUP_DIR, `backup-${Date.now()}.json`),
      JSON.stringify({ conversations, messages }, null, 2)
    );

    console.log(`导出 ${conversations.length} 个会话和 ${messages.length} 条消息`);
    
    return { conversations, messages };
  } catch (error) {
    console.error('从SQLite导出数据失败:', error);
    throw error;
  }
}

// 导入数据到PostgreSQL
async function importToPostgres(data: MigrationData) {
  const client = await pgPool.connect();
  
  try {
    // 开始事务
    await client.query('BEGIN');
    
    // 导入conversations
    for (const conv of data.conversations) {
      await client.query(
        `INSERT INTO conversations(id, user_id, title, created_at, updated_at)
         VALUES($1, $2, $3, $4, $5)
         ON CONFLICT(id) DO NOTHING`,
        [
          conv.id,
          conv.user_id,
          conv.title,
          conv.created_at ? new Date(conv.created_at) : new Date(),
          conv.updated_at ? new Date(conv.updated_at) : new Date()
        ]
      );
    }
    
    // 导入messages
    for (const msg of data.messages) {
      await client.query(
        `INSERT INTO messages(id, conversation_id, content, role, created_at)
         VALUES($1, $2, $3, $4, $5)
         ON CONFLICT(id) DO NOTHING`,
        [
          msg.id,
          msg.conversation_id,
          msg.content,
          msg.role,
          msg.created_at ? new Date(msg.created_at) : new Date()
        ]
      );
    }
    
    // 提交事务
    await client.query('COMMIT');
    
    console.log(`成功导入 ${data.conversations.length} 个会话和 ${data.messages.length} 条消息到PostgreSQL`);
  } catch (error) {
    // 回滚事务
    await client.query('ROLLBACK');
    console.error('导入数据到PostgreSQL失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 主函数
async function migrate() {
  try {
    console.log('开始数据迁移...');
    
    // 初始化PostgreSQL表结构
    await initPostgresDB();
    
    // 从SQLite导出数据
    const data = await exportFromSQLite();
    
    // 导入数据到PostgreSQL
    await importToPostgres(data);
    
    console.log('数据迁移完成！');
  } catch (error) {
    console.error('迁移过程中出现错误:', error);
    process.exit(1);
  } finally {
    // 关闭PostgreSQL连接池
    await pgPool.end();
  }
}

// 执行迁移
migrate(); 