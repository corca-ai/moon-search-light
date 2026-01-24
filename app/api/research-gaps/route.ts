import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ResearchGap = z.object({
  id: z.string(),
  type: z.enum(['unsolved', 'under-researched', 'method-transfer']),
  hypothesis: z.string().describe('1줄 가설 형태로 작성'),
  evidence: z.string().describe('이 Gap을 도출한 근거'),
  noveltyScore: z.number().min(0).max(100).describe('새로움 점수 0-100'),
});

const ResearchGapsResponse = z.object({
  gaps: z.array(ResearchGap).describe('3-5개의 Research Gap'),
});

export async function POST(request: NextRequest) {
  try {
    const { papers, analyses } = await request.json();

    if (!papers || !Array.isArray(papers) || papers.length < 3) {
      return NextResponse.json(
        { error: 'At least 3 papers are required' },
        { status: 400 }
      );
    }

    const papersContext = papers.map((p: any, idx: number) => {
      const analysis = analyses?.[p.paperId];
      return `[${idx + 1}] ${p.title}
초록: ${p.abstract || '없음'}
연도: ${p.year || '미상'}
인용수: ${p.citationCount || 0}
${analysis ? `분석: ${analysis.overview} / ${analysis.goals} / ${analysis.method} / ${analysis.results}` : ''}`;
    }).join('\n\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 연구 Gap을 식별하는 전문가입니다.
주어진 논문들을 분석하여 후속 연구 기회를 찾아냅니다.

Gap 유형:
- unsolved: 미해결 문제 (예: "A는 해결했지만 B는 다루지 않음")
- under-researched: 과소연구 영역 (인용/연도 기준 공백이 있는 영역)
- method-transfer: 방법 전이 기회 (예: "X 분야 방법을 Y에 적용 가능")

각 Gap은 구체적이고 실행 가능한 연구 주제여야 합니다.
모든 응답은 한국어로 작성합니다.`,
        },
        {
          role: 'user',
          content: `다음 ${papers.length}개의 논문을 분석하여 Research Gap을 찾아주세요:

${papersContext}

요청사항:
1. 이 논문들이 다루지 않은 미해결 문제는?
2. 연구가 부족한 영역은?
3. 다른 분야의 방법론을 적용할 수 있는 기회는?

3-5개의 Gap을 1줄 가설 형태로 제시해주세요.`,
        },
      ],
      response_format: zodResponseFormat(ResearchGapsResponse, 'research_gaps'),
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating research gaps:', error);
    return NextResponse.json(
      { error: 'Failed to generate research gaps' },
      { status: 500 }
    );
  }
}
