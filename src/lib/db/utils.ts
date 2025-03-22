import { dbUtils as pgUtils } from './postgres';
import { DbUtils } from './types';

// 不再需要SQLite，直接导出PostgreSQL实现
export const dbUtils: DbUtils = pgUtils;

// 如果您想保留环境变量检查逻辑，可以用下面的代码替代
// 但这不是必需的，因为我们现在总是使用PostgreSQL
// export const dbUtils: DbUtils = 
//   (process.env.NODE_ENV === 'production' || process.env.USE_POSTGRES === 'true')
//     ? pgUtils
//     : pgUtils; // 两种情况都使用pgUtils

// 打印数据库连接信息(仅开发环境)
if (process.env.NODE_ENV !== 'production') {
  console.log(`[Database] Using PostgreSQL database`);
} 