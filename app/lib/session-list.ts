import { Session, SessionListItem, STORAGE_KEYS, MAX_SESSION_COUNT } from '../types/session';
import { SessionStorageError, SessionErrorCallback } from './session-storage';

// Get session count
export function getSessionCount(): number {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION_LIST);
    if (!data) return 0;
    return (JSON.parse(data) as SessionListItem[]).length;
  } catch {
    return 0;
  }
}

// Check if can create new session
export function canCreateSession(): boolean {
  return getSessionCount() < MAX_SESSION_COUNT;
}

// Get all session list items
export function getSessionList(onError?: SessionErrorCallback): SessionListItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION_LIST);
    if (!data) return [];
    return JSON.parse(data) as SessionListItem[];
  } catch (error) {
    const storageError = new SessionStorageError(
      '세션 목록을 불러오는데 실패했습니다.',
      error instanceof SyntaxError ? 'PARSE_ERROR' : 'UNKNOWN',
      error
    );
    console.error('Failed to get session list:', error);
    onError?.(storageError);
    return [];
  }
}

// Save session list
function saveSessionList(list: SessionListItem[], onError?: SessionErrorCallback): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION_LIST, JSON.stringify(list));
    return true;
  } catch (error) {
    const isQuotaError = error instanceof DOMException &&
      (error.name === 'QuotaExceededError' || error.code === 22);
    const storageError = new SessionStorageError(
      isQuotaError ? '저장 공간이 부족합니다.' : '세션 목록 저장에 실패했습니다.',
      isQuotaError ? 'QUOTA_EXCEEDED' : 'UNKNOWN',
      error
    );
    console.error('Failed to save session list:', error);
    onError?.(storageError);
    return false;
  }
}

// Create list item from session
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

// Add session to list
export function addToSessionList(session: Session, onError?: SessionErrorCallback): boolean {
  const list = getSessionList(onError);
  const item = createListItem(session);

  // Check if already exists
  const existingIndex = list.findIndex((i) => i.id === session.id);
  if (existingIndex >= 0) {
    list[existingIndex] = item;
  } else {
    list.unshift(item); // Add to beginning
  }

  return saveSessionList(list, onError);
}

// Update session in list
export function updateSessionListItem(session: Session, onError?: SessionErrorCallback): boolean {
  const list = getSessionList(onError);
  const index = list.findIndex((i) => i.id === session.id);

  if (index >= 0) {
    list[index] = createListItem(session);
    return saveSessionList(list, onError);
  }
  return true;
}

// Remove session from list
export function removeFromSessionList(id: string, onError?: SessionErrorCallback): boolean {
  const list = getSessionList(onError);
  const filtered = list.filter((i) => i.id !== id);
  return saveSessionList(filtered, onError);
}

// Rename session in list
export function renameInSessionList(id: string, newName: string, onError?: SessionErrorCallback): boolean {
  const list = getSessionList(onError);
  const index = list.findIndex((i) => i.id === id);

  if (index >= 0) {
    list[index].name = newName;
    list[index].updatedAt = new Date().toISOString();
    return saveSessionList(list, onError);
  }
  return true;
}
