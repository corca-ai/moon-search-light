# Research Assistant 모듈 - 전략

> 동기화 대상: `app/features/research-assistant/strategies.ts`

## 핵심 흐름

### 채팅 API

1. 컨텍스트 추출 (papers, analyses, contextSummary)
2. 시스템 프롬프트 구성
3. Gemini 스트리밍 호출 (generateContentStream)
4. SSE 형식으로 응답 전달

### 시스템 프롬프트 구성

1. 기본 역할 정의
2. 선택 논문 정보 추가 (제목, 연도, 초록 300자, 분석)
3. 통합 컨텍스트 분석 추가 (있으면)
4. 응답 가이드라인 추가

### 패널 활성화

1. `isActive = true`
2. PostHog 트래킹
3. 기존 대화 없으면 초기 메시지 생성
   - 논문 있음: 논문 목록 + 예시 질문
   - 논문 없음: 일반 안내

### 메시지 전송

1. 빈 메시지/로딩 체크
2. 사용자 메시지 추가
3. API 호출 → 스트리밍 수신
4. 어시스턴트 메시지 추가

## 내보내기

- `exportToMarkdown()`: 마크다운 형식으로 대화 내보내기
- `downloadMarkdown()`: Blob 생성 → 다운로드 트리거

---

> 상세 구현은 `app/features/research-assistant/strategies.ts` 참조
