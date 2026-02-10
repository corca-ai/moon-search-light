/**
 * Relevance 모듈 - 메인 엔트리
 *
 * 논문 관련도 계산을 위한 모듈입니다.
 *
 * @example
 * ```typescript
 * import {
 *   cosineSimilarity,
 *   averageEmbedding,
 *   toPercentage,
 *   MAX_CANDIDATE_PAPERS,
 * } from '@/features/relevance';
 * ```
 *
 * @see docs/relevance-principles.md - 원칙 문서
 * @see docs/relevance-strategy.md - 전략 문서
 * @see docs/relevance-format.md - 출력 형식 문서
 */

// =============================================================================
// 원칙 (Principles) - 상수, 규칙, 설정
// =============================================================================

export {
  // 임베딩 설정
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSION,
  // API 제한
  MAX_BATCH_SIZE,
  MAX_CANDIDATE_PAPERS,
  SCORE_DEBOUNCE_MS,
  // 텍스트 설정
  MAX_TEXT_LENGTH,
  // 점수 범위
  SIMILARITY_MIN,
  SIMILARITY_MAX,
  NORMALIZED_MIN,
  NORMALIZED_MAX,
  PERCENTAGE_MIN,
  PERCENTAGE_MAX,
  // 에러 메시지
  ERROR_MESSAGES,
  // API 경로
  EMBEDDINGS_API_PATH,
  // 유틸리티
  shouldLimitCandidates,
  exceedsBatchLimit,
  canCalculateRelevance,
  // 정렬 가중치
  SORT_WEIGHT_YEAR_DEFAULT,
  SORT_WEIGHT_CITATION_DEFAULT,
  SORT_WEIGHT_YEAR_WITH_RELEVANCE,
  SORT_WEIGHT_CITATION_WITH_RELEVANCE,
  SORT_WEIGHT_RELEVANCE,
  DEFAULT_RELEVANCE_SCORE,
} from './principles';

// =============================================================================
// 타입 (Types) - 출력 형식
// =============================================================================

export type {
  // 핵심 타입
  Embedding,
  RelevanceScore,
  RelevanceScores,
  // API 타입
  EmbeddingsRequest,
  EmbeddingsResponse,
  EmbeddingsErrorResponse,
  // 훅 타입
  UseRelevanceScoreProps,
  UseRelevanceScoreReturn,
  // 내부 타입
  EmbeddingCache,
  EmbeddingResult,
  CacheLookupResult,
  // 함수 타입
  FetchEmbeddingsFn,
  CalculateScoresFn,
  // 외부 타입
  Paper,
} from './types';

// =============================================================================
// 전략 (Strategies) - 핵심 로직
// =============================================================================

export {
  // 벡터 연산
  cosineSimilarity,
  averageEmbedding,
  calculateRelevanceScore,
  // 점수 변환
  toNormalized,
  toPercentage,
  // 텍스트 전처리
  prepareTextForEmbedding,
  // 후보 제한
  limitCandidates,
  // API 호출
  fetchEmbeddingsFromApi,
  // 캐시 유틸리티
  lookupCache,
  updateCache,
  // 입력 검증
  validateEmbeddingsRequest,
  // AbortError 확인
  isAbortError,
} from './strategies';
