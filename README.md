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