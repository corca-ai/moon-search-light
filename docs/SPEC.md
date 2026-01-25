# Moon Search Light - Product Specification

**AI 기반 학술 논문 검색 및 연구 아이디어 도출 플랫폼**

Semantic Scholar API와 OpenAI를 활용한 논문 검색, 분석, 후속 연구 아이디어 도출 도구

---

## 1. 개요

### 1.1 목적
학술 연구자들이 관련 논문을 검색하고, AI 분석을 통해 논문을 파악하며, 선택한 논문들을 기반으로 후속 연구 아이디어를 도출할 수 있는 웹 애플리케이션

### 1.2 핵심 가치
- **효율적인 검색**: Semantic Scholar 2억 건 이상 논문 데이터베이스 검색
- **스마트 정렬**: 추천순(최신 연구 우선 + 인용수 반영)
- **AI 요약**: 구조화된 한국어 논문 요약 (개요, 목표, 방법론, 결과)
- **초록 번역**: 영문 초록 한국어 번역 지원
- **관심 주제 분석**: 선택/제외 패턴 기반 연구 관심사 자동 분석
- **Research Assistant**: AI 대화를 통한 후속 연구 아이디어 도출 (마크다운 렌더링)
- **통합 컨텍스트 분석**: 복수 논문의 공통점, 차이점, 연구 지형 분석
- **시각적 프리뷰**: ArXiv 논문 스냅샷 이미지 제공
- **Moonlight 연동**: ArXiv 논문을 Moonlight 뷰어에서 열람

### 1.3 대상 사용자
- 학술 연구자
- 대학원생
- 후속 연구를 기획하는 연구자

---

## 2. 화면 구성

### 2.1 전체 레이아웃
- 최대 너비: `max-w-7xl` (1280px)
- 전체 높이: 뷰포트 100% 사용
- **상하 레이아웃**: 선택 영역(상단) + 검색/Assistant 영역(하단)

### 2.2 헤더 영역
- 좌측: 타이틀 "moon-search-light" + 부제 "논문 탐색 도구"
- 우측:
  - "연구 개요 다운로드" 버튼 (Assistant 활성 + 대화 있을 때)
  - "연구 시작" 버튼 (논문 선택 시) / "← 검색으로" 버튼 (Assistant 활성 시)

### 2.3 선택됨 영역 (상단)
- **선택된 논문**: 수평 스크롤 카드 목록
- **제외됨**: 접기/펼치기 토글 (▸/▼)
- **관심 주제 요약**: AI 분석 결과 표시 (명사형 종결)

### 2.4 검색/Assistant 영역 (하단)

**Assistant 비활성 시**
- 검색창 (검색 아이콘 포함) + Semantic Scholar 설명
- 검색 결과 헤더 (개수 + 정렬 옵션)
- 검색 결과 카드 목록

**Assistant 활성 시**
- Research Assistant 채팅 인터페이스
- 마크다운 렌더링 지원
- 타이핑 인디케이터 애니메이션

---

## 3. 검색 기능

### 3.1 데이터 출처
- **Semantic Scholar API**
- 컴퓨터과학, 의학, 물리학 등 2억 건 이상의 학술 논문 데이터베이스

### 3.2 검색 방식
- 단일 검색창에 키워드 입력
- Semantic Scholar API로 최대 100개 논문 검색
- 초기 20개 표시, "더 보기" 버튼으로 20개씩 추가 로드

### 3.3 페이지네이션
- 초기 표시: 20개
- 추가 로드 단위: 20개씩
- "더 보기" 버튼에 남은 논문 수 표시
- 새 검색 시 표시 개수 초기화
- 선택/제외된 논문은 자동 필터링

### 3.4 정렬 옵션

| 옵션 | 설명 |
|------|------|
| **추천순** (기본) | 최신 연구 우선 + 인용수 반영 |
| 관련성 | Semantic Scholar 기본 관련성 |
| 최신순 | 발행 연도 내림차순 |
| 인용순 | 인용수 내림차순 |

### 3.5 추천순 정렬 알고리즘

**연도 가중치 (60%)**
| 구간 | 가중치 |
|------|--------|
| 0-1년 | 1.0 |
| 1-5년 | 0.8 |
| 5-10년 | 0.5 |
| 10-15년 | 0.25 |
| 15년+ | 0.1 |

**인용수 가중치 (40%)**
- 로그 스케일로 정규화: `log10(citations + 1) / 5`
- 고인용 논문도 상위 노출 보장

**종합 점수**
```
score = yearScore * 0.6 + citationScore * 0.4
```

---

## 4. 논문 카드

