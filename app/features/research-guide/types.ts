/**
 * Research Guide 모듈 - 타입 정의 (Format)
 *
 * @sync contexts/research-guide-format.md
 *
 * 이 파일은 Research Guide 관련 모든 타입을 정의합니다.
 * 문서와 동기화를 유지해야 합니다.
 */

import { z } from 'zod';
import type { Paper } from '@/app/api/search/route';

// =============================================================================
// 1. 키워드 추출
// =============================================================================

/**
 * 추출된 연구 키워드
 */
export interface ResearchKeyword {
  /** 영어 검색 키워드 (1-4 words) */
  keyword: string;
  /** 한국어 1줄 설명 */
  description: string;
}

/** 키워드 추출 요청 */
export interface ExtractKeywordsRequest {
  title: string;
  abstract: string;
}

/** 키워드 추출 응답 */
export interface ExtractKeywordsResponse {
  /** 시드 논문에 대한 한국어 연구 맥락 해설 (2-3문장) */
  seedDescription: string;
  keywords: ResearchKeyword[];
}

// =============================================================================
// 2. 클러스터링
// =============================================================================

/**
 * 논문 클러스터
 */
export interface Cluster {
  /** 한국어 클러스터명 (2-5 words) */
  name: string;
  /** 한국어 1줄 설명 */
  description: string;
  /** 해당 클러스터 논문 인덱스 (0-based) */
  paperIndices: number[];
}

/** 클러스터링 요청용 논문 데이터 */
export interface ClusterPaperInput {
  title: string;
  abstract: string | null;
}

/** 클러스터링 요청 */
export interface ClusterRequest {
  papers: ClusterPaperInput[];
}

/** 클러스터링 응답 */
export interface ClusterResponse {
  clusters: Cluster[];
}

// =============================================================================
// 3. 훅 상태
// =============================================================================

/**
 * Research Guide 상태
 */
export interface ResearchGuideState {
  /** 시드 논문 ID */
  seedPaperId: string | null;
  /** 추출된 키워드 */
  keywords: ResearchKeyword[];
  /** 키워드 추출 중 여부 */
  isExtractingKeywords: boolean;
  /** 클러스터 결과 */
  clusters: Cluster[];
  /** 클러스터링 중 여부 */
  isClustering: boolean;
  /** 활성 클러스터 인덱스 */
  activeClusterIndex: number | null;
  /** 키워드 검색으로 실행된 검색인지 여부 */
  searchedViaKeyword: boolean;
}

// =============================================================================
// 4. Zod 스키마 (API 응답 검증)
// =============================================================================

export const ResearchKeywordSchema = z.object({
  keyword: z.string(),
  description: z.string(),
});

export const ExtractKeywordsResponseSchema = z.object({
  seedDescription: z.string(),
  keywords: z.array(ResearchKeywordSchema),
});

export const ClusterSchema = z.object({
  name: z.string(),
  description: z.string(),
  paperIndices: z.array(z.number()),
});

export const ClusterResponseSchema = z.object({
  clusters: z.array(ClusterSchema),
});

// =============================================================================
// 5. 세션 저장용 타입
// =============================================================================

/**
 * 세션에 저장되는 Research Guide 상태
 */
export interface ResearchGuideSessionState {
  seedPaperId: string | null;
  /** 시드 논문 전체 객체 (복원 시 searchResults에 없을 수 있으므로 직접 저장) */
  seedPaper?: Paper | null;
  seedDescription: string;
  keywords: ResearchKeyword[];
  clusters: Cluster[];
  activeClusterIndex: number | null;
  searchedViaKeyword: boolean;
}
