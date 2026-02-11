/**
 * Notes 모듈 - 전략 (Strategies)
 *
 * @sync contexts/notes-strategy.md
 *
 * 이 파일은 세션 관리의 핵심 로직을 구현합니다.
 * 문서와 동기화를 유지해야 합니다.
 */

import {
  STORAGE_KEYS,
  SESSION_VERSION,
  DEFAULT_SESSION_NAME,
  DEFAULT_SORT_BY,
  MAX_ACTIVITY_COUNT,
  ERROR_CODES,
  ERROR_MESSAGES,
  type SessionStorageErrorCode,
  type ActivityType,
} from './principles';
import {
  Session,
  SessionState,
  SessionListItem,
  ActivityEvent,
  SessionStorageError,
  SaveResult,
  SessionErrorCallback,
} from './types';

// =============================================================================
// 1. 유틸리티
// =============================================================================

/**
 * UUID 생성
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * 에러 코드 감지
 */
function detectErrorCode(error: unknown): SessionStorageErrorCode {
  if (error instanceof DOMException) {
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      return ERROR_CODES.QUOTA_EXCEEDED;
    }
  }
  if (error instanceof SyntaxError) {
    return ERROR_CODES.PARSE_ERROR;
  }
  return ERROR_CODES.UNKNOWN;
}

/**
 * 에러 생성 헬퍼
 */
function createStorageError(
  code: SessionStorageErrorCode,
  originalError?: unknown
): SessionStorageError {
  return new SessionStorageError(ERROR_MESSAGES[code], code, originalError);
}

// =============================================================================
// 2. 세션 상태 생성
// =============================================================================

/**
 * 빈 세션 상태 생성
 */
export function createEmptyState(): SessionState {
  return {
    query: '',
    sortBy: DEFAULT_SORT_BY,
    selectedPapers: [],
    excludedPapers: [],
    searchResults: [],
    analyses: {},
    translations: {},
    interestSummary: '',
    contextSummary: null,
    chatMessages: [],
    assistantActive: false,
    researchGuide: undefined,
  };
}

/**
 * 새 세션 생성
 */
export function createSession(name: string = DEFAULT_SESSION_NAME): Session {
  const now = new Date().toISOString();
  const id = generateId();

  return {
    id,
    name,
    createdAt: now,
    updatedAt: now,
    state: createEmptyState(),
    activities: [
      {
        id: generateId(),
        type: 'note_created',
        timestamp: now,
        data: { name },
      },
    ],
    version: SESSION_VERSION,
  };
}

// =============================================================================
// 3. 세션 저장/로드
// =============================================================================

/**
 * 세션 저장
 */
export function saveSession(
  session: Session,
  onError?: SessionErrorCallback
): SaveResult {
  try {
    const key = `${STORAGE_KEYS.SESSION_PREFIX}${session.id}`;
    const updated = { ...session, updatedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(updated));
    return { success: true };
  } catch (error) {
    const code = detectErrorCode(error);
    const storageError = createStorageError(code, error);
    console.error('Failed to save session:', error);
    onError?.(storageError);
    return { success: false, error: storageError };
  }
}

/**
 * 세션 로드
 */
export function loadSession(
  id: string,
  onError?: SessionErrorCallback
): Session | null {
  try {
    const key = `${STORAGE_KEYS.SESSION_PREFIX}${id}`;
    const data = localStorage.getItem(key);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as Session;
  } catch (error) {
    const code = detectErrorCode(error);
    const storageError = createStorageError(code, error);
    console.error('Failed to load session:', error);
    onError?.(storageError);
    return null;
  }
}

/**
 * 세션 삭제
 */
export function deleteSession(
  id: string,
  onError?: SessionErrorCallback
): SaveResult {
  try {
    const key = `${STORAGE_KEYS.SESSION_PREFIX}${id}`;
    localStorage.removeItem(key);
    return { success: true };
  } catch (error) {
    const code = detectErrorCode(error);
    const storageError = createStorageError(code, error);
    console.error('Failed to delete session:', error);
    onError?.(storageError);
    return { success: false, error: storageError };
  }
}