### 4.1 검색 결과 카드 (수직 목록)
- **썸네일** (왼쪽, 이미지 있을 때만 표시)
- **헤더**: 논문 제목 + 액션 버튼 (⭐, ✕)
- **메타 정보**: 발행 연도 · 인용 수 · 논문 보기 링크
- **분석 중 상태**: 초록 표시 + 펄스 애니메이션
- **분석 완료 상태**:
  - 접을 수 있는 초록 (화살표 아이콘)
  - 초록 번역 버튼 (한국어로 번역)
  - AI 분석 결과 (개요, 목표, 방법론, 결과)
  - 키워드 태그 (indigo 색상)

### 4.2 선택된/제외된 카드 (수평 스크롤)
- 간결한 카드 형태 (너비 288px)
- 논문 제목 (2줄 제한)
- 발행 연도 · 인용 수
- 액션 버튼 (★ 또는 복원)
- **클릭 시 상세 모달 표시**
- hover 시 제목 색상 변경

### 4.3 논문 상세 모달
- backdrop-blur 배경
- 제목, 연도, 인용수, 논문 링크
- 초록 + 번역 기능
- AI 분석 결과
- 키워드 태그
- scale 애니메이션

### 4.4 액션 버튼
| 영역 | 버튼 | 동작 |
|------|------|------|
| 검색 결과 | ⭐ | 선택됨으로 이동 |
| 검색 결과 | ✕ | 제외됨으로 이동 |
| 선택됨 | ★ | 검색 결과로 복귀 |
| 제외됨 | 복원 | 검색 결과로 복귀 |

---

## 5. AI 요약 기능

### 5.1 요약 구조
| 항목 | 설명 |
|------|------|
| 개요 | 논문의 전체적인 내용 요약 |
| 목표 | 논문이 해결하고자 하는 문제 |
| 방법론 | 문제 해결을 위한 접근 방식 |
| 결과 | 주요 결과 및 기여점 |

### 5.2 요약 처리 방식
- 배치 크기: 3개씩 순차 처리
- 정렬 기준에 따라 상위부터 처리
- **Assistant 비활성 시**: 선택된 논문 전체 + 정렬 기준 상위 3개
- **Assistant 활성 시**: 선택된 논문만 요약

### 5.3 키워드 추출
- 논문당 3-5개 핵심 키워드 (영어)
- 표시 전용 (클릭 기능 없음)

### 5.4 초록 번역
- "한국어로 번역" 버튼 클릭 시 GPT로 번역
- 번역 결과 초록 아래 표시 (indigo 배경)

---

## 6. 관심 주제 요약

### 6.1 동작 방식
- 논문 선택/제외 시 자동 분석 (500ms 디바운스)
- 선택된 논문 제목 + 제외된 논문 제목 분석

### 6.2 표시 형식
- **명사형 종결** (추측성 어미 사용 안 함)
- 100글자 이하 간결한 요약
- 구체적인 기술/방법론/도메인 명시
- 제외된 논문이 있으면 대비하여 표현
- 예: "전통적인 CNN보다는 Vision Transformer를 활용한 이미지 분류"

### 6.3 위치
- 선택됨 영역 하단
- 전구 아이콘 + "관심 주제 요약" 라벨

---

## 7. Research Assistant

### 7.1 활성화 조건
- 1개 이상의 논문 선택 필요

### 7.2 활성화 시 동작

**1개 논문 선택**
- 통합 분석 없이 바로 대화 시작
- "2개 이상의 논문을 선택하면 통합 분석을 제공합니다" 안내

**2개 이상 논문 선택**
- 통합 컨텍스트 자동 생성:
  - 공통 문제
  - 공통 방법론
  - 주요 차이점
  - 연구 지형

### 7.3 채팅 기능
- **마크다운 렌더링 지원** (react-markdown + @tailwindcss/typography)
- AI와 자유로운 대화를 통해:
  - 논문 비교 분석
  - Research Gap 식별
  - 후속 연구 아이디어 제안
  - 연구 계획서 작성 지원
- 타이핑 인디케이터 (바운스 애니메이션)

### 7.4 연구 개요 다운로드
- 헤더 영역에 "연구 개요 다운로드" 버튼
- 대화 내용이 있을 때만 활성화
- 포함 내용: 분석 대상 논문 목록, 대화 내용 전체
- 파일명: `research-overview-{timestamp}.md`

### 7.5 분석 결과 기억
- 비활성화 시 대화 내용 유지
- 재활성화 시:
  - 동일한 논문 선택 → 기존 대화 복원
  - 다른 논문 선택 → 새로 분석 수행
- 선택 논문이 없으면 초기화

---

## 8. 이미지 스냅샷

### 8.1 데이터 출처
- ArXiv 논문의 주요 페이지 캡처 이미지
- 논문 제목 기반 매칭

### 8.2 표시 방식
- 카드 왼쪽에 썸네일 (이미지 있을 때만)
- 클릭 시 전체 화면 모달로 확대 (backdrop-blur)

---

## 9. 외부 링크

### 9.1 Moonlight 연동
- ArXiv 논문: Moonlight 뷰어에서 열람
- URL 형식: `themoonlight.io/file?url={arxiv_pdf_url}`

