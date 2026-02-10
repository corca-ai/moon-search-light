/**
 * Relevance 모듈 - 원칙 (Principles)
 *
 * @sync contexts/relevance-principles.md
 *
 * 이 파일은 관련도 계산의 비즈니스 규칙과 설정을 정의합니다.
 * 문서와 동기화를 유지해야 합니다.
 */

// =============================================================================
// 1. 임베딩 모델 설정
// =============================================================================

/** 임베딩 모델 */
export const EMBEDDING_MODEL = 'text-embedding-3-small';

/** 임베딩 차원 */
export const EMBEDDING_DIMENSION = 1536;

// =============================================================================
// 2. API 제한
// =============================================================================

/** 최대 배치 크기 */
export const MAX_BATCH_SIZE = 50;

/** 후보 논문 제한 (API 비용 절감) */
export const MAX_CANDIDATE_PAPERS = 20;

/** 점수 계산 디바운스 (ms) */
export const SCORE_DEBOUNCE_MS = 300;

// =============================================================================
// 3. 텍스트 전처리 설정
// =============================================================================

/** 텍스트 최대 길이 (토큰 제한 고려) */
export const MAX_TEXT_LENGTH = 8000;

// =============================================================================
// 4. 점수 범위
// =============================================================================

/** 코사인 유사도 최소값 */
export const SIMILARITY_MIN = -1;

/** 코사인 유사도 최대값 */
export const SIMILARITY_MAX = 1;

/** 정규화 점수 최소값 */
export const NORMALIZED_MIN = 0;

/** 정규화 점수 최대값 */
export const NORMALIZED_MAX = 1;

/** 퍼센트 점수 최소값 */
export const PERCENTAGE_MIN = 0;

/** 퍼센트 점수 최대값 */
export const PERCENTAGE_MAX = 100;

// =============================================================================
// 5. 에러 메시지
// =============================================================================

export const ERROR_MESSAGES = {
  TEXTS_REQUIRED: 'texts array is required',
  MAX_BATCH_EXCEEDED: 'Maximum 50 texts per request',
  EMBEDDINGS_FAILED: 'Failed to generate embeddings',
  FETCH_FAILED: 'Failed to fetch embeddings',
  VECTOR_LENGTH_MISMATCH: 'Vectors must have the same length',
} as const;

// =============================================================================
// 6. API 엔드포인트
// =============================================================================

/** 임베딩 API 경로 */
export const EMBEDDINGS_API_PATH = '/api/embeddings';

// =============================================================================
// 7. 유틸리티 함수
// =============================================================================

/**
 * 후보 논문 수 제한 확인
 */
export function shouldLimitCandidates(count: number): boolean {
  return count > MAX_CANDIDATE_PAPERS;
}

/**
 * 배치 크기 제한 확인
 */
export function exceedsBatchLimit(count: number): boolean {
  return count > MAX_BATCH_SIZE;
}

/**
 * 계산 가능 여부 확인
 */
export function canCalculateRelevance(
  selectedCount: number,
  candidateCount: number
): boolean {
  return selectedCount > 0 && candidateCount > 0;
}

// =============================================================================
// 8. 정렬 가중치
// =============================================================================

/** 추천순 기본 연도 가중치 (선택 논문 없을 때) */
export const SORT_WEIGHT_YEAR_DEFAULT = 0.6;

/** 추천순 기본 인용수 가중치 (선택 논문 없을 때) */
export const SORT_WEIGHT_CITATION_DEFAULT = 0.4;

/** 추천순 연도 가중치 (선택 논문 있을 때) */
export const SORT_WEIGHT_YEAR_WITH_RELEVANCE = 0.35;

/** 추천순 인용수 가중치 (선택 논문 있을 때) */
export const SORT_WEIGHT_CITATION_WITH_RELEVANCE = 0.25;

/** 추천순 유사도 가중치 (선택 논문 있을 때) */
export const SORT_WEIGHT_RELEVANCE = 0.4;

/** 유사도 미계산 논문의 기본값 */
export const DEFAULT_RELEVANCE_SCORE = 50;
