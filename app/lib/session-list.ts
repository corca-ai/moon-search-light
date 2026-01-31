/**
 * @deprecated '@/features/notes' 사용 권장
 */
export {
  getSessionList,
  createListItem,
  addToSessionList,
  updateSessionListItem,
  removeFromSessionList,
  renameInSessionList,
  getSessionCount,
} from '../features/notes';

import {
  getSessionCount as _getSessionCount,
  canCreateSession as _canCreateSession,
} from '../features/notes';

/** @deprecated '@/features/notes' 사용 권장 */
export function canCreateSession(): boolean {
  return _canCreateSession(_getSessionCount());
}
