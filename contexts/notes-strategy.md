# Notes 모듈 - 전략

> 동기화 대상: `app/features/notes/strategies.ts`

## 핵심 흐름

### 세션 생명주기

1. **생성**: `canCreateSession()` 확인 → `createSession()` → 저장 → 목록 추가
2. **전환**: 현재 세션 저장 → `loadSession()` → 현재 ID 변경
3. **삭제**: 스토리지 제거 → 목록 제거 → (현재 세션이면 새 세션 생성)
4. **클러스터 분기**: `createNewSession(clusterName)` → UI 리셋 → `executeSearch(clusterName)` (논문 복사 아님, 재검색)

### 자동 저장

- 변경 발생 → 1000ms 디바운스 → `saveSession()` + `updateSessionListItem()`
- 즉시 저장: `beforeunload`, 세션 전환, 언마운트 시

### 활동 기록

- `addActivity()` 호출 → FIFO 10개 유지 → 상태 업데이트

### 탭 간 동기화

- `storage` 이벤트 리스닝 → 현재 세션 ID 매칭 → 상태 갱신

## 에러 처리

- 모든 스토리지 작업은 `try/catch`
- 에러 시 `SessionStorageError` 생성 → 콜백 호출 → graceful 반환

---

> 상세 구현은 `app/features/notes/strategies.ts` 참조
