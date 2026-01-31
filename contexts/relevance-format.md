# Relevance 모듈 - 출력 형식

> 동기화 대상: `app/features/relevance/types.ts`

## 핵심 타입

| 타입 | 용도 |
|------|------|
| `Embedding` | 임베딩 벡터 (`number[]`) |
| `RelevanceScore` | 관련도 점수 (0-100) |
| `RelevanceScores` | 논문별 점수 맵 (`Record<string, number>`) |

## API 타입

| 요청 | 응답 |
|------|------|
| `EmbeddingsRequest` | `{ embeddings: Embedding[] }` |

## 훅 타입

| 타입 | 용도 |
|------|------|
| `UseRelevanceScoreProps` | selectedPapers, candidatePapers |
| `UseRelevanceScoreReturn` | relevanceScores, isCalculating |

## 상수

| 상수 | 값 |
|------|-----|
| `MAX_BATCH_SIZE` | 50 |
| `MAX_CANDIDATE_PAPERS` | 20 |
| `SCORE_DEBOUNCE_MS` | 300 |

---

> 상세 타입은 `app/features/relevance/types.ts` 참조
