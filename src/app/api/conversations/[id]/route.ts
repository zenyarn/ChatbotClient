import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { dbUtils } from '@/lib/db';

// 获取特定会话
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
        const conversations = await dbUtils.getConversations(userId);
        const conversation = conversations.find(c => c.id === params.id);
        
        if (!conversation) {
            return new NextResponse('Conversation not found', { status: 404 });
        }

        return NextResponse.json(conversation);
    } catch (error) {
        console.error('Error fetching conversation:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// 删除特定会话
export async function DELETE(
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
        const conversation = conversations.find(c => c.id === params.id);
        
        if (!conversation) {
            return new NextResponse('Conversation not found', { status: 404 });
        }

        await dbUtils.deleteConversation(params.id);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`删除会话失败:`, error);
        return new NextResponse('删除会话失败', { status: 500 });
    }
}

// 添加PATCH方法用于更新会话标题
export async function PATCH(
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
        const conversation = conversations.find(c => c.id === params.id);
        
        if (!conversation) {
            return new NextResponse('Conversation not found', { status: 404 });
        }

        const { title } = await request.json();
        if (!title) {
            return new NextResponse('Title is required', { status: 400 });
        }

        await dbUtils.updateConversationTitle(params.id, title);
        return NextResponse.json({ updated: true });
    } catch (error) {
        console.error(`更新会话标题失败:`, error);
        return new NextResponse('更新会话标题失败', { status: 500 });
    }
} 