import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json();

    const { papers, analyses } = context || {};

    // Build comprehensive context for the AI
    let systemPrompt = `당신은 학술 연구를 돕는 전문 AI 조력자입니다.
연구자가 선택한 논문들을 바탕으로 후속 연구 아이디어를 발전시키고 구체화하도록 도와주세요.

## 역할
- 논문 분석 및 비교
- Research Gap 식별
- 후속 연구 아이디어 제안
- 연구 계획서/제안서 작성 지원
- 방법론 제안
- 리스크 및 한계점 분석

## 선택된 논문 (${papers?.length || 0}개)`;

    if (papers && papers.length > 0) {
      papers.forEach((p: any, idx: number) => {
        const analysis = analyses?.[p.paperId];
        systemPrompt += `\n\n### ${idx + 1}. ${p.title}`;
        systemPrompt += `\n- 연도: ${p.year || '미상'}`;
        systemPrompt += `\n- 인용수: ${p.citationCount || 0}`;
        if (p.abstract) {
          systemPrompt += `\n- 초록: ${p.abstract.slice(0, 300)}...`;
        }
        if (analysis) {
          systemPrompt += `\n- 개요: ${analysis.overview}`;
          systemPrompt += `\n- 목표: ${analysis.goals}`;
          systemPrompt += `\n- 방법론: ${analysis.method}`;
          systemPrompt += `\n- 결과: ${analysis.results}`;
        }
      });
    }

    systemPrompt += `

## 응답 가이드라인
- 한국어로 응답하세요
- 구체적이고 실행 가능한 제안을 하세요
- 마크다운 형식을 사용하여 가독성을 높이세요
- 필요시 논문 인용을 명확히 하세요
- 모든 응답은 가능하면 500글자 이하로 하세요.
- 필요하면 질문하여 요청을 구체화하세요`;

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ],
      stream: true,
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
