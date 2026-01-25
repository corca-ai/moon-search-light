import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PaperInfo {
  title: string;
  year?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { selectedPapers, excludedPapers } = await request.json() as {
      selectedPapers: PaperInfo[];
      excludedPapers: PaperInfo[];
    };

    if (selectedPapers.length === 0 && excludedPapers.length === 0) {
      return NextResponse.json({ summary: '' });
    }

    const currentYear = new Date().getFullYear();

    const formatPaper = (p: PaperInfo) => {
      const yearInfo = p.year ? ` (${p.year})` : '';
      return `- ${p.title}${yearInfo}`;
    };

    // 최근 논문 비율 계산
    const recentSelected = selectedPapers.filter(p => p.year && p.year >= currentYear - 3).length;
    const recentExcluded = excludedPapers.filter(p => p.year && p.year >= currentYear - 3).length;
    const prefersRecent = recentSelected > recentExcluded;

    const prompt = `사용자가 논문을 검색하고 선택/제외했습니다.

선택한 논문 (관심 있음):
${selectedPapers.length > 0 ? selectedPapers.map(formatPaper).join('\n') : '(없음)'}

제외한 논문 (관심 적음):
${excludedPapers.length > 0 ? excludedPapers.map(formatPaper).join('\n') : '(없음)'}

${prefersRecent ? '사용자는 최근 논문을 선호하는 경향이 있습니다.' : ''}

위 내용을 바탕으로 사용자의 연구 관심사를 100글자 이하로 요약하세요.
- 구체적인 기술/방법론/도메인 측면 중 어떤 부분에 주목하는지 검토
- 제외된 논문이 있다면 대비해서 표현
- 최근 연구 동향에 관심이 있다면 반영
- 예: "전통적인 CNN보다는 Vision Transformer를 활용한 이미지 분류"
- 예: "최신 LLM 기반 멀티모달 연구"`;

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
