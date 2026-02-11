# 클러스터별 연구노트 관리 — 아이디어 검토

## 문제 정의

현재 Moon Search Light의 세션은 **하나의 평면적 작업 공간**이다.

```
Session → { selectedPapers, analyses, chatMessages, contextSummary }
```

클러스터링은 검색 결과를 그룹핑해서 **표시만 필터링**할 뿐, 고유한 작업 공간이 없다.

- 클러스터 탭 클릭 → 표시 논문만 바뀜
- 선택/분석/채팅은 전부 세션 하나에 섞임

**문제**: "실험 자동화" 클러스터의 논문 3개와 "문헌 분석 도구" 클러스터의 논문 4개를 각각 깊이 탐구하고 싶은데, 한 덩어리로 관리되니까 맥락이 뒤섞인다.

---

## 아이디어

### 1. Cluster → Session Fork (세션 분기)

클러스터를 독립 세션으로 떼어내는 방식.

```
클러스터 탭 옆에 [📋 세션으로 분리] 버튼
→ 해당 클러스터 논문만 포함된 새 세션 생성
→ 분석/번역 결과도 해당 논문 것만 복사
→ 원본 세션의 시드 정보 + 키워드도 메타데이터로 기록
```

**장점**:
- 기존 세션 시스템 그대로 활용, 구현 난이도 낮음
- 세션 간 전환으로 클러스터별 독립 작업 가능
- 각 분기 세션에서 Research Assistant 별도 대화 가능

**단점**:
- 세션 상한 5개 제약에 걸림 (클러스터 4개면 세션 4개 소모)
- 원본 세션과의 관계가 끊김 (어디서 분기됐는지 추적이 약함)
- 클러스터 간 비교/통합 작업이 어려움

---

### 2. 세션 내 워크스페이스 (Sub-workspace)

세션 안에 클러스터별 독립 작업 공간을 만드는 방식.

```
현재:  Session → { selectedPapers, analyses, chatMessages, contextSummary }

변경:  Session → {
         공통: selectedPapers, analyses, translations,
         workspaces: {
           [clusterIndex]: {
             chatMessages,
             contextSummary,
             memo: string,
           }
         }
       }
```

클러스터 탭 전환 시 → Research Assistant 패널이 해당 워크스페이스의 채팅/분석으로 전환.

**장점**:
- 세션 제한 안 건드림
- 클러스터 간 전환이 탭 클릭 하나로 즉시 가능
- 선택/분석은 공유하면서 대화/메모만 분리 → 적절한 분리 수준

**단점**:
- 세션 상태 구조 변경이 꽤 큼 (SessionState 스키마, 복원 로직)
- Research Assistant 훅이 워크스페이스 인식해야 함
- 일반 검색(클러스터 없는 경우)과의 호환성 관리 필요

---

### 3. 클러스터 노트 레이어 (경량 메모)

기존 구조는 건드리지 않고, 클러스터에 메모 + 태그 레이어만 얹는 방식.

```
ClusterTabs 확장:
  [전체] [실험 자동화 (12) 📝] [문헌 분석 (8) 📝] ...

📝 클릭 시 인라인 메모 영역 토글:
  ┌──────────────────────────────────┐
  │ 📂 실험 자동화                      │
  │ "AI 기반 실험 설계가 주류. 특히     │
  │  강화학습 접근이 2024년부터 급증"    │
  │                          [저장]    │
  └──────────────────────────────────┘
```

각 클러스터에 자유 텍스트 메모를 달 수 있고, 세션에 저장됨.

**장점**:
- 구현 난이도 매우 낮음
- 기존 구조 거의 안 건드림 (ResearchGuideSessionState에 memos 필드 추가 정도)
- 빠르게 붙이고 효과 검증 가능

**단점**:
- "별도 연구노트"라기보다는 메모 수준
- Research Assistant와 연결이 없음
- 클러스터별 깊은 분석 워크플로우는 지원 못함

---

## 비교

| 접근 | 분리 수준 | 구현 난이도 | 세션 제약 | 핵심 가치 |
|------|----------|-----------|----------|----------|
| **1. Session Fork** | 완전 분리 | 낮음 | 세션 10개 제한 소모 | 기존 시스템 재활용 |
| **2. Sub-workspace** | 채팅/분석 분리 | 높음 | 없음 | 탭 하나로 맥락 전환 |
| **3. 경량 메모** | 메모만 | 매우 낮음 | 없음 | 빠른 검증 |

---

## 최종 결정: 1. Session Fork

### 제약사항

| 항목 | 결정 |
|------|------|
| 세션 상한 | 5 → 10개로 상향 |
| 복사 범위 | 해당 클러스터 논문 + 분석/번역. 채팅/시드/키워드 미복사 |
| 출처 추적 | 안 함. 완전히 독립된 세션으로 생성 |
| 세션 이름 | 클러스터명 기반 자동 생성 |

### 구현

- `createSessionFromCluster()` — 클러스터 논문 + 분석/번역으로 새 세션 생성
- `useSessionManager.forkFromCluster()` — 세션 매니저에서 분기 실행
- ClusterTabs에 "세션으로 분리" 버튼 — 활성 클러스터 선택 시 표시
- 세션 상한 `MAX_SESSION_COUNT` 5 → 10으로 변경

### 수정 파일

```
app/features/notes/principles.ts     — MAX_SESSION_COUNT 5 → 10
app/features/notes/strategies.ts     — createSessionFromCluster() 추가
app/features/notes/index.ts          — export 추가
app/lib/session-storage.ts           — re-export 추가
app/hooks/useSessionManager.ts       — forkFromCluster() 추가
app/components/ClusterTabs.tsx       — onFork prop + 분리 버튼
app/search/page.tsx                  — handleForkCluster 핸들러 연결
```
