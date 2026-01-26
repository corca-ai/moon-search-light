import {
  Session,
  SessionState,
  ActivityEvent,
  SESSION_VERSION,
  STORAGE_KEYS,
} from '../types/session';

// Error codes for storage operations
export type SessionStorageErrorCode =
  | 'QUOTA_EXCEEDED'
  | 'PARSE_ERROR'
  | 'NOT_FOUND'
  | 'UNKNOWN';

// Custom error class for session storage operations
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

// Error callback type
export type SessionErrorCallback = (error: SessionStorageError) => void;

// Detect error type from original error
function detectErrorCode(error: unknown): SessionStorageErrorCode {
  if (error instanceof DOMException) {
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      return 'QUOTA_EXCEEDED';
    }
  }
  if (error instanceof SyntaxError) {
    return 'PARSE_ERROR';
  }
  return 'UNKNOWN';
}

// Generate UUID
function generateId(): string {
  return crypto.randomUUID();
}

// Create empty session state
export function createEmptyState(): SessionState {
  return {
    query: '',
    sortBy: 'recommended',
    selectedPapers: [],
    excludedPapers: [],
    searchResults: [],
    analyses: {},
    translations: {},
    interestSummary: '',
    contextSummary: null,
    chatMessages: [],
    assistantActive: false,
  };
}

// Create new session
export function createSession(name: string): Session {
  const now = new Date().toISOString();
  return {
    id: generateId(),
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

// Result type for operations that can fail
export type SaveResult = { success: true } | { success: false; error: SessionStorageError };
export type LoadResult<T> = { success: true; data: T } | { success: false; error: SessionStorageError };

// Save session to localStorage
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
    const storageError = new SessionStorageError(
      code === 'QUOTA_EXCEEDED'
        ? '저장 공간이 부족합니다. 오래된 세션을 삭제해주세요.'
        : '세션 저장에 실패했습니다.',
      code,
      error
    );
    console.error('Failed to save session:', error);
    onError?.(storageError);
    return { success: false, error: storageError };
  }
}

// Load session from localStorage
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
    const storageError = new SessionStorageError(
      code === 'PARSE_ERROR'
        ? '세션 데이터가 손상되었습니다.'
        : '세션 로드에 실패했습니다.',
      code,
      error
    );
    console.error('Failed to load session:', error);
    onError?.(storageError);
    return null;
  }
}

// Delete session from localStorage
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
    const storageError = new SessionStorageError(
      '세션 삭제에 실패했습니다.',
      code,
      error
    );
    console.error('Failed to delete session:', error);
    onError?.(storageError);
    return { success: false, error: storageError };
  }
}

// Add activity to session (max 10)
export function addActivity(
  session: Session,
  type: ActivityEvent['type'],
  data: Record<string, unknown>
): Session {
  const event: ActivityEvent = {
    id: generateId(),
    type,
    timestamp: new Date().toISOString(),
    data,
  };

  const activities = [...session.activities, event];

  // Keep max 10 activities
  if (activities.length > 10) {
    activities.shift();
  }

  return {
    ...session,
    activities,
    updatedAt: new Date().toISOString(),
  };
}

// Update session state
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

// Get current session ID
export function getCurrentSessionId(onError?: SessionErrorCallback): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION_ID);
  } catch (error) {
    const storageError = new SessionStorageError(
      '현재 세션 ID를 가져오는데 실패했습니다.',
      detectErrorCode(error),
      error
    );
    onError?.(storageError);
    return null;
  }
}

// Set current session ID
export function setCurrentSessionId(
  id: string,
  onError?: SessionErrorCallback
): SaveResult {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION_ID, id);
    return { success: true };
  } catch (error) {
    const code = detectErrorCode(error);
    const storageError = new SessionStorageError(
      code === 'QUOTA_EXCEEDED'
        ? '저장 공간이 부족합니다.'
        : '세션 ID 저장에 실패했습니다.',
      code,
      error
    );
    console.error('Failed to set current session ID:', error);
    onError?.(storageError);
    return { success: false, error: storageError };
  }
}

// Export session to JSON
export function exportSession(session: Session): string {
  return JSON.stringify(session, null, 2);
}

// Import session from JSON
export function importSession(
  json: string,
  onError?: SessionErrorCallback
): Session | null {
  try {
    const session = JSON.parse(json) as Session;
    // Assign new ID to avoid conflicts
    session.id = generateId();
    session.updatedAt = new Date().toISOString();
    return session;
  } catch (error) {
    const storageError = new SessionStorageError(
      '세션 데이터 형식이 올바르지 않습니다.',
      'PARSE_ERROR',
      error
    );
    console.error('Failed to import session:', error);
    onError?.(storageError);
    return null;
  }
}
