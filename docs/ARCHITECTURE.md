# Moon Search Light - 기술 아키텍처

## 1. 사용자 식별

- 최초 접속 시 이메일 입력 모달
- localStorage 저장, 재방문 시 자동 인식
- PostHog identify() 호출

---

## 2. Analytics (PostHog)

- 클라이언트: posthog-js
- 서버: posthog-node
- 리버스 프록시: /ingest → PostHog

**주요 이벤트**: user_identified, paper_searched, paper_selected, paper_excluded, research_assistant_activated, chat_message_sent

---

## 3. 연구 노트 (Session)

사용자의 논문 탐색 과정을 저장하고 관리.

- **용어**: 코드 `Session`, UI "연구 노트"
- **저장소**: LocalStorage
- **활동 기록**: 최대 10개 (FIFO)
- **자동 저장**: Debounce 1초, beforeunload 시 저장

**활동 타입**: search, paper_selected, paper_excluded, analysis_done, chat_user, chat_assistant 등

---

## 4. API 엔드포인트

| 경로 | 용도 |
|------|------|
| /api/search | 논문 검색 |
| /api/summarize | 논문 AI 요약 |
| /api/translate | 초록 번역 |
| /api/interest-summary | 관심 주제 요약 |
| /api/context-summary | 통합 컨텍스트 생성 |
| /api/chat | AI 채팅 (스트리밍) |

---

## 5. 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| page.tsx | 메인 페이지 |
| NoteSidebar | 연구 노트 사이드바 |
| SearchResultCard | 검색 결과 카드 |
| SelectedPapersSection | 선택됨 영역 |
| PaperDetailModal | 논문 상세 모달 |

---

## 6. Hooks

| Hook | 역할 |
|------|------|
| useSession | 현재 세션 관리, 활동 기록 |
| useSessionList | 세션 목록 CRUD |
