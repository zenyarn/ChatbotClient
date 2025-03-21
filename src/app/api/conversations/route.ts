import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { dbUtils } from '@/lib/db';

// 获取用户的所有会话
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const conversations = dbUtils.getConversations(userId);
        return NextResponse.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// 创建新会话
export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { title } = await request.json();
        if (!title) {
            return new NextResponse('Title is required', { status: 400 });
        }

        const conversationId = dbUtils.createConversation(userId, title);
        return NextResponse.json({ id: conversationId });
    } catch (error) {
        console.error('Error creating conversation:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// 删除会话
export async function DELETE(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('id');
        
        if (!conversationId) {
            return new NextResponse('Conversation ID is required', { status: 400 });
        }

        // 首先验证该会话是否属于当前用户
        const conversations = dbUtils.getConversations(userId);
        const conversation = conversations.find(c => c.id === conversationId);
        
        if (!conversation) {
            return new NextResponse('Conversation not found', { status: 404 });
        }

        // 删除会话
        dbUtils.deleteConversation(conversationId);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting conversation:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
} 