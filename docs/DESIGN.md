# Moon Search Light - 디자인 가이드

## 1. 디자인 원칙

- **전문성**: 학술 연구 도구에 적합한 절제된 디자인, 이모지 대신 SVG 아이콘 사용
- **일관성**: Slate 색상 팔레트, 통일된 라운드 코너, 4px 단위 간격 체계
- **접근성**: 충분한 색상 대비, 다크 모드 지원, 명확한 포커스 상태

---

## 2. 타이포그래피

- **폰트**: Pretendard Variable (CDN)
- **크기**: 제목 18px, 본문 14px, 캡션 12px
- **굵기**: Regular(본문), Medium(라벨), Semibold(제목)

---

## 3. 색상 시스템

**Slate 팔레트 기반**

| 용도 | 라이트 | 다크 |
|------|--------|------|
| 배경 | slate-50~200 | slate-700~900 |
| 텍스트 | slate-500~900 | slate-100~500 |
| 테두리 | slate-200~300 | slate-700~800 |
| 에러 | red-600 | red-400 |

---

## 4. 아이콘

- SVG 기반, stroke 스타일, strokeWidth 1.5
- 크기: 16px (w-4) 또는 20px (w-5)
- 주요 아이콘: Moon(로고), Folder(노트), Search, Plus, Star, X, Download

---

## 5. 컴포넌트

- **버튼**: primary(dark bg), secondary(border), ghost, icon
- **카드**: 흰색 배경, 테두리, 그림자, rounded-lg
- **입력**: 테두리, 포커스 링, placeholder 색상
- **태그**: slate 배경, 테두리, 작은 텍스트

---

## 6. 다크 모드

- Tailwind `dark:` 프리픽스 사용
- 시스템 설정 자동 감지
- 배경/텍스트 반전, 테두리는 동일 계열 유지
