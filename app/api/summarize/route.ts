import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { getPostHogClient } from '@/app/lib/posthog-server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PaperAnalysis = z.object({
  overview: z.string().describe('논문의 전체적인 개요 (1-2문장)'),
  goals: z.string().describe('논문의 연구 목표 및 목적 (1-2문장)'),
  method: z.string().describe('사용된 연구 방법론 (1-2문장)'),
  results: z.string().describe('주요 연구 결과 및 기여 (1-2문장)'),
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

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `논문 제목: ${title}\n\n초록: ${abstract}\n\n이 논문을 다음 형식으로 분석해주세요:\n1. 개요 (overview): 논문의 전체적인 개요 (1-2문장)\n2. 연구 목표 (goals): 논문의 연구 목표 및 목적 (1-2문장)\n3. 방법론 (method): 사용된 연구 방법론 (1-2문장)\n4. 결과 (results): 주요 연구 결과 및 기여 (1-2문장)\n5. 키워드 (keywords): 핵심 키워드 (영어, 3-5개)`,
      config: {
        systemInstruction: '당신은 학술 논문을 분석하는 전문가입니다. 주어진 논문을 구조화된 형식으로 분석하여 개요, 연구 목표, 방법론, 결과를 한국어로 요약하고, 핵심 키워드를 영어로 추출합니다.',
        responseMimeType: 'application/json',
        responseSchema: z.toJSONSchema(PaperAnalysis),
      },
    });

    const analysis = JSON.parse(response.text || '{}');

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error summarizing paper:', error);

    // PostHog: Capture summarize API error
    const posthog = getPostHogClient();
    const userEmail = request.headers.get('x-user-email') || 'anonymous';
    posthog.capture({
      distinctId: userEmail,
      event: 'summarize_api_error',
      properties: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json(
      { error: 'Failed to summarize paper' },
      { status: 500 }
    );
  }
}
