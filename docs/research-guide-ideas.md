# Research Guide 기능 아이디어 검토

## 문제 정의

현재 Moon Search Light는 **사용자가 이미 뭘 찾을지 알고 있다**는 전제에 기반한다.

```
검색 → (평면적 결과 목록) → 수동 선택 → 분석
```

실제 연구 탐색 흐름:

```
하나의 논문 발견 → "이 분야가 뭐지?" → 분류 필요 → 방향 설정 → 깊은 탐색
```

현재 **"분류"와 "방향 설정"** 단계를 지원하는 기능이 없다. 검색 결과는 정렬된 리스트일 뿐이고, Research Assistant는 논문을 이미 선택한 뒤에야 동작한다.

---

## 아이디어

### 1. Topic Clustering — 검색 결과 자동 분류

검색 결과를 AI가 하위 주제별로 묶어서 보여주는 기능.

**예시**: "Accelerating Scientific Research" 검색 시

```
📂 AI for Drug Discovery (12편)
📂 LLM-based Literature Review (8편)
📂 Automated Experiment Design (6편)
📂 Scientific Workflow Automation (5편)
📂 Benchmarks & Evaluation (4편)
```

**동작 방식**:
- 검색 결과의 제목+초록을 AI에 넘겨서 3~6개 클러스터로 분류
- 각 클러스터에 이름 + 한 줄 설명 + 해당 논문 목록
- 클러스터 클릭 시 해당 그룹만 필터링

**장점**: 낯선 분야의 지형을 한눈에 파악 가능
**비용**: API 1회 호출 (전체 결과의 제목만 보내면 토큰 적음)

---

### 2. Suggested Keywords — 후속 검색 키워드 제안

검색 결과를 분석해서 더 깊이 탐색할 수 있는 키워드를 제안.

**예시**:

```
🔍 추천 검색어:
- "LLM scientific discovery" — AI 모델 활용 연구 탐색
- "automated hypothesis generation" — 가설 자동 생성 관련
- "AI protein folding" — 단백질 구조 예측 사례
- "scientific reasoning benchmark" — 과학 추론 평가
```

**동작 방식**:
- 검색 결과 상위 논문들의 키워드 + 초록을 분석
- 현재 검색어와 다른 각도의 키워드 5~8개 생성
- 각 키워드에 왜 이 검색이 유용한지 한 줄 설명
- 클릭하면 바로 해당 키워드로 재검색

**장점**: "다음에 뭘 검색해야 하지?" 해결
**비용**: API 1회, 토큰 적음

---

### 3. Reading Guide — 논문 읽기 가이드

검색 결과 중에서 어떤 순서로 읽어야 하는지 AI가 안내.

**예시**:

```
📖 읽기 가이드

🏛️ 기초 논문 (먼저 읽기)
  - "Attention Is All You Need" (2017, 95K citations)
  - "BERT: Pre-training of..." (2019, 80K citations)
    → 이 분야의 핵심 개념을 잡을 수 있는 논문들

🔬 주요 방법론
  - "Scientific Discovery with LLMs" (2024, 150 citations)
    → 현재 주류 접근 방식을 이해하는 데 핵심

🆕 최신 동향
  - "Gemini for Science" (2025, 12 citations)
    → 가장 최근 연구 방향
```

**동작 방식**:
- 검색 결과에서 연도, 인용수, AI 요약을 종합 분석
- "기초/서베이 → 주요 방법론 → 최신 연구" 순으로 분류
- 각 그룹에 왜 이 논문을 읽어야 하는지 이유 설명

**장점**: 완전 초심자에게 가장 직접적인 도움
**비용**: API 1회, 요약 데이터가 이미 있으면 추가 비용 적음

---

### 4. Seed Paper Mode — 시드 논문 기반 탐색

하나의 논문을 "출발점"으로 지정하면, 그 논문을 기준으로 연구 지형을 자동 탐색.

**예시**: Gemini 논문을 시드로 지정

