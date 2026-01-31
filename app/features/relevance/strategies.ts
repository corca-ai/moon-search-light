/**
 * Relevance 모듈 - 전략 (Strategies)
 *
 * @sync contexts/relevance-strategy.md
 *
 * 이 파일은 관련도 계산의 핵심 로직을 구현합니다.
 * 문서와 동기화를 유지해야 합니다.
 */

import {
  MAX_TEXT_LENGTH,
  MAX_CANDIDATE_PAPERS,
  EMBEDDINGS_API_PATH,
} from './principles';
import type { Embedding, EmbeddingsRequest, EmbeddingsResponse } from './types';

// =============================================================================
// 1. 벡터 연산
// =============================================================================

/**
 * 코사인 유사도 계산
 *
 * @param a 첫 번째 벡터
 * @param b 두 번째 벡터
 * @returns 유사도 (-1 ~ 1)
 * @throws 벡터 길이가 다른 경우
 */
export function cosineSimilarity(a: Embedding, b: Embedding): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * 평균 임베딩 계산
 *
 * @param embeddings 임베딩 배열
 * @returns 평균 임베딩 벡터
 */
export function averageEmbedding(embeddings: Embedding[]): Embedding {
  if (embeddings.length === 0) return [];

  const dim = embeddings[0].length;
  const avg = new Array(dim).fill(0);

  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      avg[i] += emb[i];
    }
  }

  for (let i = 0; i < dim; i++) {
    avg[i] /= embeddings.length;
  }

  return avg;
}

/**
 * 관련도 점수 계산 (0-1 범위)
 *
 * @param candidateEmbedding 후보 논문 임베딩
 * @param selectedEmbeddings 선택 논문 임베딩 배열
 * @returns 관련도 점수 (0 ~ 1)
 */
export function calculateRelevanceScore(
  candidateEmbedding: Embedding,
  selectedEmbeddings: Embedding[]
): number {
  if (selectedEmbeddings.length === 0 || candidateEmbedding.length === 0) {
    return 0;
  }

  const avgSelected = averageEmbedding(selectedEmbeddings);
  const similarity = cosineSimilarity(candidateEmbedding, avgSelected);

  // [-1, 1] → [0, 1]
  return (similarity + 1) / 2;
}

// =============================================================================
// 2. 점수 변환
// =============================================================================

/**
 * 코사인 유사도를 정규화 점수로 변환
 *
 * @param similarity 코사인 유사도 (-1 ~ 1)
 * @returns 정규화 점수 (0 ~ 1)
 */
export function toNormalized(similarity: number): number {
  return (similarity + 1) / 2;
}

/**
 * 코사인 유사도를 퍼센트로 변환
 *
 * @param similarity 코사인 유사도 (-1 ~ 1)
 * @returns 퍼센트 (0 ~ 100)
 */
export function toPercentage(similarity: number): number {
  return Math.round(toNormalized(similarity) * 100);
}

// =============================================================================
// 3. 텍스트 전처리
// =============================================================================

/**
 * 임베딩용 텍스트 준비
 *
 * @param title 논문 제목
 * @param abstract 논문 초록 (없을 수 있음)
 * @returns 전처리된 텍스트
 */
export function prepareTextForEmbedding(
  title: string,
  abstract: string | null
): string {
  const text = abstract ? `${title}\n\n${abstract}` : title;
  return text.slice(0, MAX_TEXT_LENGTH);
}

// =============================================================================
// 4. 후보 제한
// =============================================================================

/**
 * 후보 논문 수 제한
 *
 * @param papers 후보 논문 배열
 * @returns 제한된 논문 배열
 */
export function limitCandidates<T>(papers: T[]): T[] {
  return papers.slice(0, MAX_CANDIDATE_PAPERS);
}

// =============================================================================
// 5. API 호출
// =============================================================================

/**
 * 임베딩 API 호출
 *
 * @param texts 텍스트 배열
 * @param signal AbortSignal
 * @returns 임베딩 배열
 */
export async function fetchEmbeddingsFromApi(
  texts: string[],
  signal?: AbortSignal
): Promise<Embedding[]> {
  const request: EmbeddingsRequest = { texts };

  const response = await fetch(EMBEDDINGS_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch embeddings');
  }

  const data: EmbeddingsResponse = await response.json();
  return data.embeddings;
}

// =============================================================================
// 6. 캐시 유틸리티
// =============================================================================

/**
 * 캐시에서 임베딩 조회
 *
 * @param cache 임베딩 캐시
 * @param paperIds 논문 ID 배열
 * @returns 캐시된 임베딩과 미스된 ID
 */
export function lookupCache(
  cache: Map<string, Embedding>,
  paperIds: string[]
): { cached: Map<string, Embedding>; missingIds: string[] } {
  const cached = new Map<string, Embedding>();
  const missingIds: string[] = [];

  for (const id of paperIds) {
    const embedding = cache.get(id);
    if (embedding) {
      cached.set(id, embedding);
    } else {
      missingIds.push(id);
    }
  }

  return { cached, missingIds };
}

/**
 * 캐시에 임베딩 저장
 *
 * @param cache 임베딩 캐시
 * @param paperIds 논문 ID 배열
 * @param embeddings 임베딩 배열
 */
export function updateCache(
  cache: Map<string, Embedding>,
  paperIds: string[],
  embeddings: Embedding[]
): void {
  paperIds.forEach((id, idx) => {
    cache.set(id, embeddings[idx]);
  });
}

// =============================================================================
// 7. 입력 검증
// =============================================================================

/**
 * 임베딩 요청 검증
 */
export function validateEmbeddingsRequest(
  texts: unknown
): { valid: true } | { valid: false; error: string } {
  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    return { valid: false, error: 'texts array is required' };
  }
  if (texts.length > 50) {
    return { valid: false, error: 'Maximum 50 texts per request' };
  }
  return { valid: true };
}

// =============================================================================
// 8. AbortError 확인
// =============================================================================

/**
 * AbortError 여부 확인
 */
export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
