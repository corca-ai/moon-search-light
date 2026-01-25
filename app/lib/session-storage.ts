import {
  Session,
  SessionState,
  ActivityEvent,
  SESSION_VERSION,
  STORAGE_KEYS,
} from '../types/session';

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

// Save session to localStorage
export function saveSession(session: Session): void {
  try {
    const key = `${STORAGE_KEYS.SESSION_PREFIX}${session.id}`;
    const updated = { ...session, updatedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save session:', error);
  }
}

// Load session from localStorage
export function loadSession(id: string): Session | null {
  try {
    const key = `${STORAGE_KEYS.SESSION_PREFIX}${id}`;
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as Session;
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
}

// Delete session from localStorage
export function deleteSession(id: string): void {
  try {
    const key = `${STORAGE_KEYS.SESSION_PREFIX}${id}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to delete session:', error);
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
export function getCurrentSessionId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION_ID);
  } catch {
    return null;
  }
}

// Set current session ID
export function setCurrentSessionId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION_ID, id);
  } catch (error) {
    console.error('Failed to set current session ID:', error);
  }
}

// Export session to JSON
export function exportSession(session: Session): string {
  return JSON.stringify(session, null, 2);
}

// Import session from JSON
export function importSession(json: string): Session | null {
  try {
    const session = JSON.parse(json) as Session;
    // Assign new ID to avoid conflicts
    session.id = generateId();
    session.updatedAt = new Date().toISOString();
    return session;
  } catch (error) {
    console.error('Failed to import session:', error);
    return null;
  }
}
