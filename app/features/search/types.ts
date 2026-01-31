/**
 * Search 모듈 - 타입 정의 (Format)
 *
 * @sync contexts/search-format.md
 *
 * 이 파일은 검색 관련 모든 타입을 정의합니다.
 * 문서와 동기화를 유지해야 합니다.
 */

// =============================================================================
// 1. 핵심 타입
// =============================================================================

/**
 * 논문 정보
 */
export interface Paper {
  /** Semantic Scholar 논문 ID */
  paperId: string;
  /** 논문 제목 */
  title: string;
  /** 초록 (없을 수 있음) */
  abstract: string | null;
  /** 출판 연도 */
  year: number | null;
  /** 저자 목록 */
  authors: Array<{ name: string }>;
  /** 인용 횟수 */
  citationCount: number;
  /** Semantic Scholar URL */
  url: string;
  /** 외부 ID */
  externalIds?: {
    ArXiv?: string;
    DOI?: string;
  };
  /** ArXiv 스냅샷 이미지 */
  snapshots?: string[];
  /** PDF URL */
  pdfUrl?: string;
}

// =============================================================================
// 2. 정렬 타입
// =============================================================================

/**
 * 정렬 타입
 */
export type SortType =
  | 'recommended'
  | 'relevance'
  | 'year-desc'
  | 'year-asc'
  | 'citations';

/**
 * 정렬 옵션
 */
export interface SortOption {
  value: SortType;
  label: string;
}

// =============================================================================
// 3. API 타입
// =============================================================================

/**
 * 검색 요청
 */
export interface SearchRequest {
  query: string;
}

/**
 * 검색 응답
 */
export interface SearchResponse {
  /** 초기 표시용 논문 (20개) */
  papers: Paper[];
  /** 전체 논문 (최대 100개) */
  allPapers: Paper[];
  /** 총 검색 결과 수 */
  total: number;
}

/**
 * 검색 에러 응답
 */
export interface SearchErrorResponse {
  error: string;
}

// =============================================================================
// 4. Semantic Scholar API 타입
// =============================================================================

/**
 * Semantic Scholar API 응답
 */
export interface SemanticScholarResponse {
  data: Paper[];
  total: number;
}

// =============================================================================
// 5. 쿼리 분석 타입
// =============================================================================

/**
 * 쿼리 분석 결과
 */
export interface QueryAnalysis {
  /** 정규화된 쿼리 */
  normalized: string;
  /** 단어 배열 */
  words: string[];
  /** 구체적 쿼리 여부 */
  isSpecific: boolean;
}

// =============================================================================
// 6. 정렬 점수 타입
// =============================================================================

/**
 * 추천순 점수
 */
export interface RecommendedScore {
  /** 연도 점수 (0-1) */
  yearScore: number;
  /** 인용수 점수 (0-1) */
  citationScore: number;
  /** 종합 점수 */
  totalScore: number;
}

// =============================================================================
// 7. 정렬 함수 타입
// =============================================================================

/**
 * 정렬 함수 타입
 */
export type SortFunction = (papers: Paper[]) => Paper[];

/**
 * 정렬 함수 (유사도 점수 포함)
 */
export type SortWithScoresFunction = (
  papers: Paper[],
  relevanceScores?: Record<string, number>
) => Paper[];
