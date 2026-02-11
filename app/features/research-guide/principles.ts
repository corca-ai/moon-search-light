/**
 * Research Guide 모듈 - 원칙 (Principles)
 *
 * @sync contexts/research-guide-principles.md
 *
 * 이 파일은 Research Guide의 비즈니스 규칙과 설정을 정의합니다.
 * 문서와 동기화를 유지해야 합니다.
 */

// =============================================================================
// 1. AI 모델 설정
// =============================================================================

/** 키워드 추출 및 클러스터링에 사용하는 모델 */
export const RESEARCH_GUIDE_MODEL = 'gemini-3-flash-preview';

/** Temperature (낮을수록 일관성) */
export const RESEARCH_GUIDE_TEMPERATURE = 0.3;

// =============================================================================
// 2. 키워드 추출 설정
// =============================================================================

/** 추출 키워드 최소 수 */
export const KEYWORDS_MIN = 3;

/** 추출 키워드 최대 수 */
export const KEYWORDS_MAX = 5;

// =============================================================================
// 3. 클러스터링 설정
// =============================================================================

/** 클러스터 최소 수 */
export const CLUSTERS_MIN = 3;

/** 클러스터 최대 수 */
export const CLUSTERS_MAX = 6;

/** 클러스터링 최소 논문 수 */
export const CLUSTER_MIN_PAPERS = 5;

// =============================================================================
// 4. 시스템 프롬프트
// =============================================================================

/**
 * 키워드 추출 시스템 프롬프트
 */
export const EXTRACT_KEYWORDS_SYSTEM_PROMPT = `You are a research exploration expert. Given a seed paper (title + abstract), provide:
1. A Korean description (2-3 sentences) explaining what this paper is about, its significance, and the research context — written for someone unfamiliar with the field.
2. Search keywords that help explore the broader research landscape around this paper.

Generate diverse keywords covering:
- The paper's direct topic
- Related methodologies
- Adjacent research fields
- Potential applications
- Foundational concepts

Each keyword should be a concise English search phrase (1-4 words) suitable for academic paper search.
Provide a brief Korean description (1 sentence) for each keyword explaining its relevance to the seed paper.`;

/**
 * 클러스터링 시스템 프롬프트
 */
export const CLUSTER_SYSTEM_PROMPT = `You are a research paper clustering expert. Given a list of papers (title + abstract), group them into thematic clusters.

Rules:
- Each paper must belong to exactly one cluster
- Cluster names should be in English (2-5 words)
- Provide a brief English description (1 sentence) for each cluster
- Focus on the core research approaches, techniques, and methodologies used — NOT application domains
- For example, cluster by "Reinforcement Learning Approaches", "LLM-based Analysis", "Multimodal Collaboration" rather than by "Education", "Healthcare", "Arts" etc.
- If the search query is provided, create sub-topic clusters within that specific research area`;

// =============================================================================
// 5. 에러 메시지
// =============================================================================

export const ERROR_MESSAGES = {
  EXTRACT_MISSING_INPUT: 'Title and abstract are required',
  EXTRACT_FAILED: 'Failed to extract keywords',
  CLUSTER_MISSING_INPUT: 'Papers array is required',
  CLUSTER_MIN_PAPERS: `At least ${CLUSTER_MIN_PAPERS} papers are required for clustering`,
  CLUSTER_FAILED: 'Failed to cluster papers',
} as const;

// =============================================================================
// 6. API 경로
// =============================================================================

/** 키워드 추출 API 경로 */
export const EXTRACT_KEYWORDS_API_PATH = '/api/research-guide/extract-keywords';

/** 클러스터링 API 경로 */
export const CLUSTER_API_PATH = '/api/research-guide/cluster';

// =============================================================================
// 7. 유틸리티 함수
// =============================================================================

/**
 * 클러스터링 가능 여부 확인
 */
export function canCluster(paperCount: number): boolean {
  return paperCount >= CLUSTER_MIN_PAPERS;
}
