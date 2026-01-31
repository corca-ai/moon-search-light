/**
 * Search 모듈 - 원칙 (Principles)
 *
 * @sync contexts/search-principles.md
 *
 * 이 파일은 검색의 비즈니스 규칙과 설정을 정의합니다.
 * 문서와 동기화를 유지해야 합니다.
 */

// =============================================================================
// 1. API 설정
// =============================================================================

/** Semantic Scholar API 기본 URL */
export const SEMANTIC_SCHOLAR_API = 'https://api.semanticscholar.org/graph/v1';

/** 검색 필드 */
export const SEARCH_FIELDS = 'title,abstract,year,authors,citationCount,url,externalIds';

// =============================================================================
// 2. 검색 제한
// =============================================================================

/** 최대 검색 결과 */
export const MAX_RESULTS = 100;

/** 초기 표시 개수 */
export const INITIAL_DISPLAY = 20;

/** 추가 로드 개수 */
export const LOAD_MORE_COUNT = 20;

// =============================================================================
// 3. 추천순 가중치
// =============================================================================

/** 연도 가중치 */
export const YEAR_WEIGHT = 0.6;

/** 인용수 가중치 */
export const CITATION_WEIGHT = 0.4;

// =============================================================================
// 4. 연도 점수 매핑
// =============================================================================

/** 연도별 점수 */
export const YEAR_SCORES = {
  RECENT_1: { maxAge: 1, score: 1.0 },
  RECENT_5: { maxAge: 5, score: 0.8 },
  RECENT_10: { maxAge: 10, score: 0.5 },
  RECENT_15: { maxAge: 15, score: 0.25 },
  OLD: { maxAge: Infinity, score: 0.1 },
} as const;

// =============================================================================
// 5. 쿼리 분석 설정
// =============================================================================

/** 구체적 쿼리 최소 단어 수 */
export const SPECIFIC_QUERY_MIN_WORDS = 4;

/** 구체적 쿼리 최소 길이 */
export const SPECIFIC_QUERY_MIN_LENGTH = 50;

// =============================================================================
// 6. 정렬 옵션
// =============================================================================

/** 정렬 타입 */
export const SORT_TYPES = {
  RECOMMENDED: 'recommended',
  RELEVANCE: 'relevance',
  YEAR_DESC: 'year-desc',
  YEAR_ASC: 'year-asc',
  CITATIONS: 'citations',
} as const;

/** 기본 정렬 */
export const DEFAULT_SORT = SORT_TYPES.RECOMMENDED;

/** 정렬 옵션 라벨 */
export const SORT_LABELS: Record<string, string> = {
  [SORT_TYPES.RECOMMENDED]: '추천순',
  [SORT_TYPES.RELEVANCE]: '관련성',
  [SORT_TYPES.YEAR_DESC]: '최신순',
  [SORT_TYPES.YEAR_ASC]: '오래된순',
  [SORT_TYPES.CITATIONS]: '인용순',
};

// =============================================================================
// 7. 에러 메시지
// =============================================================================

export const ERROR_MESSAGES = {
  QUERY_REQUIRED: 'Query parameter is required',
  FETCH_FAILED: 'Failed to fetch papers',
} as const;

// =============================================================================
// 8. 유틸리티 함수
// =============================================================================

/**
 * 더 보기 가능 여부 확인
 */
export function canLoadMore(displayCount: number, totalCount: number): boolean {
  return displayCount < totalCount && displayCount < MAX_RESULTS;
}

/**
 * 다음 표시 개수 계산
 */
export function getNextDisplayCount(current: number, total: number): number {
  return Math.min(current + LOAD_MORE_COUNT, total, MAX_RESULTS);
}
