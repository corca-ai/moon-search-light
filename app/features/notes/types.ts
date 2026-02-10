/**
 * Notes 모듈 - 타입 정의 (Format)
 *
 * @sync contexts/notes-format.md
 *
 * 이 파일은 세션 관련 모든 타입을 정의합니다.
 * 문서와 동기화를 유지해야 합니다.
 */

import type { Paper } from '../../api/search/route';
import type { ActivityType, SessionStorageErrorCode } from './principles';

// =============================================================================
// 1. 핵심 타입
// =============================================================================

/**
 * 논문 분석 결과
 */
export interface PaperAnalysis {
  overview: string;
  goals: string;
  method: string;
  results: string;
  keywords: string[];
  failed?: boolean;
}

/**
 * 채팅 메시지
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

/**
 * 통합 컨텍스트 분석 결과
 */
export interface ContextSummary {
  commonProblem: string;
  commonMethods: string[];
  differences: string[];
  researchLandscape: string;
}

/**
 * 세션 상태 스냅샷
 *
 * 현재 세션의 모든 상태를 포함합니다.
 */
export interface SessionState {
  /** 마지막 검색어 */
  query: string;
  /** 정렬 기준 */
  sortBy: string;
  /** 선택된 논문 목록 */
  selectedPapers: Paper[];
  /** 제외된 논문 목록 */
  excludedPapers: Paper[];
  /** 검색 결과 (최대 100개) */
  searchResults: Paper[];
  /** 논문 ID → 분석 결과 */
  analyses: Record<string, PaperAnalysis>;
  /** 논문 ID → 번역 */
  translations: Record<string, string>;
  /** 관심 주제 요약 */
  interestSummary: string;
  /** 통합 컨텍스트 분석 결과 */
  contextSummary: ContextSummary | null;
  /** 채팅 기록 */
  chatMessages: ChatMessage[];
  /** 어시스턴트 패널 활성화 여부 */
  assistantActive: boolean;
}

/**
 * 활동 이벤트
 */
export interface ActivityEvent {
  /** UUID */
  id: string;
  /** 활동 유형 */
  type: ActivityType;
  /** ISO 8601 타임스탬프 */
  timestamp: string;
  /** 활동별 데이터 */
  data: Record<string, unknown>;
}

/**
 * 완전한 세션 객체
 */
export interface Session {
  /** UUID */
  id: string;
  /** 세션 이름 */
  name: string;
  /** 생성 시간 (ISO 8601) */
  createdAt: string;
  /** 수정 시간 (ISO 8601) */
  updatedAt: string;
  /** 현재 상태 스냅샷 */
  state: SessionState;
  /** 활동 기록 (최대 10개) */
  activities: ActivityEvent[];
  /** 스키마 버전 */
  version: string;
}

/**
 * 세션 목록용 메타데이터
 */
export interface SessionListItem {
  /** 세션 ID */
  id: string;
  /** 세션 이름 */
  name: string;
  /** 생성 시간 */
  createdAt: string;
  /** 수정 시간 */
  updatedAt: string;
  /** 선택된 논문 수 */
  paperCount: number;
  /** 활동 기록 수 */
  activityCount: number;
  /** 마지막 검색어 */
  lastQuery: string;
}

// =============================================================================
// 2. 에러 타입
// =============================================================================

/**
 * 세션 저장소 에러
 */
export class SessionStorageError extends Error {
  constructor(
    message: string,
    public code: SessionStorageErrorCode,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'SessionStorageError';
  }
}

// =============================================================================
// 3. 결과 타입
// =============================================================================

/**
 * 저장 작업 결과
 */
export type SaveResult =
  | { success: true }
  | { success: false; error: SessionStorageError };

/**
 * 로드 작업 결과
 */
export type LoadResult<T> =
  | { success: true; data: T }
  | { success: false; error: SessionStorageError };

/**
 * 세션 생성 결과
 */
export type CreateSessionResult =
  | { success: true; session: Session }
  | { success: false; reason: 'limit_reached'; current: number; max: number };

/**
 * 세션 전환 결과
 */
export type SwitchSessionResult =
  | { success: true; session: Session }
  | { success: false; reason: 'not_found' };

/**
 * 세션 삭제 결과
 */
export type DeleteSessionResult = {
  success: true;
  newSession: Session | null;
};

// =============================================================================
// 4. 콜백 타입
// =============================================================================

/**
 * 에러 콜백
 */
export type SessionErrorCallback = (error: SessionStorageError) => void;

// =============================================================================
// 5. 옵션 타입
// =============================================================================

/**
 * 상태 업데이트 옵션
 */
export interface UpdateOptions {
  /** 활동 기록 여부 */
  recordActivity?: boolean;
}

/**
 * 세션 매니저 옵션
 */
export interface SessionManagerOptions {
  /** 에러 콜백 */
  onError?: SessionErrorCallback;
  /** 탭 간 동기화 활성화 (기본: true) */
  enableSync?: boolean;
}

/**
 * 세션 동기화 옵션
 */
export interface SessionSyncOptions {
  /** 현재 세션 ID */
  sessionId: string | null;
  /** 외부 변경 콜백 */
  onExternalChange: (session: Session) => void;
  /** 동기화 활성화 여부 */
  enabled?: boolean;
}

// =============================================================================
// Re-export for convenience
// =============================================================================

export type { Paper };
