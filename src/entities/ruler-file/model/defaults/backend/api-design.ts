export const backendApiDesign = `---
title: REST API 설계
stack: backend
category: 설계
extends: [base.md, backend.md]
---

# REST API Design

> \`base.md\`, \`backend.md\`를 상속한다. RESTful API 설계 규칙이다.

## URL 네이밍

- 리소스는 **명사, 복수형**: \`/users\`, \`/orders\`.
- 계층 관계: \`/users/{id}/orders\`.
- 동사는 **HTTP 메서드**로 표현 — URL에 동사 금지.
  - 근거: \`POST /getUser\` 같은 URL은 메서드 의미(POST = 생성)와 충돌. 캐싱·로그 분석·라우팅이 모두 메서드 가정에 기반 — 동사 URL은 그 가정을 깨뜨림.
- 소문자 + 하이픈: \`/user-profiles\` (언더스코어 금지).
  - 근거: 일부 HTTP 프록시는 언더스코어를 도메인 명에서 거부(서브도메인 RFC 위반). 일관성을 위해 path에도 하이픈으로 통일.

## HTTP 메서드

| 메서드 | 용도 | 멱등 |
|--------|------|:----:|
| GET | 조회 | O |
| POST | 생성 / 커맨드 | X |
| PUT | 전체 교체 | O |
| PATCH | 부분 수정 | X |
| DELETE | 삭제 | O |

## 상태 코드

| 코드 | 의미 |
|------|------|
| 200 | 성공 (본문 있음) |
| 201 | 생성 성공 |
| 204 | 성공 (본문 없음) |
| 400 | 잘못된 요청 (검증 실패) |
| 401 | 미인증 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 409 | 충돌 (중복 등) |
| 422 | 처리 불가 (비즈니스 규칙) |
| 500 | 서버 오류 |

## 페이지네이션

- 커서 기반을 기본으로 한다 (\`?cursor=...&limit=20\`).
  - 근거: 오프셋 기반(\`?page=N\`)은 큰 데이터셋에서 \`OFFSET 100000\` 같은 쿼리가 풀스캔. 또 데이터가 추가/삭제되면 페이지 경계가 흔들려 *같은 행이 중복으로 나오거나 누락*.
- 오프셋 기반은 소규모 데이터에만.
- 응답에 \`nextCursor\` 포함.

## 버저닝

- URL 버전(\`/v1/users\`) 또는 헤더(\`Accept: application/vnd.company.v1+json\`).
- Breaking change는 **새 버전**으로 — 기존 버전은 **명시된 deprecation 기한까지 유지**(권장 최소 3~6개월). 기한과 종료일을 CHANGELOG·응답 헤더(Deprecation, Sunset)에 명시.

## 에러 응답 포맷

\`\`\`json
{
  "code": "USER_NOT_FOUND",
  "message": "사용자를 찾을 수 없습니다",
  "details": [{"field": "userId", "reason": "not_found"}]
}
\`\`\`

## AI 행동 규칙

- 새 엔드포인트 추가 시 **OpenAPI 스펙(또는 schema 정의)을 같은 PR에** 갱신. 별도 PR로 미루지 마라 — 코드와 스펙이 어긋나는 시작점.
- 에러 응답은 **표준 포맷**을 벗어나지 않는다. \`{ success: false, error: "..." }\` 같은 200+에러 패턴 발견 시 HTTP 상태 + 표준 포맷으로 즉시 교체.
- URL에 동사(\`/getX\`, \`/createY\`) 발견 시 즉시 HTTP 메서드로 변경.
- breaking change(필드 삭제, 타입 변경) 가 필요한 경우 — \`/v2\` 새 버전 + 기존 버전 유지 기한 명시. in-place 변경 금지.
  - 근거: 이미 배포된 클라이언트는 갱신을 강제할 수 없다. in-place 로 바꾸면 구버전 앱이 그 순간 전부 깨지고, 되돌릴 방법이 배포 롤백밖에 없다.

## 패턴 (DO / DON'T)

### URL 설계

\`\`\`
# DON'T
POST /getUser           { "id": 1 }
POST /createOrder       { ... }
GET  /user_profiles/1

# DO
GET    /users/1
POST   /orders
GET    /user-profiles/1
\`\`\`

### 에러 응답

\`\`\`
# DON'T — 200으로 에러 래핑
HTTP/1.1 200 OK
{ "success": false, "error": "not found" }

# DO — HTTP 상태 + 표준 포맷
HTTP/1.1 404 Not Found
{ "code": "USER_NOT_FOUND", "message": "사용자를 찾을 수 없습니다" }
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| URL에 동사 (\`/getUser\`) | 명사 + HTTP 메서드 |
| 단일 리소스 URL에 배열 반환 | 단일 리소스는 객체, 목록은 \`/resources\` |
| 오프셋 페이지네이션 기본 | 커서 기반 (\`nextCursor\`) |
| Breaking change in-place | 새 버전 (\`/v2/...\`) |

## 적용 범위와 경계

이 문서는 **REST HTTP API 의 형태**만 다룬다. GraphQL·gRPC·WebSocket 에는 적용하지 않는다 — 해당 프로토콜을 쓴다면 유저에게 별도 규칙을 요청한다.

여기서 다루지 않는 것 → 인증 방식과 토큰은 \`auth.md\`, 에러 분류 체계와 재시도는 \`error-handling.md\`, 레이어 구조는 \`backend.md\`, 응답 캐시 헤더 전략은 \`caching.md\`.

이 문서는 **엔드포인트를 설계해도 되는지 판단하지 않는다.** 어떤 리소스를 노출할지는 제품 결정이다. 새 리소스를 임의로 만들지 말고 유저가 요청한 범위만 구현한다.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **기존 API 의 관례 vs 이 문서** — 기존 API 가 이긴다. 한 서비스 안에 두 가지 스타일이 섞이는 것이 규칙 위반보다 나쁘다. 불일치를 발견하면 유저에게 보고하고 일괄 변경 여부를 확인한다.
- **호환성 유지 vs 규칙 준수** — 호환성이 이긴다. 이미 배포된 엔드포인트를 규칙에 맞추려고 in-place 로 바꾸지 마라. 새 버전으로 간다.
- **표준 상태 코드 vs 클라이언트 편의** — 표준이 이긴다. 에러를 200 으로 감싸달라는 요청이 오면 이유를 설명하고 유저 판단을 받는다.

## 자가 점검

엔드포인트를 추가·수정한 뒤 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] URL 이 복수형 명사이고 동사가 들어 있지 않다
- [ ] URL 이 소문자 + 하이픈이다 (언더스코어 없음)
- [ ] HTTP 메서드가 멱등성 규칙에 맞다 (PUT/DELETE 는 멱등)
- [ ] 상태 코드가 표의 정의와 일치한다 — 에러를 200 으로 감싸지 않았다
- [ ] 에러 응답이 표준 포맷(code, message, details)을 따른다
- [ ] 목록 엔드포인트에 커서 페이지네이션과 \`nextCursor\` 가 있다
- [ ] 같은 PR 에서 OpenAPI 스펙을 갱신했다
- [ ] Breaking change 라면 새 버전으로 만들고 기존 버전의 종료 기한을 명시했다
`;
