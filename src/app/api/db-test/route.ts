import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  try {
    const connectionString = process.env.POSTGRES_URL;
    
    if (!connectionString) {
      return NextResponse.json({
        status: 'error',
        message: 'POSTGRES_URL环境变量未设置'
      }, { status: 500 });
    }
    
    const pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    // 尝试连接
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW()');
      return NextResponse.json({
        status: 'success',
        message: '数据库连接成功',
        time: result.rows[0].now,
        env: process.env.NODE_ENV
      });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: '数据库连接失败',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 