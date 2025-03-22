import { NextResponse } from 'next/server';
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
        const conversations = dbUtils.getConversations(userId);
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
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const conversationId = params.id;
        
        if (!conversationId) {
            return new NextResponse('Conversation ID is required', { status: 400 });
        }

        // 验证会话所有权
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

// 添加PATCH方法用于更新会话标题
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { title } = await request.json();
    if (!title) {
      return new NextResponse('Title is required', { status: 400 });
    }

    // 验证会话所有权
    const conversations = dbUtils.getConversations(userId);
    const conversation = conversations.find(c => c.id === params.id);
    
    if (!conversation) {
      return new NextResponse('Conversation not found', { status: 404 });
    }

    // 更新会话标题
    dbUtils.updateConversationTitle(params.id, title);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 