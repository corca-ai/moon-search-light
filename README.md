# Paper Search - Semantic Scholar

Semantic Scholar API를 활용한 논문 검색 웹 애플리케이션입니다.

## 기능

- 키워드 기반 논문 검색
- 논문 제목, 저자, 연도, 인용 수, 초록 표시
- 다크 모드 지원
- 반응형 디자인

## 기술 스택

- Next.js 15
- TypeScript
- Tailwind CSS
- Semantic Scholar API

## 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## Vercel 배포

이 프로젝트는 Vercel에 바로 배포 가능합니다.

1. GitHub에 저장소 푸시
2. [Vercel](https://vercel.com)에 로그인
3. "Import Project" 선택
4. GitHub 저장소 선택
5. 자동으로 빌드 및 배포

또는 Vercel CLI 사용:

```bash
npm install -g vercel
vercel
```

## API 사용

이 앱은 [Semantic Scholar API](https://api.semanticscholar.org/)를 사용합니다. API 키가 필요하지 않으며, 공개 API를 사용합니다.
# moon-search-light
