# Moon Search Light - Claude 규칙

## 커밋 전 필수 작업

커밋/푸시 요청 시 다음 문서를 항상 업데이트:

1. **README.md** - 주요 기능 변경 시 업데이트
2. **docs/SPEC.md** - 기능 변경 시 스펙 업데이트

## 문서 작성 기준

- **300 라인 이하**: 초과 시 분할하고 참조
- **적절한 추상화**: 픽셀 값, Tailwind 클래스 등 구현 세부사항 제외
- **핵심만 기술**: "무엇을" 중심, "어떻게"는 코드에서 확인

## 문서 구조

| 문서 | 내용 |
|------|------|
| README.md | 프로젝트 소개, 빠른 시작 |
| docs/SPEC.md | 제품 기능 스펙 |
| docs/ARCHITECTURE.md | 기술 아키텍처 |
| docs/DESIGN.md | 디자인 가이드 |

## 코드 스타일

- TypeScript + Next.js 15 + React 19
- Tailwind CSS 사용
- 한국어 UI, 영어 코드/주석

## 주요 파일 구조

- `app/page.tsx` - 메인 페이지
- `app/components/` - UI 컴포넌트
- `app/api/` - API 라우트
- `app/hooks/` - 커스텀 훅
- `app/lib/` - 유틸리티
- `app/types/` - 타입 정의
- `app/features/` - 비즈니스 기능 모듈

## 기능 모듈 ↔ 컨텍스트 문서 동기화

**핵심 규칙: 코드 변경 시 문서 업데이트, 문서 변경 시 코드 업데이트**

| 기능 모듈 | 컨텍스트 문서 |
|-----------|---------------|
| `app/features/notes/` | `contexts/notes-*.md` |
| `app/features/ai-analysis/` | `contexts/ai-analysis-*.md` |
| `app/features/relevance/` | `contexts/relevance-*.md` |
| `app/features/search/` | `contexts/search-*.md` |
| `app/features/research-assistant/` | `contexts/research-assistant-*.md` |

### 동기화 흐름

```
코드 변경 → 해당 컨텍스트 문서 확인 → 문서 업데이트
문서 변경 → 해당 기능 모듈 확인 → 코드 업데이트
```

### 파일 매핑

| 코드 | 문서 | 동기화 대상 |
|------|------|-------------|
| `principles.ts` | `*-principles.md` | 상수, 규칙, 제한값 |
| `strategies.ts` | `*-strategy.md` | 알고리즘, 처리 흐름 |
| `types.ts` | `*-format.md` | 타입, 인터페이스 |

### 작업 시 체크리스트

- [ ] 기능 모듈 수정 시: 해당 `contexts/*.md` 문서 읽고 업데이트
- [ ] 컨텍스트 문서 수정 시: 해당 `app/features/*/` 코드 읽고 업데이트
- [ ] 새 상수/타입 추가 시: 코드와 문서 양쪽에 반영
- [ ] 알고리즘 변경 시: strategy 문서의 흐름도 업데이트
