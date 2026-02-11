import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `다음 학술 초록을 한국어로 번역해주세요:\n\n${text}`,
      config: {
        systemInstruction: '당신은 학술 논문 번역 전문가입니다. 영어 학술 텍스트를 자연스럽고 정확한 한국어로 번역합니다. 전문 용어는 적절히 번역하되, 필요한 경우 괄호 안에 원어를 병기합니다.',
      },
    });

    const translation = response.text || '';

    return NextResponse.json({ translation });
  } catch (error) {
    console.error('Error translating text:', error);
    return NextResponse.json(
      { error: 'Failed to translate text' },
      { status: 500 }
    );
  }
}
