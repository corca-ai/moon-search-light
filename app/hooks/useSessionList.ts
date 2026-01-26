'use client';

import { useState, useCallback, useEffect } from 'react';
import { SessionListItem } from '../types/session';
import {
  getSessionList,
  removeFromSessionList,
  renameInSessionList,
} from '../lib/session-list';
import {
  loadSession,
  deleteSession,
  exportSession,
  importSession,
  saveSession,
} from '../lib/session-storage';
import { addToSessionList } from '../lib/session-list';

export function useSessionList() {
  const [sessionList, setSessionList] = useState<SessionListItem[]>([]);

  // Load session list on mount
  useEffect(() => {
    setSessionList(getSessionList());
  }, []);

  // Listen for session updates to refresh the list
  useEffect(() => {
    const handleSessionUpdated = () => {
      setSessionList(getSessionList());
    };

    window.addEventListener('session-updated', handleSessionUpdated);
    return () => window.removeEventListener('session-updated', handleSessionUpdated);
  }, []);

  // Refresh list
  const refresh = useCallback(() => {
    setSessionList(getSessionList());
  }, []);

  // Load a session by ID
  const load = useCallback((id: string) => {
    return loadSession(id);
  }, []);

  // Delete a session
  const remove = useCallback((id: string) => {
    deleteSession(id);
    removeFromSessionList(id);
    setSessionList((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Rename a session
  const rename = useCallback((id: string, newName: string) => {
    renameInSessionList(id, newName);

    // Also update the session itself
    const session = loadSession(id);
    if (session) {
      session.name = newName;
      session.updatedAt = new Date().toISOString();
      saveSession(session);
    }

    setSessionList((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, name: newName, updatedAt: new Date().toISOString() }
          : item
      )
    );
  }, []);

  // Export a session to JSON string
  const exportToJson = useCallback((id: string): string | null => {
    const session = loadSession(id);
    if (!session) return null;
    return exportSession(session);
  }, []);

  // Import a session from JSON string
  const importFromJson = useCallback((json: string): boolean => {
    const session = importSession(json);
    if (!session) return false;

    saveSession(session);
    addToSessionList(session);
    setSessionList(getSessionList());
    return true;
  }, []);

  return {
    sessionList,
    refresh,
    load,
    remove,
    rename,
    exportToJson,
    importFromJson,
  };
}
