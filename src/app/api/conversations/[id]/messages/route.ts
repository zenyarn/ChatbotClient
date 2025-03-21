import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { dbUtils } from '@/lib/db';

// 获取指定会话的消息列表
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // 验证会话所有权
        const conversations = dbUtils.getConversations(userId);
        const conversation = conversations.find(c => c.id === params.id);
        if (!conversation) {
            return new NextResponse('Conversation not found', { status: 404 });
        }

        const messages = dbUtils.getMessages(params.id);
        return NextResponse.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// 发送新消息
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // 验证会话所有权
        const conversations = dbUtils.getConversations(userId);
        const conversation = conversations.find(c => c.id === params.id);
        if (!conversation) {
            return new NextResponse('Conversation not found', { status: 404 });
        }

        const { content, role } = await request.json();
        if (!content) {
            return new NextResponse('Content is required', { status: 400 });
        }

        if (!role || !['user', 'assistant'].includes(role)) {
            return new NextResponse('Invalid role', { status: 400 });
        }

        const messageId = dbUtils.addMessage(params.id, content, role);
        return NextResponse.json({ id: messageId });
    } catch (error) {
        console.error('Error sending message:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
} 