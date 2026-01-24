# Moon Search Light

AI 기반 학술 논문 검색 및 연구 아이디어 도출 플랫폼

## 소개

Moon Search Light는 연구자들이 학술 논문을 효율적으로 검색하고, AI 분석을 통해 논문을 파악하며, 선택한 논문들을 기반으로 후속 연구 아이디어를 도출할 수 있는 웹 애플리케이션입니다.

### 주요 기능

- **논문 검색**: Semantic Scholar API를 활용한 키워드 기반 논문 검색
- **AI 요약**: GPT-4o-mini를 활용한 구조화된 한국어 논문 요약 (개요, 목표, 방법론, 결과)
- **Research Assistant**: AI 대화를 통한 후속 연구 아이디어 도출
- **시각적 프리뷰**: ArXiv 논문 스냅샷 이미지 제공

## 사용법

### 1. 논문 검색

1. 검색창에 키워드 입력 후 검색
2. 검색 결과에서 관심 논문 확인
3. AI가 자동으로 각 논문을 분석하여 요약 제공

### 2. 논문 선택

| 버튼 | 동작 |
|------|------|
| ☆ | 논문을 선택 목록에 추가 |
| × | 논문을 제외 목록으로 이동 |
| ★ | 선택 해제 |

### 3. Research Assistant 활성화

1. **3개 이상의 논문 선택** 후 "분석 시작" 클릭
2. AI가 선택된 논문들의 통합 컨텍스트 자동 생성
3. 채팅을 통해 후속 연구 아이디어 도출

### 4. 연구 개요 다운로드

- 대화 진행 후 "연구 개요 다운로드" 버튼 클릭
- 분석 대상 논문 목록과 대화 내용이 마크다운 파일로 저장

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS |
| AI | OpenAI GPT-4o-mini |
| 검색 | Semantic Scholar API |
| 이미지 | Moonlight API |

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# OPENAI_API_KEY, S2_API_KEY 등 설정

# 개발 서버 실행
npm run dev
```

## 환경 변수

| 변수 | 설명 |
|------|------|
| `OPENAI_API_KEY` | OpenAI API 키 |
| `S2_API_KEY` | Semantic Scholar API 키 (선택) |

## 라이선스

MIT
