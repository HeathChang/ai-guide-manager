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

- 인증 토큰은 **httpOnly + Secure + SameSite 쿠키**로 저장한다. \`localStorage\` / \`sessionStorage\` 저장 금지.
  - 근거: JS 로 읽을 수 있는 저장소에 둔 토큰은 XSS 가 한 번만 성공해도 통째로 유출된다. httpOnly 쿠키는 JS 에서 읽히지 않아 XSS 가 나도 토큰 자체는 남는다.
  - 예외: 서드파티 SDK 가 헤더 전달만 지원해 쿠키를 못 쓰는 경우. 이때는 유저에게 제약을 보고하고 승인을 받은 뒤 메모리(모듈 변수)에만 보관한다 — 그래도 \`localStorage\` 는 쓰지 않는다.
- 권한 체크는 **서버에서도 반드시** 수행 (프론트 단독 의존 금지).
  - 근거: 프론트의 권한 체크는 UI 를 정리해줄 뿐 방어가 아니다. 공격자는 브라우저를 거치지 않고 API 를 직접 호출한다. 프론트에만 있는 체크는 사실상 없는 체크다.
- API 요청 시 인증 헤더는 interceptor 레벨에서 처리.

## 의존성

- 새 패키지 추가 시 다운로드 수, 마지막 업데이트, 알려진 취약점 확인.
- \`npm audit\` 경고를 무시하지 않는다. 고칠 수 없으면 이유와 영향 범위를 유저에게 보고한다.
  - 근거: 무시한 경고는 다음 사람에게 "이미 검토된 것"으로 보인다. 아무도 다시 안 보는 사이 알려진 취약점이 릴리스에 실려 나간다.

## AI 행동 규칙

- 정규식 \`[A-Za-z0-9_-]{20,}\` 형태의 문자열 리터럴 발견 시 **시크릿 의심**, 즉시 사용자에게 확인.
- 외부 입력값을 그대로 렌더링 (\`{userInput}\`이 \`<div>\` 자식) 하기 전 — XSS 검토. React 기본 escape에 의존하더라도 한 번 명시.
- \`dangerouslySetInnerHTML\` 사용 시 새니타이즈 라이브러리 호출 없이는 코드 작성 금지.
  - 근거: 새니타이즈를 "나중에 추가"한 사례는 거의 없다. 같은 커밋에 없으면 그대로 배포된다.
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

## 적용 범위와 경계

이 문서는 **브라우저에서 실행되는 코드의 보안**만 다룬다. 서버 측 방어는 다루지 않는다 — 그쪽은 백엔드 룰셋의 \`security.md\` 와 \`auth.md\` 가 담당한다.

여기서 다루지 않는 것 → 인증 플로우 설계와 토큰 발급은 백엔드, 의존성 취약점 CI 게이트는 \`git.md\`, 입력 검증 라이브러리 선택은 프로젝트 결정.

**프론트엔드 보안은 방어선이 아니다.** 이 문서의 규칙을 모두 지켜도 서버 검증 없이는 아무것도 막지 못한다. 프론트 체크만으로 "보안 처리 완료"라고 보고하지 마라.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **보안 vs 편의성·개발 속도** — 보안이 이긴다. "일단 \`localStorage\` 에 넣고 나중에 고치자"는 선택지가 아니다.
- **보안 vs 라이브러리 기본 동작** — 보안이 이긴다. 라이브러리가 토큰을 \`localStorage\` 에 넣는 게 기본이면, 설정을 바꾸거나 유저에게 제약을 보고한다.
- **이 문서 vs 백엔드 \`security.md\`** — 같은 주제라면 백엔드 쪽이 이긴다. 실제 강제는 서버에서 일어나기 때문이다.
- **판단이 갈릴 때** — 더 막는 쪽을 택한다. 막아서 생기는 비용은 되돌릴 수 있지만 뚫려서 생기는 비용은 못 되돌린다.

## 자가 점검

코드를 제출하기 전 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] \`dangerouslySetInnerHTML\` 을 추가하지 않았다 — 썼다면 같은 줄에 새니타이즈 호출이 있다
- [ ] 토큰·API 키·시크릿을 코드에 하드코딩하지 않았다
- [ ] \`VITE_*\` / \`NEXT_PUBLIC_*\` 환경 변수에 민감 정보를 넣지 않았다
- [ ] 인증 토큰을 \`localStorage\` / \`sessionStorage\` 에 저장하지 않았다
- [ ] URL 파라미터·쿼리스트링 값을 검증 없이 조회·리다이렉트에 쓰지 않았다
- [ ] 새로 추가한 사용자 입력에 클라이언트 검증이 있고, 서버 검증도 있다고 확인했다
- [ ] \`eval\` / \`Function\` 생성자 / 동적 \`script\` 주입이 없다
- [ ] 새 패키지를 추가했다면 취약점과 관리 상태를 확인했다
`;
