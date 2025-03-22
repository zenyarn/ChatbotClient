import { dbUtils as sqliteUtils } from './sqlite';
import { dbUtils as pgUtils } from './postgres';
import { DbUtils } from './types';

// 确定使用哪个数据库
// 如果环境变量USE_POSTGRES为true或在生产环境中，使用PostgreSQL，否则使用SQLite
const USE_POSTGRES = process.env.USE_POSTGRES === 'true' || process.env.NODE_ENV === 'production';

// 选择适当的数据库工具
// export const dbUtils: DbUtils = USE_POSTGRES ? pgUtils : sqliteUtils;
export const dbUtils = (process.env.NODE_ENV === 'production' || process.env.USE_POSTGRES === 'true')
  ? pgUtils
  : sqliteUtils;

// 打印数据库连接信息(仅开发环境)
if (process.env.NODE_ENV !== 'production') {
  console.log(`[Database] Using ${USE_POSTGRES ? 'PostgreSQL' : 'SQLite'} database`);
} 