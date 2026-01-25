# Moon Search Light - Product Specification

**AI 기반 학술 논문 검색 및 연구 아이디어 도출 플랫폼**

Semantic Scholar API와 OpenAI를 활용한 논문 검색, 분석, 후속 연구 아이디어 도출 도구

---

## 1. 개요

### 1.1 목적
학술 연구자들이 관련 논문을 검색하고, AI 분석을 통해 논문을 파악하며, 선택한 논문들을 기반으로 후속 연구 아이디어를 도출할 수 있는 웹 애플리케이션

### 1.2 핵심 가치
- **효율적인 검색**: Semantic Scholar 2억 건 이상 논문 데이터베이스 검색
- **AI 요약**: 구조화된 한국어 논문 요약 (개요, 목표, 방법론, 결과)
- **초록 번역**: 영문 초록 한국어 번역 지원
- **관심 주제 분석**: 선택/제외 패턴 기반 연구 관심사 자동 분석
- **Research Assistant**: AI 대화를 통한 후속 연구 아이디어 도출
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
- **관심 주제 요약**: AI 분석 결과 표시
  - "당신이 관심을 갖는 주제는 ... 인 것 같습니다." 형식

### 2.4 검색/Assistant 영역 (하단)

**Assistant 비활성 시**
- 검색창 + Semantic Scholar 설명
- 검색 결과 헤더 (개수 + 정렬 옵션)
- 검색 결과 카드 목록

**Assistant 활성 시**
- Research Assistant 채팅 인터페이스
- 채팅 메시지 + 입력창

---

## 3. 검색 기능

### 3.1 데이터 출처
- **Semantic Scholar API**
- 컴퓨터과학, 의학, 물리학 등 2억 건 이상의 학술 논문 데이터베이스

### 3.2 검색 방식
- 단일 검색창에 키워드 입력
- Semantic Scholar API로 최대 100개 논문 검색
- 화면에는 상위 20개 논문 표시

### 3.3 정렬 옵션
- 관련성 (기본)
- 최신순
- 인용순

---

## 4. 논문 카드

### 4.1 검색 결과 카드 (수직 목록)
- **썸네일** (왼쪽, 이미지 있을 때만 표시)
- **헤더**: 논문 제목 + 액션 버튼 (☆, ×)
- **메타 정보**: 발행 연도 · 인용 수 · 논문 보기 링크
- **분석 중 상태**: 초록 표시 + "분석 중..." 라벨
- **분석 완료 상태**:
  - 접을 수 있는 초록 (▸ 초록 보기 / ▾ 초록 접기)
  - 초록 번역 버튼 (한국어로 번역)
  - AI 분석 결과 (개요, 목표, 방법론, 결과)
  - 키워드 태그

### 4.2 선택된/제외된 카드 (수평 스크롤)
- 간결한 카드 형태 (너비 288px)
- 논문 제목
- 발행 연도 · 인용 수
- 액션 버튼 (★ 또는 복원)
- **클릭 시 상세 모달 표시**

### 4.3 논문 상세 모달
- 제목, 연도, 인용수, 논문 링크
- 초록 + 번역 기능
- AI 분석 결과
- 키워드 태그

### 4.4 액션 버튼
| 영역 | 버튼 | 동작 |
|------|------|------|
| 검색 결과 | ☆ | 선택됨으로 이동 |
| 검색 결과 | × | 제외됨으로 이동 |
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
- 정렬 기준(관련성/최신순/인용순)에 따라 상위부터 처리
- **Assistant 비활성 시**: 선택된 논문 전체 + 정렬 기준 상위 3개
- **Assistant 활성 시**: 선택된 논문만 요약

### 5.3 키워드 추출
- 논문당 3-5개 핵심 키워드 (영어)
- 표시 전용 (클릭 기능 없음)

### 5.4 초록 번역
- "한국어로 번역" 버튼 클릭 시 GPT로 번역
- 번역 결과 초록 아래 표시

---

## 6. 관심 주제 요약

### 6.1 동작 방식
- 논문 선택/제외 시 자동 분석 (500ms 디바운스)
- 선택된 논문 제목 + 제외된 논문 제목 분석

### 6.2 표시 형식
- "당신이 관심을 갖는 주제는 ... 인 것 같습니다." 형식
- 구체적인 기술/방법론/도메인 명시
- 제외된 논문이 있으면 대비하여 표현

### 6.3 위치
- 선택됨 영역 하단
- "관심 주제 요약" 라벨과 함께 표시

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
AI와 자유로운 대화를 통해:
- 논문 비교 분석
- Research Gap 식별
- 후속 연구 아이디어 제안
- 연구 계획서 작성 지원

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
- 클릭 시 전체 화면 모달로 확대

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
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS |
| AI | OpenAI GPT-4o-mini |
| 검색 | Semantic Scholar API |
| 이미지 | Moonlight API |

---

## 11. API 엔드포인트

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

## 12. 컴포넌트 구조

```
app/
├── page.tsx                    # 메인 페이지
├── components/
│   ├── styles.ts              # 공통 스타일 상수
│   ├── HorizontalPaperCard.tsx # 수평 논문 카드
│   ├── SearchResultCard.tsx    # 검색 결과 카드
│   ├── SelectedPapersSection.tsx # 선택됨 영역
│   └── PaperDetailModal.tsx    # 논문 상세 모달
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

## 13. 디자인

### 13.1 컬러 테마
- **모노톤 (그레이)** 기반
- 라이트 모드: 흰색 배경 (`bg-white`)
- 다크 모드: 어두운 회색 배경 (`dark:bg-gray-900`)

### 13.2 스타일 상수 (styles.ts)
```typescript
button: {
  primary: 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900',
  primarySmall: '...',
  secondary: 'border border-gray-300 hover:bg-gray-100',
  icon: 'px-2 py-1 text-sm border rounded',
}
card: {
  base: 'border border-gray-200 dark:border-gray-700 rounded',
  withPadding: '... p-3',
  withPaddingLarge: '... p-4',
}
text: {
  primary: 'text-gray-900 dark:text-white',
  secondary: 'text-gray-700 dark:text-gray-300',
  tertiary: 'text-gray-500 dark:text-gray-400',
  muted: 'text-gray-400 dark:text-gray-500',
  link: 'text-blue-600 dark:text-blue-400 hover:underline',
}
```

### 13.3 레이아웃 간격
- 섹션 간격: `space-y-4`
- 카드 간격: `space-y-3`, `gap-3`
- 수평 스크롤: `overflow-x-auto`

---

**Last Updated**: 2025-01-25
