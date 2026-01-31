/**
 * Relevance 모듈 - 타입 정의 (Format)
 *
 * @sync contexts/relevance-format.md
 *
 * 이 파일은 관련도 계산 관련 모든 타입을 정의합니다.
 * 문서와 동기화를 유지해야 합니다.
 */

import type { Paper } from '../../api/search/route';

// =============================================================================
// 1. 핵심 타입
// =============================================================================

/**
 * 임베딩 벡터
 */
export type Embedding = number[];

/**
 * 관련도 점수 (0-100)
 */
export type RelevanceScore = number;

/**
 * 논문 ID별 관련도 점수 맵
 */
export type RelevanceScores = Record<string, RelevanceScore>;

// =============================================================================
// 2. API 타입
// =============================================================================

/**
 * 임베딩 요청
 */
export interface EmbeddingsRequest {
  /** 임베딩할 텍스트 배열 (최대 50개) */
  texts: string[];
}

/**
 * 임베딩 응답
 */
export interface EmbeddingsResponse {
  /** 임베딩 벡터 배열 */
  embeddings: Embedding[];
}

/**
 * 임베딩 에러 응답
 */
export interface EmbeddingsErrorResponse {
  error: string;
}

// =============================================================================
// 3. 훅 타입
// =============================================================================

/**
 * useRelevanceScore 훅 props
 */
export interface UseRelevanceScoreProps {
  /** 선택된 논문 목록 */
  selectedPapers: Paper[];
  /** 후보 논문 목록 */
  candidatePapers: Paper[];
}

/**
 * useRelevanceScore 훅 반환값
 */
export interface UseRelevanceScoreReturn {
  /** 논문 ID별 관련도 점수 (0-100) */
  relevanceScores: RelevanceScores;
  /** 계산 중 여부 */
  isCalculating: boolean;
}

// =============================================================================
// 4. 내부 타입
// =============================================================================

/**
 * 임베딩 캐시
 */
export type EmbeddingCache = Map<string, Embedding>;

/**
 * 임베딩 결과
 */
export interface EmbeddingResult {
  paperId: string;
  embedding: Embedding;
}

/**
 * 캐시 조회 결과
 */
export interface CacheLookupResult {
  /** 캐시에서 찾은 임베딩 */
  cached: Map<string, Embedding>;
  /** 캐시 미스 (API 호출 필요) */
  missing: Paper[];
}

// =============================================================================
// 5. 함수 타입
// =============================================================================

/**
 * 임베딩 fetch 함수 타입
 */
export type FetchEmbeddingsFn = (
  papers: Paper[],
  signal: AbortSignal
) => Promise<Map<string, Embedding>>;

/**
 * 점수 계산 함수 타입
 */
export type CalculateScoresFn = () => Promise<void>;

// =============================================================================
// Re-export for convenience
// =============================================================================

export type { Paper };
