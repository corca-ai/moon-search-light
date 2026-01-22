import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PaperAnalysis = z.object({
  summary: z.string().describe('한국어로 작성된 논문 초록의 간단한 요약 (2-3문장)'),
  keywords: z.array(z.string()).describe('논문의 핵심 키워드 (영어, 3-5개)'),
});

export async function POST(request: NextRequest) {
  try {
    const { abstract, title } = await request.json();

    if (!abstract || !title) {
      return NextResponse.json(
        { error: 'Abstract and title are required' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        {
          role: 'system',
          content: '당신은 학술 논문을 분석하는 전문가입니다. 주어진 논문의 초록을 한국어로 간단히 요약하고, 핵심 키워드를 영어로 추출합니다.',
        },
        {
          role: 'user',
          content: `논문 제목: ${title}\n\n초록: ${abstract}\n\n이 논문의 초록을 한국어로 2-3문장으로 요약하고, 핵심 키워드를 영어로 3-5개 추출해주세요.`,
        },
      ],
      response_format: zodResponseFormat(PaperAnalysis, 'paper_analysis'),
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error summarizing paper:', error);
    return NextResponse.json(
      { error: 'Failed to summarize paper' },
      { status: 500 }
    );
  }
}