```
🌱 시드 논문: "Accelerating Scientific Research with Gemini"

→ AI가 시드 논문에서 핵심 개념 3~5개 추출
→ 각 개념별로 자동 검색 실행
→ 결과를 통합해서 Topic Clustering + Reading Guide 제공
```

**동작 방식**:
1. 시드 논문의 제목+초록에서 핵심 연구 주제 추출
2. 각 주제로 Semantic Scholar 검색 자동 실행 (3~5회)
3. 결과를 통합하여 클러스터링 + 읽기 순서 제안
4. 사용자는 관심 있는 방향을 선택해서 깊이 탐색

**장점**: "논문 하나만 알고 있는" 상황에 정확히 맞는 워크플로우
**비용**: API 여러 번 호출 (검색 3~5회 + 분석 1회). 가장 비용이 크지만 가장 강력함

---

### 5. Exploration Paths — 탐색 경로 제안

검색 결과를 바탕으로 "이 분야에서 어디로 갈 수 있는지" 경로를 제시.

**예시**:

```
🧭 탐색 경로

경로 A: 실용적 응용
  "AI로 실험을 자동화하는 연구들" → 검색어: "automated experiment AI"

경로 B: 이론적 기반
  "과학적 추론의 원리를 다루는 연구들" → 검색어: "scientific reasoning LLM"

경로 C: 특정 도메인
  "생명과학 분야 사례 연구들" → 검색어: "AI biology research acceleration"
```

**동작 방식**:
- 검색 결과를 분석해서 3~4개의 탐색 방향 도출
- 각 방향에 설명 + 추천 검색어 + 대표 논문 1~2개
- 경로 선택하면 해당 방향으로 검색 실행

**장점**: "다음 단계"가 명확해짐
**비용**: API 1회

---

## 제약사항

### 비용
- **모델**: `gemini-3-flash-preview` 사용 (전체 AI 기능 동일 모델)
- 기능 1회 실행당 API 호출 횟수를 최소화하되, 효과가 확실하면 2~3회까지 허용

### 응답 속도
- **5~10초 이내** — 로딩 UI와 함께 사용자가 기다릴 수 있는 수준
- 필요 시 단계별 점진적 표시 (클러스터 먼저 → 키워드 이후 등)

### 구현 범위
- **핵심 조합** — 아이디어 중 2~3개를 조합해서 의미 있는 플로우를 구성
- 단일 기능이 아닌, 사용자 여정을 커버하는 조합이 목표

### 아키텍처
- **기존 모듈 패턴 준수** — `app/features/{name}/` 구조 (principles.ts, strategies.ts, types.ts)
- **컨텍스트 문서 동기화** — `contexts/{name}-*.md` 문서와 코드 1:1 매핑
- 기존 3단 레이아웃 안에서 자연스럽게 통합

### 데이터
- 검색 결과로 이미 확보된 데이터(제목, 초록, 연도, 인용수, AI 요약)를 최대한 재활용
- Semantic Scholar API 추가 호출은 필요 시에만

---

## 조합 제안

| 조합 | 설명 | 구현 난이도 |
|------|------|------------|
| **2+1**: 키워드 제안 + 클러스터링 | 검색 후 결과를 분류하고 다음 검색어 제안 | 중간 |
| **4+1+3**: 시드 모드 + 클러스터링 + 읽기 가이드 | 논문 하나에서 출발하여 전체 지형 파악 | 높음 |
| **5+2**: 탐색 경로 + 키워드 제안 | 방향 제시 + 즉시 실행 가능한 키워드 | 낮음 |

---

## 최종 결정: 4(간소화) + 1 조합

### 선택 근거
- **Seed Paper 간소화**: 자동 다중 검색 대신 키워드만 추출 → 사용자가 직접 선택하여 검색. 블랙박스 없이 통제력 유지
- **Topic Clustering**: 검색 결과를 분류하여 분야 지형 파악

### 핵심 흐름

```
시드 논문 지정 → AI 키워드 추출 → 사용자가 키워드 선택 → 검색 실행 → 결과 자동 클러스터링
```

### 설계 결정

