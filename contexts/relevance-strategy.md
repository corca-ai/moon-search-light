# Relevance 모듈 - 전략

> 동기화 대상: `app/features/relevance/strategies.ts`

## 핵심 흐름

### 관련도 계산

1. 300ms 디바운스 후 시작
2. 이전 요청 abort
3. 선택 논문 임베딩 fetch (캐시 우선)
4. 후보 논문 임베딩 fetch (상위 20개)
5. 선택 논문의 평균 임베딩 계산
6. 각 후보와 코사인 유사도 계산
7. 0-100% 변환하여 반환

### 임베딩 fetch

1. 캐시 확인 → 캐시 히트는 바로 반환
2. 캐시 미스만 API 호출
3. 응답 후 캐시 저장

### 점수 변환

```
코사인 유사도 [-1, 1] → 정규화 [0, 1] → 퍼센트 [0, 100]
```

### 정렬 통합

```
sortPapers(papers, sortType) 호출
├── 추천순 (selectedPapers 있음)
│   ├── 연도 점수 × 0.35
│   ├── 인용수 점수 × 0.25
│   └── 유사도 점수 × 0.40 (미계산 시 기본값 50)
├── 추천순 (selectedPapers 없음)
│   ├── 연도 점수 × 0.60
│   └── 인용수 점수 × 0.40
├── 관련성 (selectedPapers 있음)
│   ├── 유사도 내림차순
│   └── 동률 시 인용수 타이브레이커
└── 관련성 (selectedPapers 없음) → 추천순 폴백
```

## 요청 취소

- 새 요청 시 이전 `AbortController.abort()` 호출
- `AbortError`는 무시 (정상 흐름)

---

> 상세 구현은 `app/features/relevance/strategies.ts` 참조
