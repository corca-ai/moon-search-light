# AI Analysis 모듈 - 출력 형식

> 동기화 대상: `app/features/ai-analysis/types.ts`

## 핵심 타입

| 타입 | 용도 |
|------|------|
| `PaperAnalysis` | 논문 요약 (overview, goals, method, results, keywords) |
| `ContextSummary` | 다중 논문 분석 (commonProblem, commonMethods, differences, researchLandscape) |

## API 타입

| 요청 | 응답 |
|------|------|
| `SummarizeRequest` | `PaperAnalysis` |
| `TranslateRequest` | `{ translation }` |
| `InterestSummaryRequest` | `{ summary }` |
| `ContextSummaryRequest` | `ContextSummary` |

## Zod 스키마

- `PaperAnalysisSchema` - 요약 응답 검증
- `ContextSummarySchema` - 컨텍스트 분석 응답 검증

---

> 상세 타입은 `app/features/ai-analysis/types.ts` 참조
