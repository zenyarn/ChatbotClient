import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { dbUtils } from '@/lib/db';
import { Conversation } from '@/lib/db';

// 获取指定会话的消息列表
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // 验证会话所有权
        const conversations = await dbUtils.getConversations(userId);
        const conversation = conversations.find((c: Conversation) => c.id === params.id);
        
        if (!conversation) {
            return new NextResponse('Conversation not found', { status: 404 });
        }

        const messages = await dbUtils.getMessages(params.id);
        return NextResponse.json(messages);
    } catch (error) {
        console.error(`获取消息失败:`, error);
        return new NextResponse('获取消息失败', { status: 500 });
    }
}

// 发送新消息
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // 验证会话所有权
        const conversations = await dbUtils.getConversations(userId);
        const conversation = conversations.find((c: Conversation) => c.id === params.id);
        
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

        const messageId = await dbUtils.addMessage(params.id, content, role);
        return NextResponse.json({ id: messageId });
    } catch (error) {
        console.error(`添加消息失败:`, error);
        return new NextResponse('添加消息失败', { status: 500 });
    }
} 