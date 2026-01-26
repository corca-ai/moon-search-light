'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Paper } from '../api/search/route';
import posthog from 'posthog-js';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UseResearchAssistantProps {
  selectedPapers: Paper[];
  interestSummary: string;
  onActiveChange?: (active: boolean) => void;
  onChatMessage?: (message: ChatMessage) => void;
  // 세션 복원용 초기값
  initialActive?: boolean;
  initialChatMessages?: ChatMessage[];
}

interface UseResearchAssistantReturn {
  isActive: boolean;
  isLoading: boolean;
  chatMessages: ChatMessage[];
  analyzedPapers: Paper[];
  activate: () => Promise<void>;
  deactivate: () => void;
  sendMessage: (message: string) => Promise<void>;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  reset: () => void;
  restoreState: (active: boolean, messages: ChatMessage[]) => void;
}

// 헬퍼 함수들
const truncateTitle = (title: string, maxLen = 30): string =>
  title.length > maxLen ? `${title.slice(0, maxLen)}...` : title;

const formatPaperList = (papers: Paper[]): string =>
  papers.map((p, i) => `${i + 1}. ${p.title} (${p.year || '연도 미상'})`).join('\n');

const getPaperIdsString = (papers: Paper[]): string =>
  [...papers.map(p => p.paperId)].sort().join(',');

