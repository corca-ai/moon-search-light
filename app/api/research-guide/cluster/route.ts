import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import {
  RESEARCH_GUIDE_MODEL,
  RESEARCH_GUIDE_TEMPERATURE,
  buildClusterPrompt,
  validateClusterInput,
  getClusterSystemPrompt,
  ensureAllPapersClustered,
  ERROR_MESSAGES,
} from '@/app/features/research-guide';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ClusterSchema = z.object({
  clusters: z.array(z.object({
    name: z.string().describe('English cluster name (2-5 words)'),
    description: z.string().describe('English 1-sentence description'),
    paperIndices: z.array(z.number()).describe('해당 클러스터 논문 인덱스 (0-based)'),
  })),
});

export async function POST(request: NextRequest) {
  try {
    const { papers, query } = await request.json();

    const validation = validateClusterInput(papers);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: RESEARCH_GUIDE_MODEL,
      contents: buildClusterPrompt(papers, query),
      config: {
        systemInstruction: getClusterSystemPrompt(),
        temperature: RESEARCH_GUIDE_TEMPERATURE,
        responseMimeType: 'application/json',
        responseSchema: z.toJSONSchema(ClusterSchema),
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const clusters = ensureAllPapersClustered(parsed.clusters || [], papers.length);

    return NextResponse.json({ clusters });
  } catch (error) {
    console.error('Error clustering papers:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.CLUSTER_FAILED },
      { status: 500 }
    );
  }
}
