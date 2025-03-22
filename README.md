# DeepSeek Chat 应用

一个基于DeepSeek AI的现代聊天应用，支持流式输出、会话管理和云部署。

## 功能特性

- ✨ **实时AI对话**：与DeepSeek AI进行流畅的对话交流
- 🔄 **流式输出**：实时显示AI回复，逐字符呈现
- 📚 **会话历史**：保存并管理多个对话会话
- 📱 **响应式设计**：在各种设备上提供良好的用户体验
- ☁️ **云端部署**：支持从本地开发环境到Vercel云平台的无缝部署
- 🔄 **数据库适配**：灵活切换SQLite（开发）和PostgreSQL（生产）数据库

## 技术栈

- **前端**：
  - React 18
  - Next.js 14 (App Router)
  - Tailwind CSS
  - TypeScript

- **后端**：
  - Next.js API Routes
  - OpenAI SDK (用于DeepSeek API集成)
  - PostgreSQL (生产环境)
  - SQLite (开发环境，可选)

- **部署**：
  - Vercel云平台
  - Vercel PostgreSQL

## 快速开始

### 前提条件

- Node.js 18+
- npm 或 yarn
- DeepSeek API密钥

### 本地开发

1. 克隆仓库
```bash
git clone https://github.com/yourusername/deepseek-chat.git
cd deepseek-chat
```

2. 安装依赖
```bash
npm install
# 或
yarn install
```

3. 创建`.env.local`文件并设置环境变量
```
DEEPSEEK_API_KEY=your_deepseek_api_key
# 可选: 开发环境使用SQLite
USE_POSTGRES=false
# 如果使用PostgreSQL
POSTGRES_URL=postgres://username:password@hostname:port/database
```

4. 启动开发服务器
```bash
npm run dev
# 或
yarn dev
```

5. 访问 [http://localhost:3000](http://localhost:3000)

## 数据库配置

### 数据库切换机制

项目支持在SQLite和PostgreSQL之间灵活切换：

- **开发环境**：默认使用SQLite（简单、零配置）
- **生产环境**：使用PostgreSQL（健壮、可扩展）

通过环境变量`USE_POSTGRES`控制数据库选择：
- `USE_POSTGRES=true`：使用PostgreSQL
- `USE_POSTGRES=false`或未设置：使用SQLite

> **注意**：在Vercel部署时，应用会自动使用PostgreSQL，无论环境变量如何设置。

### PostgreSQL设置

1. 创建PostgreSQL数据库
2. 设置`POSTGRES_URL`环境变量：
```
POSTGRES_URL=postgres://username:password@hostname:port/database
```

### 数据库架构

应用使用两个主要表：
- **conversations**：存储对话元数据
- **messages**：存储对话中的消息

数据库会在首次使用时自动初始化。

## 部署指南

### Vercel部署

1. Fork或克隆此仓库到GitHub
2. 在Vercel创建新项目并连接到GitHub仓库
3. 配置以下环境变量：
   - `DEEPSEEK_API_KEY`：您的DeepSeek API密钥
   - `POSTGRES_URL`：您的PostgreSQL连接URL
   - `USE_POSTGRES`：设置为`true`
4. 部署项目

### 重要注意事项

- Vercel的无服务器环境不支持SQLite，因此生产部署必须使用PostgreSQL
- 确保您的PostgreSQL数据库允许来自Vercel的连接
- 考虑为生产部署启用SSL连接

## 流式输出技术

应用使用OpenAI SDK与DeepSeek API集成，实现实时流式输出：

1. 前端发送消息到后端API
2. 后端使用OpenAI SDK与DeepSeek API建立流式连接
3. 使用`ReadableStream`将数据块实时传输到前端
4. 前端使用`response.body.getReader()`读取流式数据
5. 实时更新UI，显示逐字符的回复效果

## 环境变量参考

| 变量名 | 描述 | 示例 |
|------------------|---------------------------------|-------------------------------------|
| DEEPSEEK_API_KEY | DeepSeek API密钥 | sk-xxxxxxxxxxxxxxxxxxxxxxxx |
| POSTGRES_URL | PostgreSQL连接URL | postgres://user:pass@host:5432/db |
| USE_POSTGRES | 是否使用PostgreSQL | true |
| NODE_ENV | 环境模式 | development/production |

## 项目结构

```
src/
├── app/
│   ├── api/          # API路由
│   │   ├── chat/     # AI聊天API
│   │   ├── conversations/ # 会话管理API
│   │   └── db-diagnostics/ # 数据库诊断API
│   ├── components/   # React组件
│   │   ├── ChatArea.tsx   # 聊天区域组件
│   │   └── Sidebar.tsx    # 侧边栏组件
│   ├── lib/          # 工具库
│   │   ├── db/       # 数据库模块
│   │   │   ├── index.ts    # 导出
│   │   │   ├── postgres.ts # PostgreSQL实现
│   │   │   ├── sqlite.ts   # SQLite实现
│   │   │   ├── types.ts    # 数据库类型定义
│   │   │   └── utils.ts    # 数据库工具
│   ├── page.tsx      # 主页面
│   └── layout.tsx    # 应用布局
├── components/       # 通用组件
└── public/           # 静态资源
```

## 功能亮点

1. **智能会话命名**：新会话会自动以第一条用户消息命名
2. **流式响应**：AI回复实时流式显示，提升用户体验
3. **数据库适配器**：支持SQLite与PostgreSQL无缝切换
4. **响应式布局**：适配桌面和移动设备
5. **会话管理**：创建、重命名、删除会话

## 贡献指南

欢迎贡献！请按以下步骤提交您的改进：

1. Fork本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个Pull Request

## 许可证

本项目采用MIT许可证 - 详情请参见LICENSE文件

## 致谢

- [Next.js](https://nextjs.org/) - React框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [DeepSeek AI](https://deepseek.ai/) - AI模型提供者
- [Vercel](https://vercel.com/) - 部署和托管平台

---

© 2023 DeepSeek Chat应用。保留所有权利。


