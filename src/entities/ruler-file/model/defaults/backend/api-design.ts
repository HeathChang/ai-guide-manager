export const backendApiDesign = `# REST API Design

> RESTful API 설계 규칙이다.

## URL 네이밍

- 리소스는 **명사, 복수형**: \`/users\`, \`/orders\`.
- 계층 관계: \`/users/{id}/orders\`.
- 동사는 **HTTP 메서드**로 표현 — URL에 동사 금지.
- 소문자 + 하이픈: \`/user-profiles\` (언더스코어 금지).

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

- 새 엔드포인트 추가 시 위 규칙을 적용하고, OpenAPI 스펙을 함께 갱신.
- 에러 응답은 **표준 포맷**을 벗어나지 않는다.

## 금지 패턴

- URL에 동사 (\`/getUser\`, \`/createOrder\`)
- 200으로 에러 응답
- 단일 리소스 URL에 배열 반환
`;
