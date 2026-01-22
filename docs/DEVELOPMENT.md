# Moon Search Light - 개발 내역

## 프로젝트 개요
Semantic Scholar API와 OpenAI를 활용한 AI 기반 논문 검색 및 추천 시스템

## 핵심 기능

### 1. 스마트 논문 검색
- **Positive/Negative 키워드 검색**: 포함/제외 키워드로 정밀 검색
- **검색 범위**: 100개 논문 검색, 상위 20개 표시
- **정렬**: 인용수 기준 내림차순
- **Semantic Scholar API** 연동 (API Key 사용)

### 2. 3단계 논문 관리 시스템
**좌측 패널 (2분할)**
- **Selected Papers (상단)**: 읽기로 확정한 논문
- **Candidate Papers (하단)**: 추천 후보 논문
- ↑↓ 버튼으로 논문 간 이동 가능

**우측 패널**
- **Excluded Papers**: Negative 키워드로 제외된 논문

### 3. AI 기반 논문 분석 (gpt-5-mini-2025-08-07)
- **한국어 요약**: 초록을 2-3문장으로 요약
- **영어 키워드 추출**: 3-5개 핵심 키워드
- **Structured Output**: Zod 스키마 기반
- **배치 처리**: 3개씩 병렬 요청으로 성능 최적화
- **클릭 가능 키워드**: 키워드 클릭 시 자동으로 검색에 추가 (중복 방지)

### 4. 벡터 기반 의미론적 추천 시스템
**임베딩 생성**
- **모델**: OpenAI text-embedding-3-small
- **대상**: 전체 100개 논문 (제목 + 초록)
- **메모리 저장**: 클라이언트 상태로 관리

**스마트 재순위 알고리즘**
```
combinedScore = (similarity × 0.6) + (citationScore × 0.4)
```
- **의미적 유사도 (60%)**: Selected Papers 평균 임베딩과의 코사인 유사도
- **인용수 스코어 (40%)**: 로그 스케일로 정규화된 인용수
- **실시간 재정렬**: Selected Papers 변경 시 자동으로 Candidate 목록 업데이트

### 5. 반응형 UI/UX
- **2컬럼 레이아웃**: 좌우 대칭 구조
- **다크모드 지원**: 시스템 설정 자동 감지
- **실시간 피드백**:
  - 검색 중... 로딩 상태
  - AI 분석 중... 표시
  - 에러 메시지 표시
- **스크롤 최적화**: Selected Papers 영역 독립 스크롤

## 기술 스택

### Frontend
- **Next.js 15** (App Router)
- **React 19** (Client Components)
- **TypeScript**
- **Tailwind CSS**

### Backend (API Routes)
- **Next.js API Routes**
- `/api/search` - Semantic Scholar 검색
- `/api/embed` - 벡터 임베딩 생성
- `/api/summarize` - AI 요약/키워드 추출

### AI/ML
- **OpenAI API**
  - gpt-5-mini-2025-08-07 (요약/키워드)
  - text-embedding-3-small (벡터 임베딩)
- **Semantic Scholar API** (논문 검색)

### 주요 라이브러리
- `openai` - OpenAI SDK
- `zod` - 스키마 검증

## 데이터 플로우

1. **검색 단계**
   - 사용자 키워드 입력 → Semantic Scholar API (100개)
   - Positive/Negative 필터링 → 상위 20개 표시
   - 전체 100개 임베딩 생성 → 메모리 저장

2. **분석 단계**
   - 화면에 보이는 20개만 AI 분석
   - 3개씩 병렬 요청으로 최적화
   - 결과 즉시 화면 업데이트

3. **추천 단계**
   - Selected Papers 선택 시
   - 평균 임베딩 계산
   - 유사도 + 인용수 복합 스코어링
   - Candidate Papers 실시간 재정렬

## 성능 최적화

- **배치 처리**: AI 요청 3개씩 병렬화
- **증분 업데이트**: 분석 결과 개별 업데이트
- **메모이제이션**: 임베딩 재사용
- **조건부 로딩**: Selected Papers 있을 때만 재순위

## 배포
- **플랫폼**: Vercel
- **환경변수**:
  - `S2_API_KEY` - Semantic Scholar
  - `OPENAI_API_KEY` - OpenAI

## 주요 알고리즘

### 코사인 유사도
```typescript
cosineSimilarity = dotProduct / (magnitude_A × magnitude_B)
```

### 복합 스코어
```typescript
citationScore = log(citations + 1) / log(max_citations + 1)
combinedScore = similarity × 0.6 + citationScore × 0.4
```

## 파일 구조
```
app/
├── api/
│   ├── search/route.ts      # 논문 검색
│   ├── embed/route.ts       # 벡터 임베딩
│   └── summarize/route.ts   # AI 요약
├── page.tsx                 # 메인 페이지
├── layout.tsx               # 앱 레이아웃
└── globals.css              # 전역 스타일
```

## 향후 개선 가능 사항
- 페이지네이션 (100개 이상 논문)
- 필터 저장/로드 기능
- Selected Papers 내보내기
- 논문 메모 기능
- 유사도 시각화
