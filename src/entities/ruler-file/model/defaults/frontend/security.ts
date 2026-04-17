export const frontendSecurity = `# Frontend Security

> 프론트엔드 보안 규칙이다.

## 입력 값 처리

- 사용자 입력은 **항상 검증** (클라이언트 + 서버 양쪽).
- \`dangerouslySetInnerHTML\`은 **원칙적 금지**. 불가피하면 DOMPurify 등으로 새니타이즈.
- URL 파라미터·쿼리스트링 값은 사용 전 **타입/범위 검증**.

## 민감 정보

- API 키·시크릿·토큰을 **코드에 하드코딩 금지**.
- \`.env\`는 커밋 금지 (\`.gitignore\` 필수).
- 클라이언트 노출 env (\`VITE_*\`, \`NEXT_PUBLIC_*\`)에 민감 정보 금지.

## 인증 / 인가

- 인증 토큰은 **httpOnly 쿠키** 우선 (localStorage 저장 지양).
- 권한 체크는 **서버에서도 반드시** 수행 (프론트 단독 의존 금지).
- API 요청 시 인증 헤더는 interceptor 레벨에서 처리.

## 의존성

- 새 패키지 추가 시 다운로드 수, 마지막 업데이트, 알려진 취약점 확인.
- \`npm audit\` 경고를 무시하지 않는다.

## AI 행동 규칙

- 코드에 민감 정보가 포함되면 **즉시 경고**.
- 외부 입력값을 그대로 렌더링하면 XSS 위험 알림.
- \`dangerouslySetInnerHTML\` 사용 시 새니타이즈 여부 확인.

## 금지 패턴

- \`eval\`, \`Function\` 생성자
- 동적 \`script\` 태그 주입 (없이는 불가피한 경우 CSP 검토)
- \`localStorage\`에 토큰 저장 (XSS 취약)
`;
