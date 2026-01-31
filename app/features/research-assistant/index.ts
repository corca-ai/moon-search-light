/**
 * Research Assistant 모듈 - 메인 엔트리
 *
 * AI 기반 연구 어시스턴트를 위한 모듈입니다.
 *
 * @example
 * ```typescript
 * import {
 *   buildSystemPrompt,
 *   buildInitialMessage,
 *   CHAT_MODEL,
 * } from '@/features/research-assistant';
 * ```
 *
 * @see docs/research-assistant-principles.md - 원칙 문서
 * @see docs/research-assistant-strategy.md - 전략 문서
 * @see docs/research-assistant-format.md - 출력 형식 문서
 */

// =============================================================================
// 원칙 (Principles) - 상수, 규칙, 설정
// =============================================================================

export {
  // AI 설정
  CHAT_MODEL,
  RECOMMENDED_RESPONSE_LENGTH,
  // 프롬프트 제한
  ABSTRACT_MAX_LENGTH,
  // 역할 정의
  ASSISTANT_ROLES,
  // 프롬프트 템플릿
  BASE_SYSTEM_PROMPT,
  RESPONSE_GUIDELINES,
  // 초기 메시지 템플릿
  INITIAL_MESSAGE_WITH_PAPERS,
  INITIAL_MESSAGE_WITHOUT_PAPERS,
  // SSE 설정
  SSE_HEADERS,
  // 에러 메시지
  ERROR_MESSAGES,
  // API 경로
  CHAT_API_PATH,
} from './principles';

// =============================================================================
// 타입 (Types) - 출력 형식
// =============================================================================

export type {
  // 핵심 타입
  ChatRole,
  ChatMessage,
  // API 타입
  ChatContext,
  ChatRequest,
  ChatStreamEvent,
  ChatErrorResponse,
  // 훅 타입
  UseResearchAssistantProps,
  UseResearchAssistantReturn,
  // 프롬프트 타입
  SystemPromptInput,
  PaperPromptSection,
  // 내보내기 타입
  ExportOptions,
  ExportedConversation,
  // 외부 타입
  Paper,
  PaperAnalysis,
  ContextSummary,
} from './types';

// =============================================================================
// 전략 (Strategies) - 핵심 로직
// =============================================================================

export {
  // 시스템 프롬프트 빌더
  buildPaperSection,
  buildContextSection,
  buildSystemPrompt,
  // 메시지 빌더
  buildChatMessages,
  // 초기 메시지
  formatPaperList,
  buildInitialMessage,
  // SSE 파싱
  parseSSEData,
  extractSSEData,
  // 내보내기
  exportToMarkdown,
  exportToJson,
  downloadMarkdown,
  // 유틸리티
  appendMessage,
  createUserMessage,
  createAssistantMessage,
  isEmptyMessage,
} from './strategies';
