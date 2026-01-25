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

위 내용을 바탕으로 사용자의 연구 관심사를 분석하세요.
- 반드시 "당신이 관심을 갖는 주제는 ... 인 것 같습니다." 형식으로 작성
- 구체적인 기술/방법론/도메인을 명시
- 제외된 논문이 있다면 "... 보다는 ..."처럼 대비해서 표현
- 예: "당신이 관심을 갖는 주제는 Transformer 기반의 대규모 언어 모델과 사전학습 기법인 것 같습니다."
- 예: "당신이 관심을 갖는 주제는 전통적인 CNN보다는 Vision Transformer를 활용한 이미지 분류인 것 같습니다."`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '당신은 연구 관심사를 분석하는 전문가입니다. 반드시 "당신이 관심을 갖는 주제는 ... 인 것 같습니다." 형식으로 답변하세요.' },
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
