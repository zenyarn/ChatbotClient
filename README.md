# DeepSeek Chat Interface

A modern chat interface built with Next.js that integrates with DeepSeek's AI API, featuring real-time streaming responses and conversation management.

## Project Overview

This project implements a ChatGPT-style interface that connects to DeepSeek's AI API. It features a clean, modern UI with real-time message streaming, conversation management, and persistent storage.

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Database**: SQLite
- **API Integration**: OpenAI SDK (configured for DeepSeek API)
- **Language**: TypeScript

## Completed Features

- [x] Modern chat interface with dark theme
- [x] Real-time streaming message display
- [x] DeepSeek API integration
- [x] Conversation management system
  - Create new conversations
  - Delete conversations
  - View conversation history
- [x] Message management system
  - Send and receive messages
  - View message history
  - Real-time updates
- [x] Data persistence with SQLite
  - Conversation storage
  - Message history storage
- [x] Loading states and error handling
- [x] Responsive design
- [x] User authentication integration

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── conversations/     # Conversation management API
│   │   │   └── [id]/
│   │   │       └── messages/  # Message management API
│   │   └── chat/             # AI chat API
│   ├── components/           # React components
│   └── lib/
│       └── db/              # Database utilities
└── test/                    # Test page for functionality verification
```

## Database Schema

### Conversations Table
```sql
CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    userId TEXT NOT NULL,
    createdAt INTEGER NOT NULL
);
```

### Messages Table
```sql
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    conversationId TEXT NOT NULL,
    content TEXT NOT NULL,
    role TEXT CHECK(role IN ('user', 'assistant')) NOT NULL,
    createdAt INTEGER NOT NULL,
    FOREIGN KEY (conversationId) REFERENCES conversations (id) ON DELETE CASCADE
);
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the database:
   ```bash
   npm run db:init
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## API Routes

### Conversation Management
- `GET /api/conversations` - Get all conversations
- `POST /api/conversations` - Create a new conversation
- `DELETE /api/conversations/{id}` - Delete a conversation

### Message Management
- `GET /api/conversations/{id}/messages` - Get messages for a conversation
- `POST /api/conversations/{id}/messages` - Send a new message

## Technologies Used
- React with Next.js 14 App Router
- TailwindCSS
- SQLite for data persistence
- Firebase Auth, Storage, and Database
- Multiple AI endpoints including OpenAI, Anthropic, and Replicate using Vercel's AI SDK

## PostgreSQL迁移指南

本项目支持将SQLite数据库迁移到PostgreSQL。以下是迁移步骤：

### 创建Vercel PostgreSQL数据库

1. 登录Vercel控制台，选择你的项目
2. 点击"Storage"选项卡，然后选择"Connect Database"
3. 选择"PostgreSQL"，然后按照指引创建数据库实例
4. 创建完成后，Vercel会自动生成数据库连接信息

### 配置环境变量

将Vercel提供的PostgreSQL连接信息添加到项目的`.env.local`文件中：

```
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
```

### 数据迁移

运行以下命令将现有SQLite数据库的数据迁移到PostgreSQL数据库：

```bash
npm run db:migrate
```

此命令会：
1. 从SQLite数据库导出所有会话和消息数据
2. 在`db-backup`目录中创建数据备份
3. 在PostgreSQL中创建必要的数据库表
4. 将数据导入到PostgreSQL数据库

迁移完成后，你可以在代码中切换数据库连接，使用PostgreSQL替代SQLite。