export const frontendSecurity = `---
title: 보안
stack: frontend
category: 보안
extends: [base.md]
---

# Frontend Security

> \`base.md\`를 상속한다. 프론트엔드 보안 규칙이다.

## 입력 값 처리

- 사용자 입력은 **항상 검증** (클라이언트 + 서버 양쪽).
  - 근거: 클라이언트 검증만으로는 공격자가 DevTools / 직접 HTTP 요청으로 우회 가능. 서버 검증만으론 UX(즉각 피드백) 손실. 둘 다 필수.
- \`dangerouslySetInnerHTML\`은 **원칙적 금지**. 불가피하면 DOMPurify 등으로 새니타이즈.
  - 근거: React가 자동 escape 하는 안전망을 의도적으로 끄는 API. 외부 입력이 한 번이라도 흘러들어가면 XSS 가능. *왜 이걸 쓰는지* 주석으로 명시 못 하면 사용 금지.
- URL 파라미터·쿼리스트링 값은 사용 전 **타입/범위 검증**.
  - 근거: \`useParams\` / \`useSearchParams\` 결과는 \`string\` — 사용자가 임의 값 주입 가능. DB 조회/리다이렉트에 raw로 쓰면 SQL injection / open redirect.

## 민감 정보

- API 키·시크릿·토큰을 **코드에 하드코딩 금지**.
  - 근거: git history는 영원. 한 번 push 된 시크릿은 즉시 무효화 + 재발급 필요 — 삭제 commit 해도 history엔 남는다.
- \`.env\`는 커밋 금지 (\`.gitignore\` 필수).
- 클라이언트 노출 env (\`VITE_*\`, \`NEXT_PUBLIC_*\`)에 민감 정보 금지.
  - 근거: 이 prefix는 빌드 시점에 클라이언트 JS 번들에 **인라인**된다. 브라우저 DevTools에서 raw 문자열로 검색 가능 = 누구나 조회.

## 인증 / 인가

- 인증 토큰은 **httpOnly 쿠키** 우선 (localStorage 저장 지양).
- 권한 체크는 **서버에서도 반드시** 수행 (프론트 단독 의존 금지).
- API 요청 시 인증 헤더는 interceptor 레벨에서 처리.

## 의존성

- 새 패키지 추가 시 다운로드 수, 마지막 업데이트, 알려진 취약점 확인.
- \`npm audit\` 경고를 무시하지 않는다.

## AI 행동 규칙

- 정규식 \`[A-Za-z0-9_-]{20,}\` 형태의 문자열 리터럴 발견 시 **시크릿 의심**, 즉시 사용자에게 확인.
- 외부 입력값을 그대로 렌더링 (\`{userInput}\`이 \`<div>\` 자식) 하기 전 — XSS 검토. React 기본 escape에 의존하더라도 한 번 명시.
- \`dangerouslySetInnerHTML\` 사용 시 새니타이즈 라이브러리 호출 없이는 코드 작성 금지.
- \`localStorage.setItem('token'\` / \`localStorage.setItem('jwt'\` 패턴 발견 시 즉시 httpOnly 쿠키로 변경 권고.

## 패턴 (DO / DON'T)

### dangerouslySetInnerHTML

\`\`\`tsx
// DON'T — 외부 입력 그대로 주입
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// DO — 가능하면 텍스트로, 불가피하면 새니타이즈
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
\`\`\`

### 토큰 저장

\`\`\`ts
// DON'T — XSS로 탈취 가능
localStorage.setItem('token', token);

// DO — 서버에서 httpOnly + Secure + SameSite 쿠키로 발급
// 클라이언트 코드에는 토큰 접근 자체가 필요 없음
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| \`eval\`, \`Function\` 생성자 | 정적 파싱 (\`JSON.parse\`, 라이브러리) |
| 동적 \`script\` 태그 주입 | 빌드 타임 의존성 + CSP |
| 하드코딩된 API 키 | 환경 변수 + 서버 프록시 |
`;
