/**
 * Search 모듈 - 전략 (Strategies)
 *
 * @sync contexts/search-strategy.md
 *
 * 이 파일은 검색의 핵심 로직을 구현합니다.
 * 문서와 동기화를 유지해야 합니다.
 */

import {
  YEAR_WEIGHT,
  CITATION_WEIGHT,
  YEAR_SCORES,
  SPECIFIC_QUERY_MIN_WORDS,
  SPECIFIC_QUERY_MIN_LENGTH,
  SORT_TYPES,
} from './principles';
import type { Paper, SortType, QueryAnalysis, RecommendedScore } from './types';

// =============================================================================
// 1. 텍스트 정규화
// =============================================================================

/**
 * 텍스트 정규화
 * - 소문자 변환
 * - 특수문자 제거 (영숫자, 공백만 유지)
 * - 앞뒤 공백 제거
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

// =============================================================================
// 2. 쿼리 분석
// =============================================================================

/**
 * 쿼리 분석
 */
export function analyzeQuery(query: string): QueryAnalysis {
  const normalized = normalizeText(query);
  const words = normalized.split(/\s+/).filter((w) => w.length > 0);

  const isSpecific =
    words.length >= SPECIFIC_QUERY_MIN_WORDS ||
    query.includes('"') ||
    query.length > SPECIFIC_QUERY_MIN_LENGTH;

  return {
    normalized,
    words,
    isSpecific,
  };
}

// =============================================================================
// 3. 연도 점수 계산
// =============================================================================

/**
 * 연도 점수 계산
 */
export function calculateYearScore(year: number | null): number {
  if (!year) return YEAR_SCORES.OLD.score;

  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  if (age <= YEAR_SCORES.RECENT_1.maxAge) return YEAR_SCORES.RECENT_1.score;
  if (age <= YEAR_SCORES.RECENT_5.maxAge) return YEAR_SCORES.RECENT_5.score;
  if (age <= YEAR_SCORES.RECENT_10.maxAge) return YEAR_SCORES.RECENT_10.score;
  if (age <= YEAR_SCORES.RECENT_15.maxAge) return YEAR_SCORES.RECENT_15.score;
  return YEAR_SCORES.OLD.score;
}

// =============================================================================
// 4. 인용수 점수 계산
// =============================================================================

/**
 * 인용수 점수 계산 (로그 스케일)
 */
export function calculateCitationScore(citations: number): number {
  return Math.log10(citations + 1) / 5;
}

// =============================================================================
// 5. 추천순 점수 계산
// =============================================================================

/**
 * 추천순 종합 점수 계산
 */
export function calculateRecommendedScore(paper: Paper): RecommendedScore {
  const yearScore = calculateYearScore(paper.year);
  const citationScore = calculateCitationScore(paper.citationCount || 0);
  const totalScore = YEAR_WEIGHT * yearScore + CITATION_WEIGHT * citationScore;

  return {
    yearScore,
    citationScore,
    totalScore,
  };
}

// =============================================================================
// 6. 정렬 함수
// =============================================================================

/**
 * 추천순 정렬
 */
export function sortByRecommended(papers: Paper[]): Paper[] {
  return [...papers].sort((a, b) => {
    const scoreA = calculateRecommendedScore(a).totalScore;
    const scoreB = calculateRecommendedScore(b).totalScore;
    return scoreB - scoreA;
  });
}

/**
 * 관련성 정렬 (유사도 점수 기반)
 */
export function sortByRelevance(
  papers: Paper[],
  relevanceScores: Record<string, number>
): Paper[] {
  return [...papers].sort((a, b) => {
    const scoreA = relevanceScores[a.paperId] ?? 0;
    const scoreB = relevanceScores[b.paperId] ?? 0;
    return scoreB - scoreA;
  });
}

/**
 * 최신순 정렬
 */
export function sortByYearDesc(papers: Paper[]): Paper[] {
  return [...papers].sort((a, b) => (b.year || 0) - (a.year || 0));
}

/**
 * 오래된순 정렬
 */
export function sortByYearAsc(papers: Paper[]): Paper[] {
  return [...papers].sort((a, b) => (a.year || 0) - (b.year || 0));
}

/**
 * 인용순 정렬
 */
export function sortByCitations(papers: Paper[]): Paper[] {
  return [...papers].sort(
    (a, b) => (b.citationCount || 0) - (a.citationCount || 0)
  );
}

/**
 * 통합 정렬 함수
 */
export function sortPapers(
  papers: Paper[],
  sortType: SortType,
  relevanceScores?: Record<string, number>
): Paper[] {
  switch (sortType) {
    case SORT_TYPES.RECOMMENDED:
      return sortByRecommended(papers);
    case SORT_TYPES.RELEVANCE:
      // 유사도 점수가 없으면 추천순으로 폴백
      if (!relevanceScores || Object.keys(relevanceScores).length === 0) {
        return sortByRecommended(papers);
      }
      return sortByRelevance(papers, relevanceScores);
    case SORT_TYPES.YEAR_DESC:
      return sortByYearDesc(papers);
    case SORT_TYPES.YEAR_ASC:
      return sortByYearAsc(papers);
    case SORT_TYPES.CITATIONS:
      return sortByCitations(papers);
    default:
      return sortByRecommended(papers);
  }
}

// =============================================================================
// 7. 구체적 쿼리 정렬 (API용)
// =============================================================================

/**
 * 제목 매칭 확인
 */
export function checkTitleMatch(
  title: string,
  queryNormalized: string
): { exact: boolean; contains: boolean } {
  const titleNormalized = normalizeText(title);
  return {
    exact: titleNormalized === queryNormalized,
    contains: titleNormalized.includes(queryNormalized),
  };
}

/**
 * 구체적 쿼리용 정렬 (제목 매칭 우선)
 */
export function sortForSpecificQuery(
  papers: Paper[],
  queryNormalized: string
): Paper[] {
  return [...papers].sort((a, b) => {
    const aMatch = checkTitleMatch(a.title, queryNormalized);
    const bMatch = checkTitleMatch(b.title, queryNormalized);

    // 정확 일치 우선
    if (aMatch.exact && !bMatch.exact) return -1;
    if (!aMatch.exact && bMatch.exact) return 1;

    // 포함 우선
    if (aMatch.contains && !bMatch.contains) return -1;
    if (!aMatch.contains && bMatch.contains) return 1;

    // 인용수 순
    return (b.citationCount || 0) - (a.citationCount || 0);
  });
}

/**
 * 단순 쿼리용 정렬 (인용수만)
 */
export function sortForSimpleQuery(papers: Paper[]): Paper[] {
  return sortByCitations(papers);
}

/**
 * API용 스마트 정렬
 */
export function sortForApi(papers: Paper[], query: string): Paper[] {
  const analysis = analyzeQuery(query);

  if (analysis.isSpecific) {
    return sortForSpecificQuery(papers, analysis.normalized);
  }
  return sortForSimpleQuery(papers);
}

// =============================================================================
// 8. API URL 생성
// =============================================================================

/**
 * 검색 API URL 생성
 */
export function buildSearchUrl(
  baseUrl: string,
  query: string,
  limit: number,
  fields: string
): string {
  const params = new URLSearchParams({
    query,
    limit: limit.toString(),
    fields,
  });
  return `${baseUrl}/paper/search?${params.toString()}`;
}
