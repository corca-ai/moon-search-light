# Notes 모듈 - 출력 형식

> 동기화 대상: `app/features/notes/types.ts`

## 핵심 타입

| 타입 | 용도 |
|------|------|
| `Session` | 완전한 세션 객체 (id, name, state, activities) |
| `SessionState` | 상태 스냅샷 (query, papers, analyses, chatMessages 등) |
| `SessionListItem` | 목록용 메타데이터 (id, name, paperCount 등) |
| `ActivityEvent` | 활동 기록 (type, timestamp, data) |

## 결과 타입

| 타입 | 용도 |
|------|------|
| `SaveResult` | 저장 성공/실패 |
| `LoadResult<T>` | 로드 성공(data)/실패 |
| `CreateSessionResult` | 생성 성공(session)/실패(limit_reached) |

## 상수

| 상수 | 값 |
|------|-----|
| `MAX_SESSION_COUNT` | 10 |
| `MAX_ACTIVITY_COUNT` | 10 |
| `SESSION_VERSION` | "1.0.0" |

---

> 상세 타입은 `app/features/notes/types.ts` 참조
