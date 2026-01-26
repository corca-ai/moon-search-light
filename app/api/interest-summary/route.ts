import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { selectedTitles } = await request.json();

    if (selectedTitles.length === 0) {
      return NextResponse.json({ summary: '' });
    }

    const prompt = `사용자가 논문을 검색하고 선택했습니다.

선택한 논문 (관심 있음):
${selectedTitles.length > 0 ? selectedTitles.map((t: string) => `- ${t}`).join('\n') : '(없음)'}

위 내용을 바탕으로 사용자의 연구 관심사를 100글자 이하로 요약하세요.
- 구체적인 기술/방법론/도메인 측면중 어떤 부분에 주목하는지 검토
- 예: "Vision Transformer를 활용한 이미지 분류"
- 예: "Transformer 기반 대규모 언어 모델과 사전학습 기법"`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '연구 관심사를 분석하는 전문가. 간결하게 답변.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    const summary = completion.choices[0].message.content?.trim() || '';

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Interest summary error:', error);
    return NextResponse.json({ summary: '' });
  }
}
