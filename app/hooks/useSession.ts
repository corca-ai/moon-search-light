'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Paper } from '../api/search/route';
import {
  Session,
  SessionState,
  PaperAnalysis,
  ChatMessage,
  ContextSummary,
  ActivityType,
} from '../types/session';
import {
  createSession,
  saveSession,
  loadSession,
  addActivity,
  updateSessionState,
  getCurrentSessionId,
  setCurrentSessionId,
} from '../lib/session-storage';
import { STORAGE_KEYS } from '../types/session';
import {
  addToSessionList,
  updateSessionListItem,
  canCreateSession,
  getSessionCount,
} from '../lib/session-list';
import { MAX_SESSION_COUNT } from '../types/session';

// Update options for unified API
export interface UpdateOptions {
  recordActivity?: boolean;
}

// Debounced function interface with cancel/flush support
interface DebouncedFunction<Args extends unknown[]> {
  (...args: Args): void;
  cancel: () => void;
  flush: () => void;
}

// Debounce helper with cancel and flush methods
function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number
): DebouncedFunction<Args> {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingArgs: Args | null = null;

  const debounced = (...args: Args) => {
    if (timeoutId) clearTimeout(timeoutId);
    pendingArgs = args;
    timeoutId = setTimeout(() => {
      fn(...args);
      pendingArgs = null;
      timeoutId = null;
    }, delay);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    pendingArgs = null;
  };

  debounced.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (pendingArgs) {
      fn(...pendingArgs);
      pendingArgs = null;
    }
  };

  return debounced;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Debounced save with cancel/flush support
  const debouncedSaveRef = useRef<DebouncedFunction<[Session]> | null>(null);

  // Initialize debounced save function
  if (!debouncedSaveRef.current) {
    debouncedSaveRef.current = debounce((s: Session) => {
      saveSession(s);
      updateSessionListItem(s);
      // Notify session list to refresh
      window.dispatchEvent(new CustomEvent('session-updated'));
    }, 1000);
  }

  // Initialize session on mount
  useEffect(() => {
    const currentId = getCurrentSessionId();

    if (currentId) {
      const loaded = loadSession(currentId);
      if (loaded) {
        setSession(loaded);
        setIsLoading(false);
        return;
      }
    }

    // No current session — stay null (user creates via + button)
    setIsLoading(false);
  }, []);

  // Cleanup debounced save on unmount
  useEffect(() => {
    return () => {
      // Flush pending saves on unmount
      debouncedSaveRef.current?.flush();
    };
  }, []);

  // Save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Flush pending debounced save first
      debouncedSaveRef.current?.flush();
      if (session) {
        saveSession(session);
        updateSessionListItem(session);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [session]);

  // Internal: update session with activity
  const updateWithActivity = useCallback(
    (type: ActivityType, data: Record<string, unknown>) => {
      setSession((prev) => {
        if (!prev) return prev;
        const updated = addActivity(prev, type, data);
        debouncedSaveRef.current?.(updated);
        return updated;
      });
    },
    []
  );

  // Internal: update session state only
  const updateState = useCallback((stateUpdates: Partial<SessionState>) => {
    setSession((prev) => {
      if (!prev) return prev;
      const updated = updateSessionState(prev, stateUpdates);
      debouncedSaveRef.current?.(updated);
      return updated;
    });
  }, []);

  // Switch to another session
  const switchSession = useCallback((newSession: Session) => {
    // Save current session first
    setSession((prev) => {
      if (prev) {
        saveSession(prev);
        updateSessionListItem(prev);
      }
      return newSession;
    });
    setCurrentSessionId(newSession.id);
  }, []);

  // Cancel pending debounced save (used before session deletion)
  const cancelPendingSave = useCallback(() => {
    debouncedSaveRef.current?.cancel();
  }, []);

  // Replace current session without saving the old one (used when deleting current session)
  const replaceSession = useCallback((newSession: Session | null) => {
    debouncedSaveRef.current?.cancel();
    setSession(newSession);
    if (newSession) {
      setCurrentSessionId(newSession.id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION_ID);
    }
  }, []);

  // Create new session (with limit check)
  const createNewSession = useCallback((name: string): { success: true; session: Session } | { success: false; reason: 'limit_reached'; current: number; max: number } => {
    // Check session limit
    if (!canCreateSession()) {
      return {
        success: false,
        reason: 'limit_reached',
        current: getSessionCount(),
        max: MAX_SESSION_COUNT,
      };
    }

    // Save current session first
    if (session) {
      saveSession(session);
      updateSessionListItem(session);
    }

    const newSession = createSession(name);
    saveSession(newSession);
    addToSessionList(newSession);
    setSession(newSession);
    setCurrentSessionId(newSession.id);
    return { success: true, session: newSession };
  }, [session]);

  // Rename current session
  const renameSession = useCallback((newName: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      const updated = addActivity(prev, 'note_renamed', {
        oldName: prev.name,
        newName,
      });
      updated.name = newName;
      debouncedSaveRef.current?.(updated);
      return updated;
    });
  }, []);

  // Activity recording functions
  const recordSearch = useCallback(
    (query: string, resultCount: number, searchResults: Paper[]) => {
      updateWithActivity('search', { query, resultCount });
      updateState({ query, searchResults });

      // Auto-rename if default name
      setSession((prev) => {
        if (prev && prev.name === '새 연구' && !prev.state.query) {
          const updated = { ...prev, name: query.slice(0, 30) };
          debouncedSaveRef.current?.(updated);
          return updated;
        }
        return prev;
      });
    },
    [updateWithActivity, updateState]
  );

  // Update search results with optional activity recording
  const updateSearchResults = useCallback(
    (searchResults: Paper[], options?: UpdateOptions) => {
      if (options?.recordActivity) {
        updateWithActivity('search', { resultCount: searchResults.length });
      }
      updateState({ searchResults });
    },
    [updateState, updateWithActivity]
  );

  const recordPaperSelected = useCallback(
    (paper: Paper, allSelected: Paper[]) => {
      updateWithActivity('paper_selected', {
        paperId: paper.paperId,
        title: paper.title,
      });
      updateState({ selectedPapers: allSelected });
    },
    [updateWithActivity, updateState]
  );

  const recordPaperExcluded = useCallback(
    (paper: Paper, allExcluded: Paper[]) => {
      updateWithActivity('paper_excluded', {
        paperId: paper.paperId,
        title: paper.title,
      });
      updateState({ excludedPapers: allExcluded });
    },
    [updateWithActivity, updateState]
  );

  const recordPaperRestored = useCallback(
    (paper: Paper, allSelected: Paper[], allExcluded: Paper[]) => {
      updateWithActivity('paper_restored', {
        paperId: paper.paperId,
        title: paper.title,
      });
      updateState({ selectedPapers: allSelected, excludedPapers: allExcluded });
    },
    [updateWithActivity, updateState]
  );

  const recordAnalysisDone = useCallback(
    (paperId: string, analysis: PaperAnalysis, allAnalyses: Record<string, PaperAnalysis>) => {
      updateWithActivity('analysis_done', { paperId });
      updateState({ analyses: allAnalyses });
    },
    [updateWithActivity, updateState]
  );

  const recordTranslationDone = useCallback(
    (paperId: string, allTranslations: Record<string, string>) => {
      updateWithActivity('translation_done', { paperId });
      updateState({ translations: allTranslations });
    },
    [updateWithActivity, updateState]
  );

  const recordChatUser = useCallback(
    (message: string, allMessages: ChatMessage[]) => {
      updateWithActivity('chat_user', { message: message.slice(0, 100) });
      updateState({ chatMessages: allMessages });
    },
    [updateWithActivity, updateState]
  );

  const recordChatAssistant = useCallback(
    (message: string, allMessages: ChatMessage[]) => {
      updateWithActivity('chat_assistant', {
        message: message.slice(0, 100),
      });
      updateState({ chatMessages: allMessages });
    },
    [updateWithActivity, updateState]
  );

  // State update only (no activity record)
  const updateInterestSummary = useCallback(
    (summary: string) => {
      updateState({ interestSummary: summary });
    },
    [updateState]
  );

  const updateContextSummary = useCallback(
    (summary: ContextSummary | null) => {
      updateState({ contextSummary: summary });
    },
    [updateState]
  );

  const updateAssistantActive = useCallback(
    (active: boolean) => {
      updateState({ assistantActive: active });
    },
    [updateState]
  );

  const updateSortBy = useCallback(
    (sortBy: string) => {
      updateState({ sortBy });
    },
    [updateState]
  );

  // Sync all state at once (for initial load from session)
  const syncFromSession = useCallback(() => {
    return session?.state ?? null;
  }, [session]);

  return {
    session,
    isLoading,
    switchSession,
    cancelPendingSave,
    replaceSession,
    createNewSession,
    renameSession,
    recordSearch,
    recordPaperSelected,
    recordPaperExcluded,
    recordPaperRestored,
    recordAnalysisDone,
    recordTranslationDone,
    recordChatUser,
    recordChatAssistant,
    updateInterestSummary,
    updateContextSummary,
    updateAssistantActive,
    updateSortBy,
    updateSearchResults,
    syncFromSession,
  };
}
