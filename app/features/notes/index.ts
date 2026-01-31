/**
 * Notes 모듈 - 메인 엔트리
 *
 * 연구 노트(세션) 관리를 위한 모듈입니다.
 *
 * @example
 * ```typescript
 * import { createSession, saveSession } from '@/features/notes';
 * import { MAX_SESSION_COUNT, STORAGE_KEYS } from '@/features/notes';
 * import type { Session, SessionState } from '@/features/notes';
 * ```
 *
 * @see docs/notes-principles.md - 원칙 문서
 * @see docs/notes-strategy.md - 전략 문서
 * @see docs/notes-format.md - 출력 형식 문서
 */

// =============================================================================
// 원칙 (Principles) - 상수, 규칙, 제한
// =============================================================================

export {
  // 세션 제한
  MAX_SESSION_COUNT,
  MAX_ACTIVITY_COUNT,
  AUTO_SAVE_DELAY,
  DEFAULT_SESSION_NAME,
  AUTO_NAME_MAX_LENGTH,
  CHAT_MESSAGE_MAX_LENGTH,
  // 활동 유형
  ACTIVITY_TYPES,
  type ActivityType,
  // 저장소 키
  STORAGE_KEYS,
  // 에러 코드
  ERROR_CODES,
  ERROR_MESSAGES,
  type SessionStorageErrorCode,
  // 버전
  SESSION_VERSION,
  // 이벤트
  EVENTS,
  // 정렬 기본값
  DEFAULT_SORT_BY,
  // 유틸리티
  canCreateSession,
  shouldTrimActivities,
  getErrorMessage,
} from './principles';

// =============================================================================
// 타입 (Types) - 출력 형식
// =============================================================================

export type {
  // 핵심 타입
  Session,
  SessionState,
  SessionListItem,
  ActivityEvent,
  PaperAnalysis,
  ChatMessage,
  ContextSummary,
  // 결과 타입
  SaveResult,
  LoadResult,
  CreateSessionResult,
  SwitchSessionResult,
  DeleteSessionResult,
  // 콜백/옵션 타입
  SessionErrorCallback,
  UpdateOptions,
  SessionManagerOptions,
  SessionSyncOptions,
  // 외부 타입
  Paper,
} from './types';

export { SessionStorageError } from './types';

// =============================================================================
// 전략 (Strategies) - 핵심 로직
// =============================================================================

export {
  // 세션 생성
  createEmptyState,
  createSession,
  // 세션 CRUD
  saveSession,
  loadSession,
  deleteSession,
  // 현재 세션 ID
  getCurrentSessionId,
  setCurrentSessionId,
  // 활동 관리
  addActivity,
  // 상태 업데이트
  updateSessionState,
  // 세션 목록
  getSessionList,
  createListItem,
  addToSessionList,
  updateSessionListItem,
  removeFromSessionList,
  renameInSessionList,
  getSessionCount,
  // Import/Export
  exportSession,
  importSession,
} from './strategies';
