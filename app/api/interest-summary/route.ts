import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { selectedTitles, excludedTitles } = await request.json();

    if (selectedTitles.length === 0 && excludedTitles.length === 0) {
      return NextResponse.json({ summary: '' });
    }

    const prompt = `사용자가 논문을 검색하고 선택/제외했습니다.

선택한 논문 (관심 있음):
${selectedTitles.length > 0 ? selectedTitles.map((t: string) => `- ${t}`).join('\n') : '(없음)'}

제외한 논문 (관심 적음):
${excludedTitles.length > 0 ? excludedTitles.map((t: string) => `- ${t}`).join('\n') : '(없음)'}

위 내용을 바탕으로 사용자의 연구 관심사를 한 문장으로 요약하세요.
- 명사형 종결로 작성 (예: "~에 관한 연구", "~를 활용한 접근법")
- "~같습니다", "~입니다", "~것으로 보입니다" 등 추측성 어미 사용 금지
- 구체적인 기술/방법론/도메인을 명시
- 제외된 논문이 있다면 대비해서 표현
- 예: "전통적인 CNN보다는 Vision Transformer를 활용한 이미지 분류"
- 예: "Transformer 기반 대규모 언어 모델과 사전학습 기법"`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '연구 관심사를 분석하는 전문가. 명사형 종결로 간결하게 답변. 추측성 어미 사용 금지.' },
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
