/**
 * Research Assistant 모듈 - 타입 정의 (Format)
 *
 * @sync contexts/research-assistant-format.md
 *
 * 이 파일은 Research Assistant 관련 모든 타입을 정의합니다.
 * 문서와 동기화를 유지해야 합니다.
 */

import type { Paper } from '../search/types';
import type { PaperAnalysis, ContextSummary } from '../notes/types';

// =============================================================================
// 1. 핵심 타입
// =============================================================================

/**
 * 채팅 역할
 */
export type ChatRole = 'user' | 'assistant' | 'system';

/**
 * 채팅 메시지
 */
export interface ChatMessage {
  /** 역할 */
  role: ChatRole;
  /** 내용 */
  content: string;
  /** 타임스탬프 (선택) */
  timestamp?: number;
}

// =============================================================================
// 2. API 타입
// =============================================================================

/**
 * 채팅 컨텍스트
 */
export interface ChatContext {
  /** 선택된 논문 */
  papers?: Paper[];
  /** 논문별 분석 결과 */
  analyses?: Record<string, PaperAnalysis>;
  /** 통합 컨텍스트 분석 */
  contextSummary?: ContextSummary;
}

/**
 * 채팅 요청
 */
export interface ChatRequest {
  /** 대화 기록 */
  messages: ChatMessage[];
  /** 컨텍스트 */
  context: ChatContext;
}

/**
 * SSE 스트림 이벤트
 */
export type ChatStreamEvent = { content: string } | { done: true };

/**
 * 채팅 에러 응답
 */
export interface ChatErrorResponse {
  error: string;
}

// =============================================================================
// 3. 훅 타입
// =============================================================================

/**
 * useResearchAssistant 훅 props
 */
export interface UseResearchAssistantProps {
  /** 선택된 논문 */
  selectedPapers: Paper[];
  /** 관심 주제 요약 */
  interestSummary: string;
  /** 활성 상태 변경 콜백 */
  onActiveChange?: (active: boolean) => void;
}

/**
 * useResearchAssistant 훅 반환값
 */
export interface UseResearchAssistantReturn {
  /** 패널 활성 상태 */
  isActive: boolean;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 채팅 메시지 목록 */
  chatMessages: ChatMessage[];
  /** 패널 활성화 */
  activate: () => void;
  /** 패널 비활성화 */
  deactivate: () => void;
  /** 메시지 전송 */
  sendMessage: (message: string) => Promise<void>;
  /** 메시지 직접 설정 */
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  /** 활성 상태 직접 설정 */
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>;
  /** 로딩 상태 직접 설정 */
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  /** 초기화 */
  reset: () => void;
  /** 세션 복원 */
  restoreState: (active: boolean, messages: ChatMessage[]) => void;
}

// =============================================================================
// 4. 프롬프트 빌더 타입
// =============================================================================

/**
 * 시스템 프롬프트 입력
 */
export interface SystemPromptInput {
  papers?: Paper[];
  analyses?: Record<string, PaperAnalysis>;
  contextSummary?: ContextSummary;
}

/**
 * 논문 프롬프트 섹션
 */
export interface PaperPromptSection {
  title: string;
  year: number | null;
  citationCount: number;
  abstract?: string;
  analysis?: PaperAnalysis;
}

// =============================================================================
// 5. 내보내기 타입
// =============================================================================

/**
 * 내보내기 옵션
 */
export interface ExportOptions {
  /** 파일명 */
  filename?: string;
  /** 포함할 메타데이터 */
  includeMetadata?: boolean;
}

/**
 * 내보낸 대화
 */
export interface ExportedConversation {
  /** 내보내기 시간 */
  exportedAt: string;
  /** 메시지 목록 */
  messages: ChatMessage[];
  /** 논문 정보 (선택) */
  papers?: Paper[];
}

// =============================================================================
// Re-export for convenience
// =============================================================================

export type { Paper, PaperAnalysis, ContextSummary };
