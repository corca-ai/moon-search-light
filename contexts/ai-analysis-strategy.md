# AI Analysis 모듈 - 전략

> 동기화 대상: `app/features/ai-analysis/strategies.ts`

## 핵심 흐름

### 논문 요약

1. 입력 검증 (title, abstract 필수)
2. 시스템 프롬프트 + 사용자 프롬프트 구성
3. `gpt-4o-mini` + `zodResponseFormat` 호출
4. `PaperAnalysis` 반환

### 번역

1. 입력 검증 (text 필수)
2. 번역 프롬프트 구성 (전문용어 원어 병기)
3. `gpt-4o-mini` 호출
4. 번역 텍스트 반환

### 관심 주제 요약

1. 빈 배열이면 빈 문자열 반환
2. 선택 논문 목록으로 프롬프트 구성
3. `temperature: 0.3`, `max_tokens: 200`으로 호출
4. 100자 이하 요약 반환

### 컨텍스트 분석

1. 최소 2개 논문 검증
2. 논문별 제목 + 초록으로 컨텍스트 구성
3. `zodResponseFormat`으로 구조화 응답 요청
4. `ContextSummary` 반환

## 배치 처리

- 3개씩 순차 처리 (`splitIntoBatches`)
- API 부하 분산

---

> 상세 구현은 `app/features/ai-analysis/strategies.ts` 참조
