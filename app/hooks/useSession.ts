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
import {
  addToSessionList,
  updateSessionListItem,
} from '../lib/session-list';

// Debounce helper
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Debounced save
  const debouncedSaveRef = useRef(
    debounce((s: Session) => {
      saveSession(s);
      updateSessionListItem(s);
    }, 1000)
  );

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

    // Create new session if none exists
    const newSession = createSession('새 연구');
    setSession(newSession);
    saveSession(newSession);
    addToSessionList(newSession);
    setCurrentSessionId(newSession.id);
    setIsLoading(false);
  }, []);

  // Save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
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
        debouncedSaveRef.current(updated);
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
      debouncedSaveRef.current(updated);
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

  // Create new session
  const createNewSession = useCallback((name: string) => {
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
    return newSession;
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
      debouncedSaveRef.current(updated);
      return updated;
    });
  }, []);

  // Activity recording functions
  const recordSearch = useCallback(
    (query: string, resultCount: number) => {
      updateWithActivity('search', { query, resultCount });
      updateState({ query });

      // Auto-rename if default name
      setSession((prev) => {
        if (prev && prev.name === '새 연구' && !prev.state.query) {
          const updated = { ...prev, name: query.slice(0, 30) };
          debouncedSaveRef.current(updated);
          return updated;
        }
        return prev;
      });
    },
    [updateWithActivity, updateState]
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
    syncFromSession,
  };
}