**시드 논문**:
- SearchResultCard에 시드 버튼(🌱) 추가 (⭐/✓ 옆)
- 선택(⭐) 여부와 무관하게 어떤 검색 결과든 시드 가능
- 한 번에 하나만 허용, abstract 없으면 불가

**키워드 표시**: 검색창 아래, 결과 위에 칩 형태로 표시. 클릭 시 즉시 검색

**클러스터 표시**: 정렬 드롭다운과 결과 목록 사이에 필터 탭. 키워드 검색 시에만 자동 트리거

**API**: 분리된 2개 엔드포인트
- `/api/research-guide/extract-keywords` — 시드 지정 시 호출
- `/api/research-guide/cluster` — 키워드 검색 후 호출

**모델**: gemini-3-flash-preview

### UI 배치

```
┌─────────────────────────────────────────────┐
│  검색창                                       │
├─────────────────────────────────────────────┤
│  🌱 시드: "Paper Title..."                    │  ← 시드 지정 시 표시
│  [keyword 1] [keyword 2] [keyword 3] ...     │  ← 클릭하면 검색
├─────────────────────────────────────────────┤
│  검색 결과 100건 | 정렬: 추천순 ▾              │
├─────────────────────────────────────────────┤
│  [전체] [클러스터1 (12)] [클러스터2 (8)] ...   │  ← 키워드 검색 후 표시
├─────────────────────────────────────────────┤
│  논문 카드 1  [⭐] [✓] [🌱]                   │
│  논문 카드 2  [⭐] [✓] [🌱]                   │
│  ...                                         │
└─────────────────────────────────────────────┘
```

### 구현 파일 구조

```
새로 생성:
  app/features/research-guide/   (principles, types, strategies, index)
  app/api/research-guide/        (extract-keywords, cluster)
  app/hooks/useResearchGuide.ts
  app/components/ResearchKeywords.tsx
  app/components/ClusterTabs.tsx
  contexts/research-guide-*.md   (principles, strategy, format)

수정:
  package.json                   (@google/generative-ai 추가)
  SearchResultCard.tsx           (시드 버튼)
  app/search/page.tsx            (훅 통합, UI 배치)
  app/features/notes/types.ts    (세션 상태 확장)
  docs/SPEC.md                   (스펙 업데이트)
```

### 핵심 타입 정의

```typescript
// 키워드 추출
interface ResearchKeyword {
  keyword: string;       // 영어 검색 키워드 (Semantic Scholar 검색용)
  description: string;   // 한국어 1줄 설명 (왜 이 키워드가 유용한지)
}

// 클러스터링
interface Cluster {
  name: string;              // 한국어 클러스터명 (2-5단어)
  description: string;       // 한국어 1줄 설명
  paperIndices: number[];    // 해당 클러스터 논문 인덱스 (0-based, 요청 순서 기준)
}

// 훅 상태
interface ResearchGuideState {
  seedPaperId: string | null;
  keywords: ResearchKeyword[];
  isExtractingKeywords: boolean;
  clusters: Cluster[];
  isClustering: boolean;
  activeClusterIndex: number | null;  // null = 전체 보기
  searchedViaKeyword: boolean;        // 키워드 클릭으로 검색했는지 여부
}
```

### API 요청/응답 예시

**POST /api/research-guide/extract-keywords**

요청:
```json
{
  "title": "Accelerating Scientific Research with Gemini",
  "abstract": "This paper presents case studies demonstrating..."
}
```

응답:
```json
{
  "keywords": [
    { "keyword": "LLM scientific discovery", "description": "대규모 언어 모델을 활용한 과학적 발견 연구" },
    { "keyword": "AI-assisted experiment design", "description": "AI가 실험 설계를 지원하는 방법론" },
    { "keyword": "automated literature review", "description": "논문 리뷰 자동화 기술과 도구" }
  ]
}
```

**POST /api/research-guide/cluster**

요청:
```json
{
  "papers": [
    { "title": "Paper 1", "abstract": "..." },
    { "title": "Paper 2", "abstract": "..." }
  ]
}
```