// =============================================================================
// 4. 현재 세션 ID 관리
// =============================================================================

/**
 * 현재 세션 ID 가져오기
 */
export function getCurrentSessionId(
  onError?: SessionErrorCallback
): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION_ID);
  } catch (error) {
    const storageError = createStorageError(detectErrorCode(error), error);
    onError?.(storageError);
    return null;
  }
}

/**
 * 현재 세션 ID 설정
 */
export function setCurrentSessionId(
  id: string,
  onError?: SessionErrorCallback
): SaveResult {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION_ID, id);
    return { success: true };
  } catch (error) {
    const code = detectErrorCode(error);
    const storageError = createStorageError(code, error);
    console.error('Failed to set current session ID:', error);
    onError?.(storageError);
    return { success: false, error: storageError };
  }
}

// =============================================================================
// 5. 활동 기록 관리
// =============================================================================

/**
 * 활동 추가 (FIFO로 10개 유지)
 */
export function addActivity(
  session: Session,
  type: ActivityType,
  data: Record<string, unknown>
): Session {
  const event: ActivityEvent = {
    id: generateId(),
    type,
    timestamp: new Date().toISOString(),
    data,
  };

  const activities = [...session.activities, event];

  // FIFO: 10개 초과 시 오래된 것 제거
  if (activities.length > MAX_ACTIVITY_COUNT) {
    activities.shift();
  }

  return {
    ...session,
    activities,
    updatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// 6. 세션 상태 업데이트
// =============================================================================

/**
 * 세션 상태 업데이트
 */
export function updateSessionState(
  session: Session,
  stateUpdates: Partial<SessionState>
): Session {
  return {
    ...session,
    state: { ...session.state, ...stateUpdates },
    updatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// 7. 세션 목록 관리
// =============================================================================

/**
 * 세션 목록 가져오기
 */
export function getSessionList(
  onError?: SessionErrorCallback
): SessionListItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION_LIST);
    if (!data) return [];
    return JSON.parse(data) as SessionListItem[];
  } catch (error) {
    const storageError = createStorageError(
      error instanceof SyntaxError ? ERROR_CODES.PARSE_ERROR : ERROR_CODES.UNKNOWN,
      error
    );
    console.error('Failed to get session list:', error);
    onError?.(storageError);
    return [];
  }
}

/**
 * 세션 목록 저장 (내부용)
 */
function saveSessionList(
  list: SessionListItem[],
  onError?: SessionErrorCallback
): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION_LIST, JSON.stringify(list));
    return true;
  } catch (error) {
    const isQuotaError =
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' || error.code === 22);
    const storageError = createStorageError(
      isQuotaError ? ERROR_CODES.QUOTA_EXCEEDED : ERROR_CODES.UNKNOWN,
      error
    );
    console.error('Failed to save session list:', error);
    onError?.(storageError);
    return false;
  }
}

/**
 * 세션에서 목록 아이템 생성
 */
export function createListItem(session: Session): SessionListItem {
  return {
    id: session.id,
    name: session.name,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    paperCount: session.state.selectedPapers.length,
    activityCount: session.activities.length,
    lastQuery: session.state.query,
  };
}

/**
 * 세션 목록에 추가
 */
export function addToSessionList(
  session: Session,
  onError?: SessionErrorCallback
): boolean {
  const list = getSessionList(onError);
  const item = createListItem(session);

  // 이미 존재하면 업데이트
  const existingIndex = list.findIndex((i) => i.id === session.id);
  if (existingIndex >= 0) {
    list[existingIndex] = item;
  } else {
    list.unshift(item); // 새 항목은 앞에 추가
  }

  return saveSessionList(list, onError);
}

