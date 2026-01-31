/**
 * AI Analysis 모듈 - 원칙 (Principles)
 *
 * @sync contexts/ai-analysis-principles.md
 *
 * 이 파일은 AI 분석의 비즈니스 규칙과 설정을 정의합니다.
 * 문서와 동기화를 유지해야 합니다.
 */

// =============================================================================
// 1. AI 모델 설정
// =============================================================================

/** 요약/번역/분석에 사용하는 모델 */
export const AI_MODEL = 'gpt-4o-mini';

/** 임베딩에 사용하는 모델 */
export const EMBEDDING_MODEL = 'text-embedding-3-small';

// =============================================================================
// 2. 논문 요약 설정
// =============================================================================

/** 배치 요약 크기 */
export const BATCH_SIZE = 3;

/** 키워드 개수 범위 */
export const KEYWORDS_MIN = 3;
export const KEYWORDS_MAX = 5;

// =============================================================================
// 3. 번역 설정
// =============================================================================

/** 번역 소스 언어 */
export const TRANSLATE_SOURCE_LANG = 'en';

/** 번역 대상 언어 */
export const TRANSLATE_TARGET_LANG = 'ko';

// =============================================================================
// 4. 관심 주제 요약 설정
// =============================================================================

/** 관심 요약 최대 길이 (문자) */
export const INTEREST_SUMMARY_MAX_LENGTH = 100;

/** 관심 요약 최대 토큰 */
export const INTEREST_SUMMARY_MAX_TOKENS = 200;

/** 관심 요약 Temperature (낮을수록 일관성) */
export const INTEREST_SUMMARY_TEMPERATURE = 0.3;

/** 관심 요약 디바운스 (ms) */
export const INTEREST_DEBOUNCE_MS = 500;

// =============================================================================
// 5. 컨텍스트 분석 설정
// =============================================================================

/** 컨텍스트 분석 최소 논문 수 */
export const CONTEXT_MIN_PAPERS = 2;

/** 공통 방법론 개수 범위 */
export const CONTEXT_METHODS_MIN = 2;
export const CONTEXT_METHODS_MAX = 4;

/** 차이점 개수 범위 */
export const CONTEXT_DIFFERENCES_MIN = 2;
export const CONTEXT_DIFFERENCES_MAX = 4;

// =============================================================================
// 6. 시스템 프롬프트
// =============================================================================

/**
 * 논문 요약 시스템 프롬프트
 */
export const SUMMARIZE_SYSTEM_PROMPT = `당신은 학술 논문을 분석하는 전문가입니다. 주어진 논문을 구조화된 형식으로 분석하여 개요, 연구 목표, 방법론, 결과를 한국어로 요약하고, 핵심 키워드를 영어로 추출합니다.`;

/**
 * 번역 시스템 프롬프트
 */
export const TRANSLATE_SYSTEM_PROMPT = `당신은 학술 논문 번역 전문가입니다. 영어 학술 텍스트를 자연스럽고 정확한 한국어로 번역합니다. 전문 용어는 적절히 번역하되, 필요한 경우 괄호 안에 원어를 병기합니다.`;

/**
 * 관심 주제 분석 시스템 프롬프트
 */
export const INTEREST_SYSTEM_PROMPT = `연구 관심사를 분석하는 전문가. 간결하게 답변.`;

/**
 * 컨텍스트 분석 시스템 프롬프트
 */
export const CONTEXT_SYSTEM_PROMPT = `당신은 학술 논문을 비교 분석하는 전문가입니다.
여러 논문을 검토하여 공통점과 차이점을 파악하고, 연구 지형을 요약합니다.
모든 응답은 한국어로 작성합니다.`;

// =============================================================================
// 7. 에러 메시지
// =============================================================================

export const ERROR_MESSAGES = {
  SUMMARIZE_MISSING_INPUT: 'Abstract and title are required',
  SUMMARIZE_FAILED: 'Failed to summarize paper',
  TRANSLATE_MISSING_INPUT: 'Text is required',
  TRANSLATE_FAILED: 'Failed to translate text',
  CONTEXT_MIN_PAPERS: 'At least 2 papers are required',
  CONTEXT_FAILED: 'Failed to generate context summary',
} as const;

// =============================================================================
// 8. 유틸리티 함수
// =============================================================================

/**
 * 컨텍스트 분석 가능 여부 확인
 */
export function canAnalyzeContext(paperCount: number): boolean {
  return paperCount >= CONTEXT_MIN_PAPERS;
}

/**
 * 배치 분할
 */
export function splitIntoBatches<T>(items: T[], batchSize: number = BATCH_SIZE): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}
