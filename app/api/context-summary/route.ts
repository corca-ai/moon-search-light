import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ContextSummary = z.object({
  commonProblem: z.string().describe('선택된 논문들이 공통으로 다루는 핵심 문제 (1-2문장)'),
  commonMethods: z.array(z.string()).describe('공통으로 사용되는 방법론 (2-4개)'),
  differences: z.array(z.string()).describe('논문들 간의 주요 차이점/다른 접근법 (2-4개)'),
  researchLandscape: z.string().describe('현재 연구 지형 요약 - 이 분야가 어디로 향하고 있는지 (2-3문장)'),
});

export async function POST(request: NextRequest) {
  try {
    const { papers } = await request.json();

    if (!papers || !Array.isArray(papers) || papers.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 papers are required' },
        { status: 400 }
      );
    }

    const papersContext = papers.map((p: any, idx: number) =>
      `[${idx + 1}] ${p.title}\n초록: ${p.abstract || '없음'}`
    ).join('\n\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `다음 ${papers.length}개의 논문을 분석하세요:

${papersContext}

분석 요청:
1. 이 논문들이 공통으로 다루는 핵심 문제는 무엇인가요?
2. 공통으로 사용되는 방법론은 무엇인가요?
3. 논문들 간의 주요 차이점이나 다른 접근법은 무엇인가요?
4. 이 연구들을 종합하면, 현재 이 분야의 연구 지형은 어떠하며 어디로 향하고 있나요?`,
      config: {
        systemInstruction: `당신은 학술 논문을 비교 분석하는 전문가입니다.
여러 논문을 검토하여 공통점과 차이점을 파악하고, 연구 지형을 요약합니다.
모든 응답은 한국어로 작성합니다.`,
        responseMimeType: 'application/json',
        responseSchema: z.toJSONSchema(ContextSummary),
      },
    });

    const summary = JSON.parse(response.text || '{}');

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error generating context summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate context summary' },
      { status: 500 }
    );
  }
}
