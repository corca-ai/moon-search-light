/**
 * Research Guide 모듈 - 전략 (Strategies)
 *
 * @sync contexts/research-guide-strategy.md
 *
 * 이 파일은 키워드 추출과 클러스터링의 핵심 로직을 구현합니다.
 * 문서와 동기화를 유지해야 합니다.
 */

import {
  KEYWORDS_MIN,
  KEYWORDS_MAX,
  CLUSTERS_MIN,
  CLUSTERS_MAX,
  CLUSTER_MIN_PAPERS,
  EXTRACT_KEYWORDS_SYSTEM_PROMPT,
  CLUSTER_SYSTEM_PROMPT,
} from './principles';

// =============================================================================
// 1. 프롬프트 빌더
// =============================================================================

/**
 * 키워드 추출 사용자 프롬프트 생성
 */
export function buildExtractKeywordsPrompt(title: string, abstract: string): string {
  return `Seed paper:
Title: ${title}
Abstract: ${abstract}

1. Write a Korean description (2-3 sentences) of this paper for someone unfamiliar with the field. Explain what it studies, why it matters, and its research context.
2. Extract ${KEYWORDS_MIN}-${KEYWORDS_MAX} diverse search keywords for exploring the research landscape around this paper.

Respond in JSON format:
{
  "seedDescription": "이 논문은 ... 한국어 해설",
  "keywords": [
    { "keyword": "english search phrase", "description": "한국어 설명" }
  ]
}`;
}

/**
 * 클러스터링 사용자 프롬프트 생성
 */
export function buildClusterPrompt(papers: Array<{ title: string; abstract: string | null }>): string {
  const paperList = papers.map((p, i) =>
    `[${i}] ${p.title}${p.abstract ? `\n    ${p.abstract.slice(0, 200)}...` : ''}`
  ).join('\n');

  return `Papers to cluster:
${paperList}

Group these ${papers.length} papers into ${CLUSTERS_MIN}-${CLUSTERS_MAX} thematic clusters.
Each paper (referenced by index) must belong to exactly one cluster.

Respond in JSON format:
{
  "clusters": [
    { "name": "한국어 클러스터명", "description": "한국어 설명", "paperIndices": [0, 1, 2] }
  ]
}`;
}

// =============================================================================
// 2. 입력 검증
// =============================================================================

/**
 * 키워드 추출 입력 검증
 */
export function validateExtractInput(title: unknown, abstract: unknown): { valid: boolean; error?: string } {
  if (!title || typeof title !== 'string' || !abstract || typeof abstract !== 'string') {
    return { valid: false, error: 'Title and abstract are required' };
  }
  return { valid: true };
}

/**
 * 클러스터링 입력 검증
 */
export function validateClusterInput(papers: unknown): { valid: boolean; error?: string } {
  if (!Array.isArray(papers)) {
    return { valid: false, error: 'Papers array is required' };
  }
  if (papers.length < CLUSTER_MIN_PAPERS) {
    return { valid: false, error: `At least ${CLUSTER_MIN_PAPERS} papers are required` };
  }
  return { valid: true };
}

// =============================================================================
// 3. 시스템 프롬프트 getter
// =============================================================================

export function getExtractKeywordsSystemPrompt(): string {
  return EXTRACT_KEYWORDS_SYSTEM_PROMPT;
}

export function getClusterSystemPrompt(): string {
  return CLUSTER_SYSTEM_PROMPT;
}

// =============================================================================
// 4. 응답 후처리
// =============================================================================

/**
 * 클러스터링 결과에서 누락된 논문 인덱스를 "기타" 클러스터에 추가
 */
export function ensureAllPapersClustered(
  clusters: Array<{ name: string; description: string; paperIndices: number[] }>,
  totalPapers: number
): Array<{ name: string; description: string; paperIndices: number[] }> {
  const assignedIndices = new Set(clusters.flatMap(c => c.paperIndices));
  const missingIndices: number[] = [];

  for (let i = 0; i < totalPapers; i++) {
    if (!assignedIndices.has(i)) {
      missingIndices.push(i);
    }
  }

  if (missingIndices.length === 0) return clusters;

  return [
    ...clusters,
    { name: '기타', description: '분류되지 않은 논문', paperIndices: missingIndices },
  ];
}
