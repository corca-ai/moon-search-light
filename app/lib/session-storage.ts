/**
 * @deprecated '@/features/notes' 사용 권장
 */
export {
  SessionStorageError,
  type SessionStorageErrorCode,
  type SessionErrorCallback,
  type SaveResult,
  type LoadResult,
  createEmptyState,
  createSession,
  createSessionFromCluster,
  saveSession,
  loadSession,
  deleteSession,
  getCurrentSessionId,
  setCurrentSessionId,
  addActivity,
  updateSessionState,
  exportSession,
  importSession,
} from '../features/notes';
