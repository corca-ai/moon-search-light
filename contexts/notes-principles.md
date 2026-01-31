# Notes 모듈 - 원칙

> 동기화 대상: `app/features/notes/principles.ts`

---

## 1. 세션 규칙

### 1.1 세션 생명주기

| 단계 | 설명 |
|------|------|
| 생성 | 첫 방문 또는 명시적 생성 시 자동 생성 |
| 활성 | 현재 작업 중인 세션 (단일) |
| 전환 | 다른 세션으로 변경 시 자동 저장 |
| 삭제 | 사용자 요청 시 삭제, 현재 세션이면 새 세션 생성 |

### 1.2 세션 제한

- **최대 세션 수**: 5개
- **최대 활동 기록**: 10개 (FIFO)
- **자동 저장 딜레이**: 1000ms (디바운스)

### 1.3 네이밍 규칙

- 기본 이름: "새 연구"
- 첫 검색 시 자동 이름 변경 (쿼리 앞 30자)
- 중복 허용

---

## 2. 활동 유형

| 유형 | 설명 | 데이터 |
|------|------|--------|
| `search` | 검색 실행 | query, resultCount |
| `paper_selected` | 논문 선택 | paperId, title |
| `paper_excluded` | 논문 제외 | paperId, title |
| `paper_restored` | 논문 복원 | paperId, title |
| `analysis_done` | AI 분석 완료 | paperId |
| `translation_done` | 번역 완료 | paperId |
| `chat_user` | 사용자 채팅 | message (100자 제한) |
| `chat_assistant` | 어시스턴트 응답 | message (100자 제한) |
| `note_created` | 노트 생성 | name |
| `note_renamed` | 노트 이름 변경 | oldName, newName |

---

## 3. 저장소 규칙

### 3.1 키 구조

| 키 | 용도 |
|----|------|
| `moonlight_session_list` | 세션 메타데이터 목록 |
| `moonlight_session_{id}` | 개별 세션 데이터 |
| `moonlight_current_session_id` | 현재 활성 세션 ID |

### 3.2 에러 코드

| 코드 | 의미 | 사용자 메시지 |
|------|------|--------------|
| `QUOTA_EXCEEDED` | 저장 공간 부족 | "저장 공간이 부족합니다. 오래된 세션을 삭제해주세요." |
| `PARSE_ERROR` | JSON 파싱 실패 | "세션 데이터가 손상되었습니다." |
| `NOT_FOUND` | 세션 없음 | "세션을 찾을 수 없습니다." |
| `UNKNOWN` | 알 수 없는 에러 | "세션 저장에 실패했습니다." |

---

## 4. 동기화 규칙

### 4.1 탭 간 동기화

- `storage` 이벤트 리스닝으로 탭 간 변경 감지
- 현재 세션 ID와 일치하는 변경만 반영
- 삭제된 세션은 무시

### 4.2 이벤트

| 이벤트 | 발생 시점 |
|--------|----------|
| `session-updated` | 세션 저장 완료 시 |
| `storage` (브라우저) | localStorage 변경 시 |

---

## 5. 버전 관리

- 현재 버전: `1.0.0`
- 버전 필드: `session.version`
- 마이그레이션: 추후 버전 변경 시 구현

---

## 핵심 원칙 요약

1. **단일 활성 세션**: 동시에 하나의 세션만 활성화
2. **자동 저장**: 변경 시 디바운스 후 자동 저장
3. **제한된 용량**: 5개 세션, 10개 활동 기록
4. **탭 간 동기화**: storage 이벤트로 실시간 동기화
5. **에러 복구**: 파싱 실패 시 새 세션 생성

---

> **동기화 지침**: 이 문서를 수정하면 `app/features/notes/principles.ts`도 함께 수정해야 합니다.
