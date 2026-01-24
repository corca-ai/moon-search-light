import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ContextSummary = z.object({
  commonProblem: z.string().describe('선택된 논문들이 공통으로 다루는 핵심 문제 (1-2문장)'),
  commonMethods: z.array(z.string()).describe('공통으로 사용되는 방법론 (2-4개)'),
  differences: z.array(z.string()).describe('논문들 간의 주요 차이점/다른 접근법 (2-4개)'),
  researchLandscape: z.string().describe('현재 연구 지형 요약 - 이 분야가 어디로 향하고 있는지 (2-3문장)'),
});

export async function POST(request: NextRequest) {
  try {
    const { papers } = await request.json();

    if (!papers || !Array.isArray(papers) || papers.length < 3) {
      return NextResponse.json(
        { error: 'At least 3 papers are required' },
        { status: 400 }
      );
    }

    const papersContext = papers.map((p: any, idx: number) =>
      `[${idx + 1}] ${p.title}\n초록: ${p.abstract || '없음'}`
    ).join('\n\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 학술 논문을 비교 분석하는 전문가입니다.
여러 논문을 검토하여 공통점과 차이점을 파악하고, 연구 지형을 요약합니다.
모든 응답은 한국어로 작성합니다.`,
        },
        {
          role: 'user',
          content: `다음 ${papers.length}개의 논문을 분석하세요:

${papersContext}

분석 요청:
1. 이 논문들이 공통으로 다루는 핵심 문제는 무엇인가요?
2. 공통으로 사용되는 방법론은 무엇인가요?
3. 논문들 간의 주요 차이점이나 다른 접근법은 무엇인가요?
4. 이 연구들을 종합하면, 현재 이 분야의 연구 지형은 어떠하며 어디로 향하고 있나요?`,
        },
      ],
      response_format: zodResponseFormat(ContextSummary, 'context_summary'),
    });

    const summary = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error generating context summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate context summary' },
      { status: 500 }
    );
  }
}
