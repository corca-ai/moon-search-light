import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { texts } = await request.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: 'texts array is required' },
        { status: 400 }
      );
    }

    // Limit batch size
    if (texts.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 texts per request' },
        { status: 400 }
      );
    }

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });

    const embeddings = response.data.map(item => item.embedding);

    return NextResponse.json({ embeddings });
  } catch (error) {
    console.error('Error generating embeddings:', error);
    return NextResponse.json(
      { error: 'Failed to generate embeddings' },
      { status: 500 }
    );
  }
}
