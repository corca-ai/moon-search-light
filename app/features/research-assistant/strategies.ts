/**
 * Research Assistant 모듈 - 전략 (Strategies)
 *
 * @sync contexts/research-assistant-strategy.md
 *
 * 이 파일은 Research Assistant의 핵심 로직을 구현합니다.
 * 문서와 동기화를 유지해야 합니다.
 */

import {
  BASE_SYSTEM_PROMPT,
  RESPONSE_GUIDELINES,
  ABSTRACT_MAX_LENGTH,
  INITIAL_MESSAGE_WITH_PAPERS,
  INITIAL_MESSAGE_WITHOUT_PAPERS,
} from './principles';
import type {
  Paper,
  PaperAnalysis,
  ContextSummary,
  ChatMessage,
  SystemPromptInput,
  ExportedConversation,
  ExportOptions,
} from './types';

// =============================================================================
// 1. 시스템 프롬프트 빌더
// =============================================================================

/**
 * 논문 섹션 생성
 */
export function buildPaperSection(
  paper: Paper,
  index: number,
  analysis?: PaperAnalysis
): string {
  let section = `\n\n### ${index + 1}. ${paper.title}`;
  section += `\n- 연도: ${paper.year || '미상'}`;
  section += `\n- 인용수: ${paper.citationCount || 0}`;

  if (paper.abstract) {
    section += `\n- 초록: ${paper.abstract.slice(0, ABSTRACT_MAX_LENGTH)}...`;
  }

  if (analysis) {
    section += `\n- 개요: ${analysis.overview}`;
    section += `\n- 목표: ${analysis.goals}`;
    section += `\n- 방법론: ${analysis.method}`;
    section += `\n- 결과: ${analysis.results}`;
  }

  return section;
}

/**
 * 컨텍스트 분석 섹션 생성
 */
export function buildContextSection(contextSummary: ContextSummary): string {
  return `

## 통합 컨텍스트 분석
### 공통 문제
${contextSummary.commonProblem}

### 공통 방법론
${contextSummary.commonMethods?.map((m) => `- ${m}`).join('\n') || '없음'}

### 주요 차이점
${contextSummary.differences?.map((d) => `- ${d}`).join('\n') || '없음'}

### 연구 지형
${contextSummary.researchLandscape}`;
}

/**
 * 전체 시스템 프롬프트 생성
 */
export function buildSystemPrompt(input: SystemPromptInput): string {
  const { papers, analyses, contextSummary } = input;

  let prompt = BASE_SYSTEM_PROMPT;

  // 논문 섹션 추가
  prompt += `\n\n## 선택된 논문 (${papers?.length || 0}개)`;

  if (papers && papers.length > 0) {
    papers.forEach((paper, idx) => {
      const analysis = analyses?.[paper.paperId];
      prompt += buildPaperSection(paper, idx, analysis);
    });
  }

  // 컨텍스트 분석 추가
  if (contextSummary) {
    prompt += buildContextSection(contextSummary);
  }

  // 응답 가이드라인 추가
  prompt += RESPONSE_GUIDELINES;

  return prompt;
}

// =============================================================================
// 2. 메시지 빌더
// =============================================================================

/**
 * OpenAI 메시지 배열 생성
 */
export function buildChatMessages(
  systemPrompt: string,
  messages: ChatMessage[]
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  return [
    { role: 'system' as const, content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];
}

// =============================================================================
// 3. 초기 메시지 생성
// =============================================================================

/**
 * 논문 목록 포맷팅
 */
export function formatPaperList(papers: Paper[]): string {
  return papers
    .map((p, i) => `${i + 1}. ${p.title} (${p.year || '연도 미상'})`)
    .join('\n');
}

/**
 * 초기 메시지 생성
 */
export function buildInitialMessage(papers: Paper[]): ChatMessage {
  if (papers.length > 0) {
    const paperList = formatPaperList(papers);
    const content = INITIAL_MESSAGE_WITH_PAPERS.replace(
      '{count}',
      papers.length.toString()
    ).replace('{paperList}', paperList);

    return { role: 'assistant', content };
  }

  return { role: 'assistant', content: INITIAL_MESSAGE_WITHOUT_PAPERS };
}

// =============================================================================
// 4. SSE 파싱
// =============================================================================

/**
 * SSE 데이터 파싱
 */
export function parseSSEData(
  data: string
): { content: string } | { done: true } | null {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * SSE 라인에서 데이터 추출
 */
export function extractSSEData(line: string): string | null {
  if (line.startsWith('data: ')) {
    return line.slice(6);
  }
  return null;
}

// =============================================================================
// 5. 내보내기
// =============================================================================

/**
 * 대화 내보내기 (마크다운)
 */
export function exportToMarkdown(
  messages: ChatMessage[],
  papers?: Paper[]
): string {
  let markdown = '# 연구 개요\n\n';
  markdown += `생성 시간: ${new Date().toLocaleString('ko-KR')}\n\n`;

  if (papers && papers.length > 0) {
    markdown += '## 선택된 논문\n\n';
    papers.forEach((p, i) => {
      markdown += `${i + 1}. **${p.title}** (${p.year || '연도 미상'})\n`;
    });
    markdown += '\n';
  }

  markdown += '## 대화 내역\n\n';
  messages.forEach((msg) => {
    const role = msg.role === 'user' ? '**나:**' : '**AI:**';
    markdown += `${role}\n\n${msg.content}\n\n---\n\n`;
  });

  return markdown;
}

/**
 * 대화 내보내기 (JSON)
 */
export function exportToJson(
  messages: ChatMessage[],
  papers?: Paper[],
  options?: ExportOptions
): ExportedConversation {
  return {
    exportedAt: new Date().toISOString(),
    messages,
    ...(options?.includeMetadata && papers ? { papers } : {}),
  };
}

/**
 * 마크다운 다운로드 트리거
 */
export function downloadMarkdown(content: string, filename?: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `research-overview-${Date.now()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// =============================================================================
// 6. 유틸리티
// =============================================================================

/**
 * 메시지 추가
 */
export function appendMessage(
  messages: ChatMessage[],
  newMessage: ChatMessage
): ChatMessage[] {
  return [...messages, newMessage];
}

/**
 * 사용자 메시지 생성
 */
export function createUserMessage(content: string): ChatMessage {
  return { role: 'user', content, timestamp: Date.now() };
}

/**
 * 어시스턴트 메시지 생성
 */
export function createAssistantMessage(content: string): ChatMessage {
  return { role: 'assistant', content, timestamp: Date.now() };
}

/**
 * 빈 메시지 확인
 */
export function isEmptyMessage(message: string): boolean {
  return !message.trim();
}
