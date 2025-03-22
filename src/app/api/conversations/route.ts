import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { dbUtils } from '@/lib/db';

// 获取所有会话
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const conversations = await dbUtils.getConversations(userId);
        return NextResponse.json(conversations);
    } catch (error) {
        console.error(`获取会话失败:`, error);
        return new NextResponse('获取会话失败', { status: 500 });
    }
}

// 创建新会话
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { title } = await request.json();
        if (!title) {
            return new NextResponse('Title is required', { status: 400 });
        }

        const conversationId = await dbUtils.createConversation(userId, title);
        return NextResponse.json({ id: conversationId });
    } catch (error) {
        console.error(`创建会话失败:`, error);
        return new NextResponse('创建会话失败', { status: 500 });
    }
} 