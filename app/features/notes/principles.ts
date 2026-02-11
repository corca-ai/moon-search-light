/**
 * Notes 모듈 - 원칙 (Principles)
 *
 * @sync contexts/notes-principles.md
 *
 * 이 파일은 세션 관리의 비즈니스 규칙과 제한을 정의합니다.
 * 문서와 동기화를 유지해야 합니다.
 */

// =============================================================================
// 1. 세션 제한
// =============================================================================

/** 최대 세션 수 */
export const MAX_SESSION_COUNT = 10;

/** 최대 활동 기록 수 (FIFO로 관리) */
export const MAX_ACTIVITY_COUNT = 10;

/** 자동 저장 디바운스 딜레이 (ms) */
export const AUTO_SAVE_DELAY = 1000;

/** 기본 세션 이름 */
export const DEFAULT_SESSION_NAME = '새 연구';

/** 자동 이름 변경 시 쿼리 최대 길이 */
export const AUTO_NAME_MAX_LENGTH = 30;

/** 채팅 메시지 저장 시 최대 길이 */
export const CHAT_MESSAGE_MAX_LENGTH = 100;

// =============================================================================
// 2. 활동 유형
// =============================================================================

/**
 * 활동 유형 정의
 *
 * | 유형 | 설명 |
 * |------|------|
 * | search | 검색 실행 |
 * | paper_selected | 논문 선택 |
 * | paper_excluded | 논문 제외 |
 * | paper_restored | 논문 복원 |
 * | analysis_done | AI 분석 완료 |
 * | translation_done | 번역 완료 |
 * | chat_user | 사용자 채팅 |
 * | chat_assistant | 어시스턴트 응답 |
 * | note_created | 노트 생성 |
 * | note_renamed | 노트 이름 변경 |
 */
export const ACTIVITY_TYPES = {
  SEARCH: 'search',
  PAPER_SELECTED: 'paper_selected',
  PAPER_EXCLUDED: 'paper_excluded',
  PAPER_RESTORED: 'paper_restored',
  ANALYSIS_DONE: 'analysis_done',
  TRANSLATION_DONE: 'translation_done',
  CHAT_USER: 'chat_user',
  CHAT_ASSISTANT: 'chat_assistant',
  NOTE_CREATED: 'note_created',
  NOTE_RENAMED: 'note_renamed',
} as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[keyof typeof ACTIVITY_TYPES];

// =============================================================================
// 3. 저장소 키
// =============================================================================

/**
 * localStorage 키 구조
 *
 * | 키 | 용도 |
 * |----|------|
 * | moonlight_session_list | 세션 메타데이터 목록 |
 * | moonlight_session_{id} | 개별 세션 데이터 |
 * | moonlight_current_session_id | 현재 활성 세션 ID |
 */
export const STORAGE_KEYS = {
  SESSION_LIST: 'moonlight_session_list',
  SESSION_PREFIX: 'moonlight_session_',
  CURRENT_SESSION_ID: 'moonlight_current_session_id',
  USER_EMAIL: 'userEmail',
  PENDING_QUERY: 'moonlight_pending_query',
} as const;

// =============================================================================
// 4. 에러 코드
// =============================================================================

/**
 * 저장소 에러 코드
 *
 * | 코드 | 의미 |
 * |------|------|
 * | QUOTA_EXCEEDED | 저장 공간 부족 |
 * | PARSE_ERROR | JSON 파싱 실패 |
 * | NOT_FOUND | 세션 없음 |
 * | UNKNOWN | 알 수 없는 에러 |
 */
export const ERROR_CODES = {
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  PARSE_ERROR: 'PARSE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN: 'UNKNOWN',
} as const;

export type SessionStorageErrorCode =
  (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * 에러 코드별 사용자 메시지
 */
export const ERROR_MESSAGES: Record<SessionStorageErrorCode, string> = {
  [ERROR_CODES.QUOTA_EXCEEDED]:
    '저장 공간이 부족합니다. 오래된 세션을 삭제해주세요.',
  [ERROR_CODES.PARSE_ERROR]: '세션 데이터가 손상되었습니다.',
  [ERROR_CODES.NOT_FOUND]: '세션을 찾을 수 없습니다.',
  [ERROR_CODES.UNKNOWN]: '세션 저장에 실패했습니다.',
};

// =============================================================================
// 5. 버전 관리
// =============================================================================

/** 현재 세션 스키마 버전 */
export const SESSION_VERSION = '1.0.0';

// =============================================================================
// 6. 이벤트
// =============================================================================

/**
 * 커스텀 이벤트 이름
 */
export const EVENTS = {
  /** 세션 저장 완료 시 발생 */
  SESSION_UPDATED: 'session-updated',
} as const;

// =============================================================================
// 7. 정렬 기본값
// =============================================================================

/** 기본 정렬 기준 */
export const DEFAULT_SORT_BY = 'recommended';

// =============================================================================
// 유틸리티 함수
// =============================================================================

/**
 * 세션 생성 가능 여부 확인
 */
export function canCreateSession(currentCount: number): boolean {
  return currentCount < MAX_SESSION_COUNT;
}

/**
 * 활동 기록 수 제한 확인
 */
export function shouldTrimActivities(count: number): boolean {
  return count > MAX_ACTIVITY_COUNT;
}

/**
 * 에러 코드로 메시지 가져오기
 */
export function getErrorMessage(code: SessionStorageErrorCode): string {
  return ERROR_MESSAGES[code];
}
