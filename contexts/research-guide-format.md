# Research Guide 모듈 - 출력 형식

> 동기화 대상: `app/features/research-guide/types.ts`

---

## 1. 키워드 추출 응답

### ResearchKeyword

| 필드 | 타입 | 설명 |
|------|------|------|
| `keyword` | `string` | 영어 검색 키워드 (1-4 words) |
| `description` | `string` | 한국어 1줄 설명 |

### API 응답

```json
{
  "seedDescription": "이 논문은 연합학습 환경에서 차분 프라이버시를 적용하는 방법을 다루며...",
  "keywords": [
    { "keyword": "federated learning", "description": "분산 환경에서의 모델 학습 방법론" },
    { "keyword": "differential privacy", "description": "개인정보 보호를 위한 수학적 프레임워크" }
  ]
}
```

> `seedDescription`: 시드 논문에 대한 한국어 연구 맥락 해설 (2-3문장). 해당 분야에 익숙하지 않은 연구자가 논문의 위치를 파악할 수 있도록 작성됨.

---

## 2. 클러스터링 응답

### Cluster

| 필드 | 타입 | 설명 |
|------|------|------|
| `name` | `string` | 한국어 클러스터명 (2-5 words) |
| `description` | `string` | 한국어 1줄 설명 |
| `paperIndices` | `number[]` | 해당 클러스터 논문 인덱스 (0-based) |

### API 응답

```json
{
  "clusters": [
    {
      "name": "프라이버시 보존 학습",
      "description": "개인정보 보호 기반의 머신러닝 기법",
      "paperIndices": [0, 3, 7]
    },
    {
      "name": "분산 최적화",
      "description": "분산 환경에서의 모델 최적화 알고리즘",
      "paperIndices": [1, 2, 5, 8]
    }
  ]
}
```

---

## 3. 세션 저장 형식

### ResearchGuideSessionState

| 필드 | 타입 | 설명 |
|------|------|------|
| `seedPaperId` | `string \| null` | 시드 논문 ID |
| `seedDescription` | `string` | 시드 논문 연구 맥락 해설 |
| `keywords` | `ResearchKeyword[]` | 추출된 키워드 |
| `clusters` | `Cluster[]` | 클러스터 결과 |
| `activeClusterIndex` | `number \| null` | 활성 클러스터 인덱스 |
| `searchedViaKeyword` | `boolean` | 키워드 검색 여부 |

---

## 4. Zod 스키마

- `ResearchKeywordSchema` — 키워드 단일 항목 검증
- `ExtractKeywordsResponseSchema` — 키워드 추출 응답 전체 검증
- `ClusterSchema` — 클러스터 단일 항목 검증
- `ClusterResponseSchema` — 클러스터링 응답 전체 검증

---

> **동기화 지침**: 이 문서를 수정하면 `app/features/research-guide/types.ts`도 함께 수정해야 합니다.
