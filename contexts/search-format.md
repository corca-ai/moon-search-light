# Search 모듈 - 출력 형식

> 동기화 대상: `app/features/search/types.ts`

## 핵심 타입

| 타입 | 용도 |
|------|------|
| `Paper` | 논문 정보 (paperId, title, abstract, year, citationCount 등) |
| `SortType` | 정렬 옵션 (recommended, relevance, year-desc, citations) |
| `QueryAnalysis` | 쿼리 분석 결과 (normalized, words, isSpecific) |

## API 타입

| 타입 | 용도 |
|------|------|
| `SearchResponse` | papers(20), allPapers(100), total |

## 상수

| 상수 | 값 |
|------|-----|
| `MAX_RESULTS` | 100 |
| `INITIAL_DISPLAY` | 20 |
| `YEAR_WEIGHT` | 0.6 |
| `CITATION_WEIGHT` | 0.4 |

---

> 상세 타입은 `app/features/search/types.ts` 참조
