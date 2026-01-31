/**
 * Search 모듈 - 메인 엔트리
 *
 * 논문 검색 및 정렬을 위한 모듈입니다.
 *
 * @example
 * ```typescript
 * import {
 *   sortPapers,
 *   analyzeQuery,
 *   MAX_RESULTS,
 *   SORT_TYPES,
 * } from '@/features/search';
 * ```
 *
 * @see docs/search-principles.md - 원칙 문서
 * @see docs/search-strategy.md - 전략 문서
 * @see docs/search-format.md - 출력 형식 문서
 */

// =============================================================================
// 원칙 (Principles) - 상수, 규칙, 설정
// =============================================================================

export {
  // API 설정
  SEMANTIC_SCHOLAR_API,
  SEARCH_FIELDS,
  // 검색 제한
  MAX_RESULTS,
  INITIAL_DISPLAY,
  LOAD_MORE_COUNT,
  // 추천순 가중치
  YEAR_WEIGHT,
  CITATION_WEIGHT,
  // 연도 점수
  YEAR_SCORES,
  // 쿼리 분석 설정
  SPECIFIC_QUERY_MIN_WORDS,
  SPECIFIC_QUERY_MIN_LENGTH,
  // 정렬 옵션
  SORT_TYPES,
  DEFAULT_SORT,
  SORT_LABELS,
  // 에러 메시지
  ERROR_MESSAGES,
  // 유틸리티
  canLoadMore,
  getNextDisplayCount,
} from './principles';

// =============================================================================
// 타입 (Types) - 출력 형식
// =============================================================================

export type {
  // 핵심 타입
  Paper,
  // 정렬 타입
  SortType,
  SortOption,
  // API 타입
  SearchRequest,
  SearchResponse,
  SearchErrorResponse,
  SemanticScholarResponse,
  // 쿼리 분석 타입
  QueryAnalysis,
  // 정렬 점수 타입
  RecommendedScore,
  // 함수 타입
  SortFunction,
  SortWithScoresFunction,
} from './types';

// =============================================================================
// 전략 (Strategies) - 핵심 로직
// =============================================================================

export {
  // 텍스트 정규화
  normalizeText,
  // 쿼리 분석
  analyzeQuery,
  // 점수 계산
  calculateYearScore,
  calculateCitationScore,
  calculateRecommendedScore,
  // 정렬 함수
  sortByRecommended,
  sortByRelevance,
  sortByYearDesc,
  sortByYearAsc,
  sortByCitations,
  sortPapers,
  // API용 정렬
  checkTitleMatch,
  sortForSpecificQuery,
  sortForSimpleQuery,
  sortForApi,
  // URL 생성
  buildSearchUrl,
} from './strategies';
