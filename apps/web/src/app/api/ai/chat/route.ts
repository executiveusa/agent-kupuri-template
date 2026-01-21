import { NextRequest, NextResponse } from 'next/server';
import { chatWithVisitor, ChatMessage } from '@/lib/ai/openrouter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Validate messages format
    const validMessages: ChatMessage[] = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    const response = await chatWithVisitor(validMessages, context || {});

    return NextResponse.json({ 
      message: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Chat failed. Please try again.' },
      { status: 500 }
    );
  }
}
