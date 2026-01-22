import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { papers } = await request.json();

    if (!papers || !Array.isArray(papers)) {
      return NextResponse.json(
        { error: 'Papers array is required' },
        { status: 400 }
      );
    }

    // Create text representations for embedding
    const texts = papers.map((paper: any) => {
      const title = paper.title || '';
      const abstract = paper.abstract || '';
      return `${title}\n\n${abstract}`.trim();
    });

    // Get embeddings in batches
    const embeddings = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });

    return NextResponse.json({
      embeddings: embeddings.data.map(e => e.embedding),
    });
  } catch (error) {
    console.error('Error creating embeddings:', error);
    return NextResponse.json(
      { error: 'Failed to create embeddings' },
      { status: 500 }
    );
  }
}
