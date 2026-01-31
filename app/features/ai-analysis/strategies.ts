/**
 * AI Analysis 모듈 - 전략 (Strategies)
 *
 * @sync contexts/ai-analysis-strategy.md
 *
 * 이 파일은 AI 분석의 핵심 로직을 구현합니다.
 * 문서와 동기화를 유지해야 합니다.
 */

import {
  SUMMARIZE_SYSTEM_PROMPT,
  TRANSLATE_SYSTEM_PROMPT,
  INTEREST_SYSTEM_PROMPT,
  CONTEXT_SYSTEM_PROMPT,
  INTEREST_SUMMARY_MAX_TOKENS,
  INTEREST_SUMMARY_TEMPERATURE,
  INTEREST_SUMMARY_MAX_LENGTH,
  splitIntoBatches,
} from './principles';
import type {
  SummarizePromptInput,
  ContextPromptInput,
  ContextPaper,
} from './types';

// =============================================================================
// 1. 프롬프트 빌더
// =============================================================================

/**
 * 요약 사용자 프롬프트 생성
 */
export function buildSummarizePrompt(input: SummarizePromptInput): string {
  return `논문 제목: ${input.title}

초록: ${input.abstract}

이 논문을 다음 형식으로 분석해주세요:
1. 개요 (overview): 논문의 전체적인 개요 (1-2문장)
2. 연구 목표 (goals): 논문의 연구 목표 및 목적 (1-2문장)
3. 방법론 (method): 사용된 연구 방법론 (1-2문장)
4. 결과 (results): 주요 연구 결과 및 기여 (1-2문장)
5. 키워드 (keywords): 핵심 키워드 (영어, 3-5개)`;
}

/**
 * 번역 사용자 프롬프트 생성
 */
export function buildTranslatePrompt(text: string): string {
  return `다음 학술 초록을 한국어로 번역해주세요:

${text}`;
}

/**
 * 관심 주제 사용자 프롬프트 생성
 */
export function buildInterestPrompt(selectedTitles: string[]): string {
  const titlesText = selectedTitles.length > 0
    ? selectedTitles.map((t) => `- ${t}`).join('\n')
    : '(없음)';

  return `사용자가 논문을 검색하고 선택했습니다.

선택한 논문 (관심 있음):
${titlesText}

위 내용을 바탕으로 사용자의 연구 관심사를 ${INTEREST_SUMMARY_MAX_LENGTH}글자 이하로 요약하세요.
- 구체적인 기술/방법론/도메인 측면중 어떤 부분에 주목하는지 검토
- 예: "Vision Transformer를 활용한 이미지 분류"
- 예: "Transformer 기반 대규모 언어 모델과 사전학습 기법"`;
}

/**
 * 컨텍스트 분석 논문 컨텍스트 생성
 */
export function buildPapersContext(papers: ContextPaper[]): string {
  return papers
    .map((p, idx) => `[${idx + 1}] ${p.title}\n초록: ${p.abstract || '없음'}`)
    .join('\n\n');
}

/**
 * 컨텍스트 분석 사용자 프롬프트 생성
 */
export function buildContextPrompt(input: ContextPromptInput): string {
  const papersContext = buildPapersContext(input.papers);

  return `다음 ${input.papers.length}개의 논문을 분석하세요:

${papersContext}

분석 요청:
1. 이 논문들이 공통으로 다루는 핵심 문제는 무엇인가요?
2. 공통으로 사용되는 방법론은 무엇인가요?
3. 논문들 간의 주요 차이점이나 다른 접근법은 무엇인가요?
4. 이 연구들을 종합하면, 현재 이 분야의 연구 지형은 어떠하며 어디로 향하고 있나요?`;
}

// =============================================================================
// 2. 메시지 빌더
// =============================================================================

/**
 * 요약 메시지 배열 생성
 */
export function buildSummarizeMessages(input: SummarizePromptInput) {
  return [
    { role: 'system' as const, content: SUMMARIZE_SYSTEM_PROMPT },
    { role: 'user' as const, content: buildSummarizePrompt(input) },
  ];
}

/**
 * 번역 메시지 배열 생성
 */
export function buildTranslateMessages(text: string) {
  return [
    { role: 'system' as const, content: TRANSLATE_SYSTEM_PROMPT },
    { role: 'user' as const, content: buildTranslatePrompt(text) },
  ];
}

/**
 * 관심 주제 메시지 배열 생성
 */
export function buildInterestMessages(selectedTitles: string[]) {
  return [
    { role: 'system' as const, content: INTEREST_SYSTEM_PROMPT },
    { role: 'user' as const, content: buildInterestPrompt(selectedTitles) },
  ];
}

/**
 * 컨텍스트 분석 메시지 배열 생성
 */
export function buildContextMessages(input: ContextPromptInput) {
  return [
    { role: 'system' as const, content: CONTEXT_SYSTEM_PROMPT },
    { role: 'user' as const, content: buildContextPrompt(input) },
  ];
}

// =============================================================================
// 3. API 설정 빌더
// =============================================================================

/**
 * 관심 주제 API 설정
 */
export function getInterestApiConfig() {
  return {
    max_tokens: INTEREST_SUMMARY_MAX_TOKENS,
    temperature: INTEREST_SUMMARY_TEMPERATURE,
  };
}

// =============================================================================
// 4. 배치 처리 유틸리티
// =============================================================================

/**
 * 배치 처리를 위한 청크 분할
 */
export { splitIntoBatches };

/**
 * 순차 배치 처리
 */
export async function processBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>,
  onBatchComplete?: (results: R[], batchIndex: number) => void
): Promise<R[]> {
  const batches = splitIntoBatches(items, batchSize);
  const allResults: R[] = [];

  for (let i = 0; i < batches.length; i++) {
    const batchResults = await processor(batches[i]);
    allResults.push(...batchResults);
    onBatchComplete?.(batchResults, i);
  }

  return allResults;
}

// =============================================================================
// 5. 디바운스 유틸리티
// =============================================================================

/**
 * 디바운스 함수 생성
 */
export function createDebounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number
) {
  let timeoutId: NodeJS.Timeout | null = null;

  const debounced = (...args: Args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

// =============================================================================
// 6. 입력 검증
// =============================================================================

/**
 * 요약 입력 검증
 */
export function validateSummarizeInput(
  title: unknown,
  abstract: unknown
): { valid: true } | { valid: false; error: string } {
  if (!title || !abstract) {
    return { valid: false, error: 'Abstract and title are required' };
  }
  return { valid: true };
}

/**
 * 번역 입력 검증
 */
export function validateTranslateInput(
  text: unknown
): { valid: true } | { valid: false; error: string } {
  if (!text) {
    return { valid: false, error: 'Text is required' };
  }
  return { valid: true };
}

/**
 * 컨텍스트 분석 입력 검증
 */
export function validateContextInput(
  papers: unknown
): { valid: true } | { valid: false; error: string } {
  if (!papers || !Array.isArray(papers) || papers.length < 2) {
    return { valid: false, error: 'At least 2 papers are required' };
  }
  return { valid: true };
}
