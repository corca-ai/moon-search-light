/**
 * AI Analysis 모듈 - 타입 정의 (Format)
 *
 * @sync contexts/ai-analysis-format.md
 *
 * 이 파일은 AI 분석 관련 모든 타입을 정의합니다.
 * 문서와 동기화를 유지해야 합니다.
 */

import { z } from 'zod';

// =============================================================================
// 1. 논문 분석 결과
// =============================================================================

/**
 * 논문 분석 결과 Zod 스키마
 */
export const PaperAnalysisSchema = z.object({
  overview: z.string().describe('논문의 전체적인 개요 (1-2문장)'),
  goals: z.string().describe('논문의 연구 목표 및 목적 (1-2문장)'),
  method: z.string().describe('사용된 연구 방법론 (1-2문장)'),
  results: z.string().describe('주요 연구 결과 및 기여 (1-2문장)'),
  keywords: z.array(z.string()).describe('논문의 핵심 키워드 (영어, 3-5개)'),
});

/**
 * 논문 분석 결과
 */
export type PaperAnalysis = z.infer<typeof PaperAnalysisSchema>;

/**
 * 논문 분석 결과 인터페이스 (명시적)
 */
export interface IPaperAnalysis {
  /** 논문 전체 개요 (1-2문장) */
  overview: string;
  /** 연구 목표 및 목적 (1-2문장) */
  goals: string;
  /** 사용된 연구 방법론 (1-2문장) */
  method: string;
  /** 주요 연구 결과 및 기여 (1-2문장) */
  results: string;
  /** 핵심 키워드 (영어, 3-5개) */
  keywords: string[];
}

// =============================================================================
// 2. 컨텍스트 분석 결과
// =============================================================================

/**
 * 컨텍스트 분석 결과 Zod 스키마
 */
export const ContextSummarySchema = z.object({
  commonProblem: z.string().describe('선택된 논문들이 공통으로 다루는 핵심 문제 (1-2문장)'),
  commonMethods: z.array(z.string()).describe('공통으로 사용되는 방법론 (2-4개)'),
  differences: z.array(z.string()).describe('논문들 간의 주요 차이점/다른 접근법 (2-4개)'),
  researchLandscape: z.string().describe('현재 연구 지형 요약 - 이 분야가 어디로 향하고 있는지 (2-3문장)'),
});

/**
 * 컨텍스트 분석 결과
 */
export type ContextSummary = z.infer<typeof ContextSummarySchema>;

/**
 * 컨텍스트 분석 결과 인터페이스 (명시적)
 */
export interface IContextSummary {
  /** 공통 핵심 문제 (1-2문장) */
  commonProblem: string;
  /** 공통 방법론 (2-4개) */
  commonMethods: string[];
  /** 주요 차이점/다른 접근법 (2-4개) */
  differences: string[];
  /** 연구 지형 요약 (2-3문장) */
  researchLandscape: string;
}

// =============================================================================
// 3. API 요청 타입
// =============================================================================

/**
 * 논문 요약 요청
 */
export interface SummarizeRequest {
  /** 논문 제목 */
  title: string;
  /** 논문 초록 */
  abstract: string;
}

/**
 * 번역 요청
 */
export interface TranslateRequest {
  /** 번역할 텍스트 (영어 초록) */
  text: string;
}

/**
 * 관심 주제 요약 요청
 */
export interface InterestSummaryRequest {
  /** 선택된 논문 제목 배열 */
  selectedTitles: string[];
}

/**
 * 컨텍스트 분석용 논문 정보
 */
export interface ContextPaper {
  title: string;
  abstract?: string;
}

/**
 * 컨텍스트 분석 요청
 */
export interface ContextSummaryRequest {
  /** 분석할 논문 배열 (최소 2개) */
  papers: ContextPaper[];
}

// =============================================================================
// 4. API 응답 타입
// =============================================================================

/**
 * 논문 요약 응답
 */
export type SummarizeResponse = PaperAnalysis;

/**
 * 번역 응답
 */
export interface TranslateResponse {
  translation: string;
}

/**
 * 관심 주제 요약 응답
 */
export interface InterestSummaryResponse {
  summary: string;
}

/**
 * 컨텍스트 분석 응답
 */
export type ContextSummaryResponse = ContextSummary;

/**
 * API 에러 응답
 */
export interface APIErrorResponse {
  error: string;
}

// =============================================================================
// 5. 배치 처리 타입
// =============================================================================

/**
 * 배치 요약 항목
 */
export interface BatchSummarizeItem {
  paperId: string;
  title: string;
  abstract: string;
}

/**
 * 배치 요약 결과
 */
export interface BatchSummarizeResult {
  paperId: string;
  analysis: PaperAnalysis | null;
  error?: string;
}

/**
 * 배치 요약 진행 콜백
 */
export type BatchProgressCallback = (
  completed: number,
  total: number,
  result: BatchSummarizeResult
) => void;

// =============================================================================
// 6. 프롬프트 빌더 타입
// =============================================================================

/**
 * 요약 프롬프트 입력
 */
export interface SummarizePromptInput {
  title: string;
  abstract: string;
}

/**
 * 컨텍스트 분석 프롬프트 입력
 */
export interface ContextPromptInput {
  papers: ContextPaper[];
}
