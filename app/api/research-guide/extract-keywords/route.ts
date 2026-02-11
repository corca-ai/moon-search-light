import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import {
  RESEARCH_GUIDE_MODEL,
  RESEARCH_GUIDE_TEMPERATURE,
  buildExtractKeywordsPrompt,
  validateExtractInput,
  getExtractKeywordsSystemPrompt,
  ERROR_MESSAGES,
} from '@/app/features/research-guide';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ExtractKeywordsSchema = z.object({
  seedDescription: z.string().describe('시드 논문에 대한 한국어 연구 맥락 해설 (2-3문장)'),
  keywords: z.array(z.object({
    keyword: z.string().describe('영어 검색 키워드 (1-4 words)'),
    description: z.string().describe('한국어 1줄 설명'),
  })),
});

export async function POST(request: NextRequest) {
  try {
    const { title, abstract } = await request.json();

    const validation = validateExtractInput(title, abstract);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: RESEARCH_GUIDE_MODEL,
      contents: buildExtractKeywordsPrompt(title, abstract),
      config: {
        systemInstruction: getExtractKeywordsSystemPrompt(),
        temperature: RESEARCH_GUIDE_TEMPERATURE,
        responseMimeType: 'application/json',
        responseSchema: z.toJSONSchema(ExtractKeywordsSchema),
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error extracting keywords:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.EXTRACT_FAILED },
      { status: 500 }
    );
  }
}
