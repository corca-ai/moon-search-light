# Research Assistant 모듈 - 출력 형식

> 동기화 대상: `app/features/research-assistant/types.ts`

## 핵심 타입

| 타입 | 용도 |
|------|------|
| `ChatMessage` | 채팅 메시지 (role, content, timestamp) |
| `ChatContext` | API 컨텍스트 (papers, analyses, contextSummary) |
| `ChatStreamEvent` | SSE 이벤트 (`{ content }` 또는 `{ done: true }`) |

## 훅 타입

| 타입 | 주요 필드 |
|------|----------|
| `UseResearchAssistantProps` | selectedPapers, interestSummary, onActiveChange |
| `UseResearchAssistantReturn` | isActive, chatMessages, sendMessage, activate, reset |

## 상수

| 상수 | 값 |
|------|-----|
| `CHAT_MODEL` | "gpt-4o-mini" |
| `RECOMMENDED_RESPONSE_LENGTH` | 500 |
| `ABSTRACT_MAX_LENGTH` | 300 |

---

> 상세 타입은 `app/features/research-assistant/types.ts` 참조
