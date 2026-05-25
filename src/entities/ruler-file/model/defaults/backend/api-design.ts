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
- Breaking change는 **새 버전**으로 — 기존 버전은 최소 N개월 유지.

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
`;
