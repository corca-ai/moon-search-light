import type { Paper } from '../api/search/route';

// Activity Types
export type ActivityType =
  | 'search'
  | 'paper_selected'
  | 'paper_excluded'
  | 'paper_restored'
  | 'analysis_done'
  | 'translation_done'
  | 'chat_user'
  | 'chat_assistant'
  | 'note_created'
  | 'note_renamed';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  timestamp: string;
  data: Record<string, unknown>;
}

// Paper Analysis
export interface PaperAnalysis {
  overview: string;
  goals: string;
  method: string;
  results: string;
  keywords: string[];
}

// Chat Message
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

// Context Summary
export interface ContextSummary {
  connections: string;
  themes: string;
  gaps: string;
  directions: string;
}

// Session State (current snapshot)
export interface SessionState {
  query: string;
  sortBy: string;
  selectedPapers: Paper[];
  excludedPapers: Paper[];
  analyses: Record<string, PaperAnalysis>;
  translations: Record<string, string>;
  interestSummary: string;
  contextSummary: ContextSummary | null;
  chatMessages: ChatMessage[];
  assistantActive: boolean;
}

// Full Session
export interface Session {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  state: SessionState;
  activities: ActivityEvent[];
  version: string;
}

// Session List Item (metadata only)
export interface SessionListItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  paperCount: number;
  activityCount: number;
  lastQuery: string;
}

// Schema version
export const SESSION_VERSION = '1.0.0';

// LocalStorage keys
export const STORAGE_KEYS = {
  SESSION_LIST: 'moonlight_session_list',
  SESSION_PREFIX: 'moonlight_session_',
  CURRENT_SESSION_ID: 'moonlight_current_session_id',
} as const;
