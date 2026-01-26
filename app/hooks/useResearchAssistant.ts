'use client';

import { useState, useCallback } from 'react';
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
}

interface UseResearchAssistantReturn {
  isActive: boolean;
  isLoading: boolean;
  chatMessages: ChatMessage[];
  activate: () => void;
  deactivate: () => void;
  sendMessage: (message: string) => Promise<void>;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  reset: () => void;
  restoreState: (active: boolean, messages: ChatMessage[]) => void;
}

// 헬퍼 함수
const formatPaperList = (papers: Paper[]): string =>
  papers.map((p, i) => `${i + 1}. ${p.title} (${p.year || '연도 미상'})`).join('\n');

export function useResearchAssistant({
  selectedPapers,
  interestSummary,
  onActiveChange,
}: UseResearchAssistantProps): UseResearchAssistantReturn {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // 세션 복원용
  const restoreState = useCallback((active: boolean, messages: ChatMessage[]) => {
    setIsActive(active);
    setChatMessages(messages);
  }, []);

  // 메시지 추가
  const appendMessages = useCallback((...messages: ChatMessage[]) => {
    setChatMessages(prev => [...prev, ...messages]);
  }, []);

  // 연구 패널 활성화 (펼치기)
  const activate = useCallback(() => {
    setIsActive(true);
    onActiveChange?.(true);

    // PostHog 트래킹
    posthog.capture('research_assistant_activated', {
      selected_papers_count: selectedPapers.length,
      paper_ids: selectedPapers.map(p => p.paperId),
      interest_summary: interestSummary,
    });

    // 첫 활성화 시 안내 메시지 (기존 대화가 없을 때만)
    if (chatMessages.length === 0) {
      if (selectedPapers.length > 0) {
        const paperList = formatPaperList(selectedPapers);
        setChatMessages([{
          role: 'assistant',
          content: `**선택된 논문:** ${selectedPapers.length}개
${paperList}

무엇을 도와드릴까요? 예시:
- "후속 연구 아이디어를 제안해줘"
- "Research Gap을 찾아줘"
- "연구 계획서 초안을 작성해줘"

💡 상단의 "분석" 버튼을 클릭하면 통합 컨텍스트 분석을 수행합니다.`,
        }]);
      } else {
        setChatMessages([{
          role: 'assistant',
          content: `안녕하세요! 연구 아이디어에 대해 자유롭게 대화해보세요.

예시:
- "이런 연구 주제에 관심이 있어"
- "연구 방향을 잡는데 도움이 필요해"
- "이 분야의 트렌드가 궁금해"

💡 논문을 검색하고 선택하면 더 구체적인 분석이 가능합니다.`,
        }]);
      }
    }
  }, [
    selectedPapers,
    interestSummary,
    chatMessages.length,
    onActiveChange,
  ]);

  // 연구 패널 비활성화 (접기)
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
    setIsActive(false);
    setIsLoading(false);
  }, []);

  return {
    isActive,
    isLoading,
    chatMessages,
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
