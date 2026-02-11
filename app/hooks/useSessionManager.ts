'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Paper } from '../api/search/route';
import {
  Session,
  SessionState,
  SessionListItem,
  PaperAnalysis,
  ChatMessage,
  ContextSummary,
  MAX_SESSION_COUNT,
} from '../types/session';
import {
  createSession,
  createSessionFromCluster,
  saveSession,
  loadSession,
  deleteSession,
  getCurrentSessionId,
  setCurrentSessionId,
  SessionStorageError,
  SessionErrorCallback,
} from '../lib/session-storage';
import type { ForkFromClusterParams } from '../features/notes';
import {
  getSessionList,
  addToSessionList,
  updateSessionListItem,
  removeFromSessionList,
  renameInSessionList,
  canCreateSession,
  getSessionCount,
} from '../lib/session-list';
import { useSession, UpdateOptions } from './useSession';
import { useSessionList } from './useSessionList';
import { useSessionSync, useSessionListSync } from './useSessionSync';

// Result types
export type CreateSessionResult =
  | { success: true; session: Session }
  | { success: false; reason: 'limit_reached'; current: number; max: number };

export interface UseSessionManagerOptions {
  onError?: SessionErrorCallback;
  enableSync?: boolean;
}

/**
 * Unified session manager hook that consolidates session state management,
 * session list operations, and multi-tab synchronization.
 */
export function useSessionManager(options: UseSessionManagerOptions = {}) {
  const { onError, enableSync = true } = options;

  // Use existing hooks
  const session = useSession();
  const sessionList = useSessionList();

  // Track external changes to avoid redundant updates
  const isExternalUpdateRef = useRef(false);

  // Handle external session changes from other tabs
  const handleExternalSessionChange = useCallback(
    (updatedSession: Session) => {
      if (session.session?.id === updatedSession.id) {
        isExternalUpdateRef.current = true;
        session.switchSession(updatedSession);
        isExternalUpdateRef.current = false;
      }
    },
    [session]
  );

  // Handle external session list changes from other tabs
  const handleExternalListChange = useCallback(() => {
    sessionList.refresh();
  }, [sessionList]);

  // Enable multi-tab sync
  useSessionSync({
    sessionId: session.session?.id ?? null,
    onExternalChange: handleExternalSessionChange,
    enabled: enableSync,
  });

  useSessionListSync(handleExternalListChange, enableSync);

  // Switch to another session
  const switchSession = useCallback(
    (id: string) => {
      const loadedSession = sessionList.load(id);
      if (loadedSession) {
        session.switchSession(loadedSession);
        sessionList.refresh();
        return { success: true as const, session: loadedSession };
      }
      return { success: false as const, reason: 'not_found' as const };
    },
    [session, sessionList]
  );

  // Create new session
  const createNewSession = useCallback(
    (name: string = '새 연구'): CreateSessionResult => {
      const result = session.createNewSession(name);
      if (result.success) {
        sessionList.refresh();
      }
      return result;
    },
    [session, sessionList]
  );

  // Delete session
  const deleteSessionById = useCallback(
    (id: string) => {
      const isCurrentSession = session.session?.id === id;

      // Cancel pending debounced save to prevent it from re-writing stale data
      session.cancelPendingSave();

      // Remove from storage and session list
      sessionList.remove(id);

      if (isCurrentSession) {
        // Read remaining sessions from localStorage (React state is stale here)
        const remaining = getSessionList().filter((item) => item.id !== id);
        if (remaining.length > 0) {
          const next = loadSession(remaining[0].id);
          if (next) {
            session.replaceSession(next);
            sessionList.refresh();
            return { success: true, newSession: next };
          }
        }
        // No remaining sessions — clear current
        session.replaceSession(null);
        sessionList.refresh();
        return { success: true, newSession: null };
      }

      // Refresh to ensure React state matches localStorage
      sessionList.refresh();
      return { success: true, newSession: null };
    },
    [session, sessionList]
  );

  // Rename session
  const renameSessionById = useCallback(
    (id: string, newName: string) => {
      sessionList.rename(id, newName);
      if (session.session?.id === id) {
        session.renameSession(newName);
      }
    },
    [session, sessionList]
  );

  // Fork a cluster into a new independent session
  const forkFromCluster = useCallback(
    (params: ForkFromClusterParams): CreateSessionResult => {
      if (!canCreateSession()) {
        return {
          success: false,
          reason: 'limit_reached',
          current: getSessionCount(),
          max: MAX_SESSION_COUNT,
        };
      }

      // Save current session first
      if (session.session) {
        saveSession(session.session);
        updateSessionListItem(session.session);
      }

      const newSession = createSessionFromCluster(params);
      saveSession(newSession);
      addToSessionList(newSession);
      session.switchSession(newSession);
      sessionList.refresh();
      return { success: true, session: newSession };
    },
    [session, sessionList]
  );

  // Get current session state for restoration
  const getSessionState = useCallback((): SessionState | null => {
    return session.session?.state ?? null;
  }, [session.session]);

  // Clear current session state (for new session)
  const clearState = useCallback(() => {
    // This doesn't actually clear the session, just returns empty state info
    return {
      query: '',
      sortBy: 'recommended' as const,
      selectedPapers: [] as Paper[],
      excludedPapers: [] as Paper[],
      searchResults: [] as Paper[],
      analyses: {} as Record<string, PaperAnalysis>,
      translations: {} as Record<string, string>,
      interestSummary: '',
      contextSummary: null as ContextSummary | null,
      chatMessages: [] as ChatMessage[],
      assistantActive: false,
    };
  }, []);

  return {
    // Current session state
    session: session.session,
    isLoading: session.isLoading,
    sessionList: sessionList.sessionList,

    // Session actions
    switchSession,
    createNewSession,
    deleteSession: deleteSessionById,
    renameSession: renameSessionById,
    forkFromCluster,

    // State restoration
    getSessionState,
    clearState,

    // Session list operations
    refreshSessionList: sessionList.refresh,
    exportSession: sessionList.exportToJson,
    importSession: sessionList.importFromJson,

    // Recording functions (pass-through from useSession)
    recordSearch: session.recordSearch,
    recordPaperSelected: session.recordPaperSelected,
    recordPaperExcluded: session.recordPaperExcluded,
    recordPaperRestored: session.recordPaperRestored,
    recordAnalysisDone: session.recordAnalysisDone,
    recordTranslationDone: session.recordTranslationDone,
    recordChatUser: session.recordChatUser,
    recordChatAssistant: session.recordChatAssistant,

    // State update functions (pass-through from useSession)
    updateInterestSummary: session.updateInterestSummary,
    updateContextSummary: session.updateContextSummary,
    updateAssistantActive: session.updateAssistantActive,
    updateSortBy: session.updateSortBy,
    updateSearchResults: session.updateSearchResults,
    updateResearchGuide: session.updateResearchGuide,
  };
}
