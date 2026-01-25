import { Session, SessionListItem, STORAGE_KEYS, MAX_SESSION_COUNT } from '../types/session';

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
export function getSessionList(): SessionListItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION_LIST);
    if (!data) return [];
    return JSON.parse(data) as SessionListItem[];
  } catch (error) {
    console.error('Failed to get session list:', error);
    return [];
  }
}

// Save session list
function saveSessionList(list: SessionListItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION_LIST, JSON.stringify(list));
  } catch (error) {
    console.error('Failed to save session list:', error);
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
export function addToSessionList(session: Session): void {
  const list = getSessionList();
  const item = createListItem(session);

  // Check if already exists
  const existingIndex = list.findIndex((i) => i.id === session.id);
  if (existingIndex >= 0) {
    list[existingIndex] = item;
  } else {
    list.unshift(item); // Add to beginning
  }

  saveSessionList(list);
}

// Update session in list
export function updateSessionListItem(session: Session): void {
  const list = getSessionList();
  const index = list.findIndex((i) => i.id === session.id);

  if (index >= 0) {
    list[index] = createListItem(session);
    saveSessionList(list);
  }
}

// Remove session from list
export function removeFromSessionList(id: string): void {
  const list = getSessionList();
  const filtered = list.filter((i) => i.id !== id);
  saveSessionList(filtered);
}

// Rename session in list
export function renameInSessionList(id: string, newName: string): void {
  const list = getSessionList();
  const index = list.findIndex((i) => i.id === id);

  if (index >= 0) {
    list[index].name = newName;
    list[index].updatedAt = new Date().toISOString();
    saveSessionList(list);
  }
}