### 9.2 기본 링크
- PDF URL이 있는 논문: Moonlight 뷰어
- PDF URL이 없는 논문: Semantic Scholar 페이지

---

## 10. 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| UI | Pretendard Variable 폰트, @tailwindcss/typography |
| 마크다운 | react-markdown |
| AI | OpenAI GPT-4o-mini |
| 검색 | Semantic Scholar API |
| 이미지 | Moonlight API |
| Analytics | PostHog (posthog-js, posthog-node) |

---

## 11. 사용자 식별 및 분석

### 11.1 이메일 입력
- 앱 최초 접속 시 이메일 입력 모달 표시
- `localStorage`에 저장하여 재방문 시 자동 인식
- PostHog `identify()` 호출로 사용자 식별

### 11.2 PostHog Analytics
- 클라이언트: `posthog-js` (instrumentation-client.ts)
- 서버: `posthog-node` (app/lib/posthog-server.ts)
- 리버스 프록시: `/ingest` → PostHog (광고 차단기 우회)

### 11.3 트래킹 이벤트
| 이벤트 | 설명 | 주요 속성 |
|--------|------|----------|
| user_identified | 사용자 이메일 입력 | email |
| paper_searched | 논문 검색 | query, results_count |
| paper_selected | 논문 선택 | paper_id, paper_title |
| paper_excluded | 논문 제외 | paper_id |
| research_assistant_activated | 연구 어시스턴트 활성화 | selected_papers_count, interest_summary |
| papers_summarize_requested | 논문 요약 배치 요청 | papers_count |
| chat_message_sent | 채팅 메시지 전송 | message_length |

---

## 12. API 엔드포인트

| 경로 | 용도 |
|------|------|
| /api/search | 논문 검색 |
| /api/summarize | 논문 AI 요약 |
| /api/translate | 초록 한국어 번역 |
| /api/interest-summary | 관심 주제 요약 |
| /api/paper-images | 스냅샷 이미지 조회 |
| /api/context-summary | 통합 컨텍스트 생성 |
| /api/chat | AI 채팅 (스트리밍) |

---

## 13. 컴포넌트 구조

```
app/
├── page.tsx                    # 메인 페이지
├── favicon.ico                 # 파비콘
├── globals.css                 # 글로벌 스타일, Pretendard 폰트, 애니메이션
├── components/
│   ├── styles.ts              # 공통 스타일 상수 (slate 색상 계열)
│   ├── HorizontalPaperCard.tsx # 수평 논문 카드
│   ├── SearchResultCard.tsx    # 검색 결과 카드
│   ├── SelectedPapersSection.tsx # 선택됨 영역
│   └── PaperDetailModal.tsx    # 논문 상세 모달
├── lib/
│   └── posthog-server.ts      # 서버 사이드 PostHog 클라이언트
└── api/
    ├── search/route.ts
    ├── summarize/route.ts
    ├── translate/route.ts
    ├── interest-summary/route.ts
    ├── paper-images/route.ts
    ├── context-summary/route.ts
    └── chat/route.ts
```

---

## 14. 디자인

### 13.1 폰트
- **Pretendard Variable**: 본문 및 UI 전체
- CDN: `cdn.jsdelivr.net/gh/orioncactus/pretendard`

### 13.2 컬러 테마
- **Slate 계열** 기반 (gray → slate 전환)
- 라이트 모드: 흰색 배경 (`bg-white`)
- 다크 모드: 어두운 슬레이트 배경 (`dark:bg-slate-900`)
- 액센트: indigo 계열

### 13.3 스타일 상수 (styles.ts)
```typescript
button: {
  primary: 'bg-slate-900 text-white rounded-lg hover:scale-[1.02]',
  secondary: 'border border-slate-200 rounded-lg hover:bg-slate-50',
  icon: 'p-2 rounded-lg hover:bg-slate-100',
}
card: {
  base: 'bg-white border border-slate-200 rounded-xl shadow-sm',
  hover: 'hover:shadow-md hover:border-slate-300 transition-all',
}
text: {
  primary: 'text-slate-900 dark:text-white',
  secondary: 'text-slate-700 dark:text-slate-300',
  link: 'text-indigo-600 hover:underline',
  accent: 'text-indigo-600 dark:text-indigo-400',
}
tag: 'bg-indigo-50 text-indigo-600 rounded-full'
```

### 13.4 애니메이션
- `animate-fade-in`: 카드 등장
- `animate-scale-in`: 모달 등장
- `animate-pulse`: 분석 중 상태
- `animate-bounce`: 타이핑 인디케이터

### 13.5 레이아웃 간격
- 섹션 간격: `space-y-5`
- 카드 간격: `space-y-4`, `gap-3`
- 수평 스크롤: `overflow-x-auto scrollbar-thin`

---

**Last Updated**: 2026-01-25