응답:
```json
{
  "clusters": [
    {
      "name": "실험 자동화",
      "description": "AI를 활용한 실험 설계 및 자동화 연구",
      "paperIndices": [0, 3, 7, 12]
    },
    {
      "name": "문헌 분석 도구",
      "description": "논문 검색 및 분석을 자동화하는 도구 연구",
      "paperIndices": [1, 2, 5, 8]
    }
  ]
}
```

### 훅 인터페이스

```typescript
interface UseResearchGuideProps {
  candidatePapers: Paper[];           // 현재 검색 결과
  onSearch: (query: string) => void;  // 검색 실행 콜백 (page.tsx에서 전달)
}

interface UseResearchGuideReturn {
  // 시드
  seedPaper: Paper | null;
  setSeedPaper: (paper: Paper) => void;
  clearSeedPaper: () => void;
  // 키워드
  keywords: ResearchKeyword[];
  isExtractingKeywords: boolean;
  searchByKeyword: (keyword: ResearchKeyword) => void;
  // 클러스터
  clusters: Cluster[];
  isClustering: boolean;
  activeClusterIndex: number | null;
  setActiveCluster: (index: number | null) => void;
  getFilteredPapers: (papers: Paper[]) => Paper[];
  // 세션
  restoreState: (state: Partial<ResearchGuideState>) => void;
  reset: () => void;
}
```

### 트리거 규칙

| 이벤트 | 동작 |
|--------|------|
| 시드 논문 지정 | extract-keywords API 호출. 이전 요청 있으면 abort |
| 시드 논문 해제 | 키워드 초기화. 클러스터도 초기화 |
| 시드 논문 교체 | 이전 요청 abort → 새 extract-keywords 호출 |
| 키워드 클릭 | `searchedViaKeyword = true` 설정 후 `onSearch(keyword)` 호출 |
| 검색 결과 도착 + `searchedViaKeyword === true` | cluster API 자동 호출 (500ms 디바운스) |
| 일반 검색 (키워드 아닌) | 클러스터링 미실행, 기존 클러스터 초기화 |
| 클러스터 탭 클릭 | `activeClusterIndex` 변경 → `getFilteredPapers`로 필터링 |
| 검색 결과 5개 미만 | 클러스터링 미실행 |

### 엣지 케이스

- **abstract 없는 논문**: 시드 버튼 비활성화 (disabled)
- **시드 교체 중 이전 요청 진행**: AbortController로 이전 요청 취소
- **클러스터링 중 새 검색**: 이전 클러스터링 abort, 새 결과로 재실행
- **검색 결과 5개 미만**: 클러스터링 미실행, 탭 미표시
- **Gemini API 실패**: 에러 메시지 표시, 기능 사용 불가하더라도 기존 검색은 정상 동작
- **세션 복원**: seedPaperId, keywords, clusters, activeClusterIndex 모두 SessionState에 저장/복원

### 구현 순서

1. **Phase 1 — 기반**: `@google/generative-ai` 설치, `app/features/research-guide/` 모듈 생성
2. **Phase 2 — API**: extract-keywords, cluster 엔드포인트 구현
3. **Phase 3 — 훅**: useResearchGuide 구현
4. **Phase 4 — UI**: ResearchKeywords, ClusterTabs 컴포넌트, SearchResultCard 시드 버튼
5. **Phase 5 — 통합**: page.tsx에 훅+컴포넌트 통합, 세션 상태 확장
6. **Phase 6 — 문서**: contexts 3개, SPEC.md 업데이트

### 검증

1. extract-keywords API에 실제 논문 보내서 3~5개 키워드 반환 확인
2. cluster API에 20개 논문 보내서 3~6개 클러스터 반환, 모든 논문 할당 확인
3. 전체 플로우: 검색 → 시드 → 키워드 → 키워드 클릭 → 재검색 → 클러스터 → 필터링
4. 세션 새로고침 후 상태 복원 확인
5. 시드 교체 시 이전 요청 abort 확인
