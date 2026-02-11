# Research Guide 모듈 - 전략

> 동기화 대상: `app/features/research-guide/strategies.ts`

---

## 1. 전체 흐름

```
시드 논문 지정
  → extract-keywords API 호출
  → 키워드 칩 표시
  → 사용자 키워드 클릭
  → 해당 키워드로 검색 실행 (searchedViaKeyword = true)
  → 검색 결과 변경 감지
  → cluster API 호출 (5개 이상일 때만)
  → 클러스터 탭 표시
  → 탭 클릭으로 필터링
```

---

## 2. 키워드 추출 전략

### 프롬프트 구성

```
시스템: 연구 탐색 전문가 역할
사용자:
  - 시드 논문 제목 + 초록 전문
  - 3-5개 키워드 요청
  - JSON 형식 응답 요구
```

### 키워드 다양성

단순히 논문 키워드를 추출하는 것이 아니라, **연구 탐색에 유용한** 검색어를 생성:

- 직접 주제 → 같은 분야 논문
- 방법론 → 유사 방법을 쓰는 다른 분야
- 인접 분야 → 크로스 도메인 연결
- 응용 → 실용적 적용 사례
- 기반 개념 → 이론적 토대

---

## 3. 클러스터링 전략

### 트리거 조건

1. `searchedViaKeyword === true` (키워드 검색으로 실행된 검색)
2. `candidatePapers` 변경 감지
3. `candidatePapers.length >= 5`

### 프롬프트 구성

```
시스템: 논문 클러스터링 전문가 역할
사용자:
  - 인덱스 번호 + 논문 제목 + 초록 200자
  - 3-6개 클러스터로 분류 요청
  - JSON 형식 응답 요구
```

### 후처리

- Zod 스키마로 응답 검증
- 누락된 논문 인덱스 → "기타" 클러스터 자동 추가

---

## 4. 훅 트리거 흐름 (useResearchGuide)

| 트리거 | 동작 |
|--------|------|
| `setSeedPaper(paper)` | 이전 요청 abort → 키워드 추출 API 호출 |
| `searchByKeyword(kw)` | `searchedViaKeyword = true` → `onSearch(kw)` 호출 |
| `candidatePapers` 변경 + `searchedViaKeyword` | 클러스터 API 호출 |
| `setActiveCluster(idx)` | 클러스터 필터 적용 |
| `clearSeedPaper()` | 모든 상태 초기화 |

### Abort 처리

- 시드 교체 시 이전 키워드 추출 요청 abort
- 재클러스터링 시 이전 클러스터링 요청 abort
- `AbortController` ref로 관리

---

## 5. 필터링 전략

`getFilteredPapers(papers)`:

- `activeClusterIndex === null` → 전체 반환
- `activeClusterIndex !== null` → 해당 클러스터의 `paperIndices`에 속하는 논문만 반환
- 인덱스 기준 필터링 (원본 `candidatePapers` 배열 인덱스)

---

## 6. 세션 저장/복원

### 저장 대상

```typescript
{
  seedPaperId: string | null;
  keywords: ResearchKeyword[];
  clusters: Cluster[];
  activeClusterIndex: number | null;
  searchedViaKeyword: boolean;
}
```

### 복원 시

- `seedPaperId`로 `allPapers`에서 시드 논문 객체 복원
- 키워드, 클러스터, 필터 상태 그대로 복원
- 키워드 재추출 없음 (저장된 값 사용)

---

> **동기화 지침**: 이 문서를 수정하면 `app/features/research-guide/strategies.ts`도 함께 수정해야 합니다.
