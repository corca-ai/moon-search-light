# Search 모듈 - 전략

> 동기화 대상: `app/features/search/strategies.ts`

## 핵심 흐름

### 검색 API

1. 쿼리 검증
2. Semantic Scholar API 호출 (limit=100)
3. 쿼리 유형 감지 (구체적/단순)
4. 유형별 정렬 적용
5. 초기 20개 + 전체 100개 반환

### 쿼리 유형 감지

- **구체적**: 4+ 단어, 따옴표 포함, 50자+
- **단순**: 그 외

### 정렬 알고리즘

| 정렬 | 로직 |
|------|------|
| 추천순 | `0.6 * yearScore + 0.4 * citationScore` |
| 관련성 | `relevanceScores[paperId]` 기준 |
| 최신순 | `year` 내림차순 |
| 인용순 | `citationCount` 내림차순 |

### 연도 점수

| 연도 | 점수 |
|------|------|
| 0-1년 | 1.0 |
| 1-5년 | 0.8 |
| 5-10년 | 0.5 |
| 10-15년 | 0.25 |
| 15년+ | 0.1 |

### 인용수 점수

```
log10(citations + 1) / 5
```

---

> 상세 구현은 `app/features/search/strategies.ts` 참조
