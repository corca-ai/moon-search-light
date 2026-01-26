'use client';

import { useEffect, useCallback, useRef } from 'react';
import { Session, STORAGE_KEYS } from '../types/session';

interface UseSessionSyncOptions {
  sessionId: string | null;
  onExternalChange: (session: Session) => void;
  enabled?: boolean;
}

/**
 * Hook for synchronizing session state across multiple browser tabs.
 * Listens for localStorage 'storage' events and triggers callback when
 * the current session is modified in another tab.
 */
export function useSessionSync({
  sessionId,
  onExternalChange,
  enabled = true,
}: UseSessionSyncOptions) {
  // Use ref to avoid stale closure issues
  const onExternalChangeRef = useRef(onExternalChange);
  onExternalChangeRef.current = onExternalChange;

  const handleStorageChange = useCallback(
    (event: StorageEvent) => {
      // Check if this is our session being changed
      if (!sessionId || !enabled) return;

      const expectedKey = `${STORAGE_KEYS.SESSION_PREFIX}${sessionId}`;

      // Only react to changes to the current session
      if (event.key !== expectedKey) return;

      // Session was deleted in another tab
      if (event.newValue === null) {
        return;
      }

      try {
        const updatedSession = JSON.parse(event.newValue) as Session;
        onExternalChangeRef.current(updatedSession);
      } catch (error) {
        console.error('Failed to parse session from storage event:', error);
      }
    },
    [sessionId, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [handleStorageChange, enabled]);
}

/**
 * Hook for detecting when the session list changes in another tab.
 */
export function useSessionListSync(
  onExternalChange: (event: StorageEvent) => void,
  enabled = true
) {
  const onExternalChangeRef = useRef(onExternalChange);
  onExternalChangeRef.current = onExternalChange;

  const handleStorageChange = useCallback(
    (event: StorageEvent) => {
      if (!enabled) return;

      // React to session list changes
      if (event.key === STORAGE_KEYS.SESSION_LIST) {
        onExternalChangeRef.current(event);
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [handleStorageChange, enabled]);
}
