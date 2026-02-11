/**
 * Research Guide 모듈 - 메인 엔트리
 *
 * 시드 논문 기반 연구 탐색 가이드 기능을 위한 모듈입니다.
 *
 * @example
 * ```typescript
 * import { RESEARCH_GUIDE_MODEL, canCluster } from '@/features/research-guide';
 * import type { ResearchKeyword, Cluster } from '@/features/research-guide';
 * ```
 */

// =============================================================================
// 원칙 (Principles)
// =============================================================================

export {
  RESEARCH_GUIDE_MODEL,
  RESEARCH_GUIDE_TEMPERATURE,
  KEYWORDS_MIN,
  KEYWORDS_MAX,
  CLUSTERS_MIN,
  CLUSTERS_MAX,
  CLUSTER_MIN_PAPERS,
  EXTRACT_KEYWORDS_SYSTEM_PROMPT,
  CLUSTER_SYSTEM_PROMPT,
  ERROR_MESSAGES,
  EXTRACT_KEYWORDS_API_PATH,
  CLUSTER_API_PATH,
  canCluster,
} from './principles';

// =============================================================================
// 타입 (Types)
// =============================================================================

export type {
  ResearchKeyword,
  ExtractKeywordsRequest,
  ExtractKeywordsResponse,
  Cluster,
  ClusterPaperInput,
  ClusterRequest,
  ClusterResponse,
  ResearchGuideState,
  ResearchGuideSessionState,
} from './types';

export {
  ResearchKeywordSchema,
  ExtractKeywordsResponseSchema,
  ClusterSchema,
  ClusterResponseSchema,
} from './types';

// =============================================================================
// 전략 (Strategies)
// =============================================================================

export {
  buildExtractKeywordsPrompt,
  buildClusterPrompt,
  validateExtractInput,
  validateClusterInput,
  getExtractKeywordsSystemPrompt,
  getClusterSystemPrompt,
  ensureAllPapersClustered,
} from './strategies';
