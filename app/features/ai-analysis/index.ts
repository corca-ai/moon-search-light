/**
 * AI Analysis 모듈 - 메인 엔트리
 *
 * AI 기반 논문 분석을 위한 모듈입니다.
 *
 * @example
 * ```typescript
 * import {
 *   buildSummarizeMessages,
 *   PaperAnalysisSchema,
 *   AI_MODEL,
 * } from '@/features/ai-analysis';
 * ```
 *
 * @see docs/ai-analysis-principles.md - 원칙 문서
 * @see docs/ai-analysis-strategy.md - 전략 문서
 * @see docs/ai-analysis-format.md - 출력 형식 문서
 */

// =============================================================================
// 원칙 (Principles) - 상수, 규칙, 설정
// =============================================================================

export {
  // AI 모델 설정
  AI_MODEL,
  EMBEDDING_MODEL,
  // 요약 설정
  BATCH_SIZE,
  KEYWORDS_MIN,
  KEYWORDS_MAX,
  // 번역 설정
  TRANSLATE_SOURCE_LANG,
  TRANSLATE_TARGET_LANG,
  // 관심 주제 설정
  INTEREST_SUMMARY_MAX_LENGTH,
  INTEREST_SUMMARY_MAX_TOKENS,
  INTEREST_SUMMARY_TEMPERATURE,
  INTEREST_DEBOUNCE_MS,
  // 컨텍스트 분석 설정
  CONTEXT_MIN_PAPERS,
  CONTEXT_METHODS_MIN,
  CONTEXT_METHODS_MAX,
  CONTEXT_DIFFERENCES_MIN,
  CONTEXT_DIFFERENCES_MAX,
  // 시스템 프롬프트
  SUMMARIZE_SYSTEM_PROMPT,
  TRANSLATE_SYSTEM_PROMPT,
  INTEREST_SYSTEM_PROMPT,
  CONTEXT_SYSTEM_PROMPT,
  // 에러 메시지
  ERROR_MESSAGES,
  // 유틸리티
  canAnalyzeContext,
  splitIntoBatches,
} from './principles';

// =============================================================================
// 타입 (Types) - 출력 형식
// =============================================================================

export type {
  // 분석 결과
  PaperAnalysis,
  IPaperAnalysis,
  ContextSummary,
  IContextSummary,
  // API 요청/응답
  SummarizeRequest,
  SummarizeResponse,
  TranslateRequest,
  TranslateResponse,
  InterestSummaryRequest,
  InterestSummaryResponse,
  ContextSummaryRequest,
  ContextSummaryResponse,
  ContextPaper,
  APIErrorResponse,
  // 배치 처리
  BatchSummarizeItem,
  BatchSummarizeResult,
  BatchProgressCallback,
  // 프롬프트
  SummarizePromptInput,
  ContextPromptInput,
} from './types';

export { PaperAnalysisSchema, ContextSummarySchema } from './types';

// =============================================================================
// 전략 (Strategies) - 핵심 로직
// =============================================================================

export {
  // 프롬프트 빌더
  buildSummarizePrompt,
  buildTranslatePrompt,
  buildInterestPrompt,
  buildPapersContext,
  buildContextPrompt,
  // 메시지 빌더
  buildSummarizeMessages,
  buildTranslateMessages,
  buildInterestMessages,
  buildContextMessages,
  // API 설정
  getInterestApiConfig,
  // 배치 처리
  processBatches,
  // 디바운스
  createDebounce,
  // 입력 검증
  validateSummarizeInput,
  validateTranslateInput,
  validateContextInput,
} from './strategies';