export function useResearchAssistant({
  selectedPapers,
  interestSummary,
  onActiveChange,
  onChatMessage,
  initialActive = false,
  initialChatMessages = [],
}: UseResearchAssistantProps): UseResearchAssistantReturn {
  const [isActive, setIsActive] = useState(initialActive);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [analyzedPapers, setAnalyzedPapers] = useState<Paper[]>([]);

  // 세션 복원용
  const restoreState = useCallback((active: boolean, messages: ChatMessage[]) => {
    setIsActive(active);
    setChatMessages(messages);
  }, []);

  // 논문 변경 감지
  const detectChanges = useCallback(() => {
    const currentIds = new Set(selectedPapers.map(p => p.paperId));
    const previousIds = new Set(analyzedPapers.map(p => p.paperId));

    return {
      added: selectedPapers.filter(p => !previousIds.has(p.paperId)),
      removed: analyzedPapers.filter(p => !currentIds.has(p.paperId)),
      hasChanges: getPaperIdsString(selectedPapers) !== getPaperIdsString(analyzedPapers),
    };
  }, [selectedPapers, analyzedPapers]);

  // 변경 메시지 생성
  const getChangeMessage = useCallback((added: Paper[], removed: Paper[]): string => {
    const changes: string[] = [];
    if (added.length > 0) {
      const titles = added.map(p => `"${truncateTitle(p.title)}"`).join(', ');
      changes.push(`➕ 추가: ${titles}`);
    }
    if (removed.length > 0) {
      const titles = removed.map(p => `"${truncateTitle(p.title)}"`).join(', ');
      changes.push(`➖ 제거: ${titles}`);
    }
    return changes.length > 0 ? changes.join('\n') : '논문 목록이 변경되었습니다.';
  }, []);

  // 분석 중 메시지 제거 후 새 메시지 추가
  const replacePendingMessage = useCallback((content: string) => {
    setChatMessages(prev => {
      const filtered = prev.filter((msg, idx) =>
        !(idx === prev.length - 1 && msg.role === 'system' && msg.content.includes('분석 중'))
      );
      return [...filtered, { role: 'assistant' as const, content }];
    });
  }, []);

  // 메시지 추가 (기존 대화 유지)
  const appendMessages = useCallback((...messages: ChatMessage[]) => {
    setChatMessages(prev => [...prev, ...messages]);
  }, []);

  // 통합 분석 API 호출
  const fetchContextSummary = useCallback(async (papers: Paper[]) => {
    const response = await fetch('/api/context-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ papers }),
    });
    if (!response.ok) throw new Error('Failed to fetch context summary');
    return response.json();
  }, []);

  // 통합 분석 메시지 생성
  const buildContextMessage = useCallback((
    papers: Paper[],
    summary: { commonProblem: string; commonMethods: string[]; differences: string[]; researchLandscape: string },
    isUpdate: boolean
  ): string => {
    const paperList = formatPaperList(papers);
    return `## 📋 통합 컨텍스트 분석

**선택된 논문:** ${papers.length}개
${paperList}

---

### 공통 문제
${summary.commonProblem}

### 공통 방법론
${summary.commonMethods.map(m => `- ${m}`).join('\n')}

### 주요 차이점
${summary.differences.map(d => `- ${d}`).join('\n')}

### 연구 지형
${summary.researchLandscape}

---

${isUpdate ? '맥락이 업데이트되었습니다. 계속해서 무엇을 도와드릴까요?' : `무엇을 도와드릴까요? 예시:
- "후속 연구 아이디어를 제안해줘"
- "Research Gap을 찾아줘"
- "연구 계획서 초안을 작성해줘"`}`;
  }, []);

  // fallback 메시지 생성
  const buildFallbackMessage = useCallback((papers: Paper[], isUpdate: boolean): string => {
    const paperList = formatPaperList(papers);
    return `선택하신 ${papers.length}개의 논문을 분석할 준비가 되었습니다.\n\n${paperList}\n\n${isUpdate ? '계속해서 무엇을 도와드릴까요?' : '무엇을 도와드릴까요?'}`;
  }, []);

  // 연구 탭 활성화
  const activate = useCallback(async () => {
    if (selectedPapers.length < 1) return;

    setIsActive(true);
    onActiveChange?.(true);

    // PostHog 트래킹
    posthog.capture('research_assistant_activated', {
      selected_papers_count: selectedPapers.length,
      paper_ids: selectedPapers.map(p => p.paperId),
      interest_summary: interestSummary,
    });

    const { added, removed, hasChanges } = detectChanges();
    const hasExistingChat = chatMessages.length > 0;

    // 동일한 논문이면 기존 대화 유지
    if (!hasChanges && hasExistingChat) {
      return;
    }

    const paperList = formatPaperList(selectedPapers);

    // 논문 1개: 통합 분석 없이 시작
    if (selectedPapers.length === 1) {
      if (hasExistingChat) {
        appendMessages(
          { role: 'system', content: `📌 선택된 논문이 변경되었습니다.\n${getChangeMessage(added, removed)}` },
          { role: 'assistant', content: `**현재 선택된 논문:**\n${paperList}\n\n계속해서 무엇을 도와드릴까요?\n\n💡 2개 이상의 논문을 선택하면 통합 분석을 제공합니다.` }
        );
      } else {
        setChatMessages([{
          role: 'assistant',
          content: `**선택된 논문:**\n${paperList}\n\n무엇을 도와드릴까요?\n\n💡 2개 이상의 논문을 선택하면 통합 분석을 제공합니다.`,
        }]);
      }
      setAnalyzedPapers([...selectedPapers]);
      return;
    }

    // 논문 2개 이상: 통합 분석 수행
    setIsLoading(true);

    if (hasExistingChat) {
      appendMessages({
        role: 'system',
        content: `📌 선택된 논문이 변경되었습니다.\n${getChangeMessage(added, removed)}\n\n새로운 맥락을 분석 중...`,
      });
    } else {
      setChatMessages([{
        role: 'assistant',
        content: `**선택된 논문 ${selectedPapers.length}개를 통합 분석 중입니다...**\n\n${paperList}`,
      }]);
    }

    try {
      const summary = await fetchContextSummary(selectedPapers);
      const contextMessage = buildContextMessage(selectedPapers, summary, hasExistingChat);

      if (hasExistingChat) {
        replacePendingMessage(contextMessage);
      } else {
        setChatMessages([{ role: 'assistant', content: contextMessage }]);
      }
      setAnalyzedPapers([...selectedPapers]);
    } catch (err) {
      console.error('Failed to generate context:', err);
      const fallbackMessage = buildFallbackMessage(selectedPapers, hasExistingChat);

      if (hasExistingChat) {
        replacePendingMessage(fallbackMessage);
      } else {
        setChatMessages([{ role: 'assistant', content: fallbackMessage }]);
      }
      setAnalyzedPapers([...selectedPapers]);
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedPapers,
    interestSummary,
    chatMessages.length,
    onActiveChange,
    detectChanges,
    getChangeMessage,
    appendMessages,
    fetchContextSummary,
    buildContextMessage,
    buildFallbackMessage,
    replacePendingMessage,
  ]);

  // 연구 탭 비활성화
  const deactivate = useCallback(() => {
    setIsActive(false);
    onActiveChange?.(false);
    // 대화 내용 유지 (재활성화 시 기억)
  }, [onActiveChange]);

  // 메시지 전송
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    appendMessages({ role: 'user', content: message });
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, { role: 'user', content: message }],
          papers: selectedPapers,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        appendMessages({ role: 'assistant', content: data.response });
      } else {
        appendMessages({ role: 'assistant', content: '죄송합니다. 응답을 생성하는 데 실패했습니다.' });
      }
    } catch (err) {
      console.error('Chat error:', err);
      appendMessages({ role: 'assistant', content: '죄송합니다. 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  }, [chatMessages, selectedPapers, isLoading, appendMessages]);

  // 초기화
  const reset = useCallback(() => {
    setChatMessages([]);
    setAnalyzedPapers([]);
    setIsActive(false);
    setIsLoading(false);
  }, []);

  // 선택된 논문이 없으면 자동 비활성화
  useEffect(() => {
    if (selectedPapers.length < 1 && isActive) {
      deactivate();
      reset();
    }
  }, [selectedPapers.length, isActive, deactivate, reset]);

  return {
    isActive,
    isLoading,
    chatMessages,
    analyzedPapers,
    activate,
    deactivate,
    sendMessage,
    setChatMessages,
    setIsActive,
    setIsLoading,
    reset,
    restoreState,
  };
}
