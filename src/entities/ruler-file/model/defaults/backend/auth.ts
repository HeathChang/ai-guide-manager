export const backendAuth = `---
title: 인증/인가
stack: backend
category: 인증/인가
extends: [base.md, backend.md]
---

# Auth (인증 / 인가)

> \`base.md\`, \`backend.md\`를 상속한다. 인증·인가 설계 규칙이다.

## 인증 방식

| 방식 | 용도 |
|------|------|
| 세션 쿠키 | BFF / 같은 도메인 웹 |
| JWT (short-lived) + Refresh | 분리된 클라이언트, 모바일 |
| OAuth 2.0 / OIDC | 외부 ID 위임 |
| API Key | 서버 대 서버 |

- 토큰은 **httpOnly + Secure + SameSite=Lax/Strict** 쿠키 우선.
  - 근거: localStorage / JS 접근 가능한 저장소는 XSS 한 번에 전부 탈취. httpOnly는 JS에서 읽을 수 없어 XSS 영향 차단. SameSite는 CSRF 방어.
- Access token TTL은 **짧게** (5~15분), Refresh는 **Rotation** 적용.
  - 근거: Access 토큰이 유출돼도 짧은 TTL이면 피해 시간 제한. Refresh rotation은 *재사용 감지*가 핵심 — 옛 refresh가 재사용되면 토큰 탈취 신호 → 전 세션 무효화.

## 인가 모델

- **RBAC**: 역할(admin, editor) 기반 — 조직 단순할 때.
- **ABAC**: 속성(소유자, 부서) 기반 — 세밀한 정책 필요할 때.
- 정책은 **서버에서 중앙집중 평가** (\`authorize(user, action, resource)\`).

## 토큰 보안

- 서명은 **RS256/EdDSA** 우선 (대칭키 HS256는 키 공유 리스크).
- Refresh token은 **1회용**, 사용 즉시 rotation + 재사용 감지.
- 로그아웃 무효화 전략:
  - Access는 **짧은 TTL**로 자연 소멸.
  - Refresh는 **서버 blacklist / allow-list**로 즉시 무효화.

## 보안 헤더

- \`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload\`
- \`X-Content-Type-Options: nosniff\`
- \`X-Frame-Options: DENY\` (또는 CSP \`frame-ancestors 'none'\`)
- \`Content-Security-Policy\` 는 최소 \`default-src 'self'\` 에서 시작해 점진 강화.
- \`X-Frame-Options\` 는 구형 브라우저 호환용 폴백이고, CSP \`frame-ancestors\` 가 우선 적용된다 — 둘을 함께 보내되 정책은 \`frame-ancestors\` 기준으로 맞춘다.

## AI 행동 규칙

- 권한 체크는 **항상 서버에서** — 클라이언트 단독 의존 금지. \`if (user.role === 'admin')\` 가 *프론트만* 있고 서버 검증 없으면 즉시 서버 가드 추가.
- 민감 작업(비밀번호 변경, 결제 정보 수정, 계정 삭제)은 **재인증** 요구 — 기존 세션만으로 진행 금지.
- 인증 실패 메시지는 **통합**한다 (\`이메일 없음\` vs \`비밀번호 틀림\` 구분 노출 금지).
  - 근거: 구분된 메시지는 *계정 enumeration* 공격에 노출 — 공격자가 어떤 이메일이 존재하는지 알아낸다.
- \`crypto.createHash('md5'|'sha1')\` 같은 약한 해시를 비밀번호에 사용 시도 시 즉시 Argon2id로 교체.

## 패턴 (DO / DON'T)

### 비밀번호 해시

\`\`\`ts
// DON'T — 약한 해시, 솔트 없음
const hash = crypto.createHash('sha1').update(password).digest('hex');

// DO — Argon2id (또는 bcrypt cost≥12)
import { hash } from '@node-rs/argon2';
const hashed = await hash(password, { memoryCost: 19456, timeCost: 2 });
\`\`\`

### 인증 실패 메시지

\`\`\`ts
// DON'T — 계정 존재 여부 누설
if (!user) throw new Error('이메일이 존재하지 않습니다');
if (!valid) throw new Error('비밀번호가 틀렸습니다');

// DO — 통합 메시지
if (!user || !valid) throw new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다');
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| 토큰을 URL 쿼리스트링에 포함 | Authorization 헤더 / httpOnly 쿠키 |
| 평문 비밀번호 / MD5 / SHA1 | Argon2id / bcrypt |
| 관리자 체크를 프론트 단독 | 서버 정책 평가 (\`authorize()\`) |
| 장기 Access Token | 짧은 TTL + Refresh Rotation |

## 적용 범위와 경계

이 문서는 **인증 방식, 토큰 수명, 인가 모델, 보안 헤더**만 다룬다. 특정 IdP(Auth0, Keycloak, Cognito) 의 설정 절차는 다루지 않는다.

여기서 다루지 않는 것 → 입력 검증·인젝션·Rate Limit 은 \`security.md\`, 인증 실패 응답 코드는 \`api-design.md\`, 세션 저장소 캐싱은 \`caching.md\`, 인증 로그 마스킹은 \`logging.md\`.

**이 문서의 규칙을 지켜도 인가 로직 자체가 옳다는 보장은 없다.** "누가 무엇에 접근할 수 있는가"는 제품 결정이다. 정책이 명시되지 않았으면 추측하지 말고 유저에게 묻는다.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **보안 vs 사용자 편의** — 보안이 이긴다. Access token TTL 을 늘려 재로그인을 줄여달라는 요청은 Refresh rotation 으로 푼다.
- **보안 vs 기존 코드와의 일관성** — 보안이 이긴다. 기존 코드가 MD5 를 쓰고 있어도 새 코드는 Argon2id 로 간다. 그리고 기존 코드의 문제를 유저에게 보고한다.
- **인가 체크 위치** — 서버가 이긴다. 프론트에 같은 체크가 있어도 서버 가드를 생략하지 않는다.
- **판단이 갈릴 때** — 더 막는 쪽, 더 짧은 TTL, 더 좁은 권한을 택한다. 권한은 나중에 넓히기 쉽지만 유출은 되돌릴 수 없다.

## 자가 점검

인증·인가 코드를 추가·수정한 뒤 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] 토큰을 httpOnly + Secure + SameSite 쿠키로 다룬다 — URL 쿼리스트링에 넣지 않았다
- [ ] Access token TTL 이 15분 이하이고 Refresh 에 rotation 과 재사용 감지가 있다
- [ ] 비밀번호 해시가 Argon2id 또는 bcrypt 다 — MD5/SHA1 이 아니다
- [ ] 새 엔드포인트에 인증 미들웨어와 인가 가드가 모두 붙어 있다
- [ ] 인가 판정이 서버의 중앙 정책 함수를 거친다 — 핸들러 안에 흩어진 역할 비교가 아니다
- [ ] 인증 실패 메시지가 통합돼 있다 — 계정 존재 여부를 구분해서 알려주지 않는다
- [ ] 민감 작업(비밀번호 변경, 결제 정보 수정, 계정 삭제)에 재인증이 있다
- [ ] 보안 헤더(HSTS, nosniff, CSP \`frame-ancestors\`)가 응답에 설정돼 있다
`;
