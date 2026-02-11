# Research Guide 모듈 - 원칙

> 동기화 대상: `app/features/research-guide/principles.ts`

---

## 1. AI 설정

| 항목 | 값 |
|------|-----|
| 모델 | `gemini-3-flash-preview` |
| Temperature | 0.3 |
| SDK | `@google/genai` (`GoogleGenAI`) |
| 응답 형식 | JSON (`responseMimeType` + `z.toJSONSchema()`) |

---

## 2. 키워드 추출 설정

| 항목 | 값 |
|------|-----|
| 최소 키워드 수 | 3 |
| 최대 키워드 수 | 5 |
| 키워드 형식 | 영어 검색 구문 (1-4 words) |
| 설명 형식 | 한국어 1문장 |

### 키워드 다양성 기준

- 논문의 직접 주제
- 관련 방법론
- 인접 연구 분야
- 잠재적 응용
- 기반 개념

---

## 3. 클러스터링 설정

| 항목 | 값 |
|------|-----|
| 최소 클러스터 수 | 3 |
| 최대 클러스터 수 | 6 |
| 최소 논문 수 | 5 (미만 시 클러스터링 미실행) |
| 클러스터명 | 한국어 (2-5 words) |
| 논문 할당 | 각 논문은 정확히 1개 클러스터에 소속 |

### 누락 처리

- 모든 논문이 클러스터에 할당되지 않으면 "기타" 클러스터 자동 생성

---

## 4. 시드 논문 규칙

| 항목 | 규칙 |
|------|------|
| 동시 시드 수 | 1개만 허용 |
| 교체 | 다른 논문 지정 시 자동 교체 |
| 필수 조건 | abstract 존재 (없으면 버튼 비활성화) |
| 선택 무관 | 선택/미선택 논문 모두 시드 가능 |

---

## 5. API 경로

| 경로 | 용도 |
|------|------|
| `/api/research-guide/extract-keywords` | 키워드 추출 |
| `/api/research-guide/cluster` | 결과 클러스터링 |

---

## 6. 에러 메시지

| 상황 | 메시지 |
|------|--------|
| 키워드 입력 누락 | "Title and abstract are required" |
| 키워드 추출 실패 | "Failed to extract keywords" |
| 클러스터 입력 누락 | "Papers array is required" |
| 논문 수 부족 | "At least 5 papers are required for clustering" |
| 클러스터링 실패 | "Failed to cluster papers" |

---

## 핵심 원칙 요약

1. **시드 기반 탐색**: 하나의 논문에서 시작하여 연구 지형 탐색
2. **다양한 키워드**: 직접 주제뿐 아니라 관련 분야/방법론/응용 포함
3. **자동 클러스터링**: 키워드 검색 후 결과 자동 분류
4. **최소 침투성**: 일반 검색에서는 클러스터링 미실행

---

> **동기화 지침**: 이 문서를 수정하면 `app/features/research-guide/principles.ts`도 함께 수정해야 합니다.