/**
 * 세션 목록 아이템 업데이트
 */
export function updateSessionListItem(
  session: Session,
  onError?: SessionErrorCallback
): boolean {
  const list = getSessionList(onError);
  const index = list.findIndex((i) => i.id === session.id);

  if (index >= 0) {
    list[index] = createListItem(session);
    return saveSessionList(list, onError);
  }
  return true;
}

/**
 * 세션 목록에서 제거
 */
export function removeFromSessionList(
  id: string,
  onError?: SessionErrorCallback
): boolean {
  const list = getSessionList(onError);
  const filtered = list.filter((i) => i.id !== id);
  return saveSessionList(filtered, onError);
}

/**
 * 세션 목록에서 이름 변경
 */
export function renameInSessionList(
  id: string,
  newName: string,
  onError?: SessionErrorCallback
): boolean {
  const list = getSessionList(onError);
  const index = list.findIndex((i) => i.id === id);

  if (index >= 0) {
    list[index].name = newName;
    list[index].updatedAt = new Date().toISOString();
    return saveSessionList(list, onError);
  }
  return true;
}

/**
 * 세션 수 가져오기
 */
export function getSessionCount(): number {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION_LIST);
    if (!data) return 0;
    return (JSON.parse(data) as SessionListItem[]).length;
  } catch {
    return 0;
  }
}

// =============================================================================
// 8. 클러스터 분기
// =============================================================================

export interface ForkFromClusterParams {
  /** 클러스터명 (세션 이름으로 사용) */
  clusterName: string;
  /** 해당 클러스터의 논문 목록 */
  papers: import('./types').Paper[];
  /** 해당 논문들의 분석 결과 */
  analyses: Record<string, import('./types').PaperAnalysis>;
  /** 해당 논문들의 번역 결과 */
  translations: Record<string, string>;
}

/**
 * 클러스터에서 새 세션을 분기 생성
 *
 * 클러스터의 논문 + 분석/번역 결과를 복사하여 독립 세션으로 만든다.
 * 채팅/시드/키워드 등은 복사하지 않는다.
 */
export function createSessionFromCluster(params: ForkFromClusterParams): Session {
  const { clusterName, papers, analyses, translations } = params;
  const now = new Date().toISOString();
  const id = generateId();

  // 해당 논문에 대한 분석/번역만 필터링
  const filteredAnalyses: Record<string, import('./types').PaperAnalysis> = {};
  const filteredTranslations: Record<string, string> = {};

  for (const paper of papers) {
    if (analyses[paper.paperId]) {
      filteredAnalyses[paper.paperId] = analyses[paper.paperId];
    }
    if (translations[paper.paperId]) {
      filteredTranslations[paper.paperId] = translations[paper.paperId];
    }
  }

  return {
    id,
    name: clusterName,
    createdAt: now,
    updatedAt: now,
    state: {
      ...createEmptyState(),
      searchResults: papers,
      analyses: filteredAnalyses,
      translations: filteredTranslations,
    },
    activities: [
      {
        id: generateId(),
        type: 'note_created',
        timestamp: now,
        data: { name: clusterName },
      },
    ],
    version: SESSION_VERSION,
  };
}

// =============================================================================
// 9. Import/Export
// =============================================================================

/**
 * 세션을 JSON으로 내보내기
 */
export function exportSession(session: Session): string {
  return JSON.stringify(session, null, 2);
}

/**
 * JSON에서 세션 가져오기
 */
export function importSession(
  json: string,
  onError?: SessionErrorCallback
): Session | null {
  try {
    const session = JSON.parse(json) as Session;
    // 충돌 방지를 위해 새 ID 할당
    session.id = generateId();
    session.updatedAt = new Date().toISOString();
    return session;
  } catch (error) {
    const storageError = createStorageError(ERROR_CODES.PARSE_ERROR, error);
    console.error('Failed to import session:', error);
    onError?.(storageError);
    return null;
  }
}
