export const frameworkNodeFastify = `---
title: 프레임워크 — Fastify
stack: backend
category: 프레임워크
extends: [base.md, backend.md]
---

# Fastify

> \`backend.md\` 를 상속. Fastify 4+ 전제.
> Express 대비 2~3배 처리량, 빌트인 스키마 검증·로깅·플러그인 시스템. 신규 Node.js 서버라면 Express보다 우선 검토.

## 프로젝트 구조

\`\`\`
src/
├ app.ts               Fastify 인스턴스 + 플러그인 등록
├ server.ts            listen
├ plugins/             재사용 플러그인 (fp 래핑)
├ routes/              라우트 분할 (autoload 가능)
├ schemas/             JSON Schema (또는 zod)
└ services/
\`\`\`

- \`app.ts\` 분리로 테스트(\`fastify.inject\`)에서 listen 없이 사용.

## 스키마 우선 — Fastify의 핵심 가치

- 모든 라우트는 **request/response JSON Schema 정의**:
  \`\`\`ts
  fastify.post('/users', {
    schema: {
      body: { type: 'object', properties: { email: { type: 'string', format: 'email' } }, required: ['email'] },
      response: { 201: { type: 'object', properties: { id: { type: 'string' } } } },
    },
  }, handler);
  \`\`\`
- 근거: 검증·직렬화·OpenAPI 자동화·성능 최적화가 전부 스키마에서 파생. 누락하면 Fastify를 쓸 이유의 절반이 사라진다.
- TypeBox 또는 zod + \`fastify-type-provider-zod\` 권장 — TS 타입 추론 자동.

## TypeScript

- TypeBox: 스키마 + 타입 일원화:
  \`\`\`ts
  import { Type } from '@sinclair/typebox';
  const Body = Type.Object({ email: Type.String({ format: 'email' }) });
  // Static<typeof Body> 로 타입 추출
  \`\`\`
- 또는 \`fastify-type-provider-zod\` 로 zod 사용.

## Plugin 시스템

- 모든 기능은 plugin으로 작성 — \`fastify-plugin\` (\`fp\`) 으로 래핑.
- 캡슐화: 일반 plugin은 자식 컨텍스트에만 영향, \`fp\` 로 래핑하면 부모에도 노출.
- 플러그인 등록 순서가 의미 있음 — 의존하는 플러그인을 먼저.

## 에러 핸들링

- 에러는 throw 또는 \`reply.send(err)\`.
- 글로벌 핸들러: \`fastify.setErrorHandler\`.
- 스키마 검증 실패는 자동 400 — 커스텀 메시지 원하면 \`schemaErrorFormatter\`.

## 로깅

- pino 빌트인 — 별도 설치 불필요.
- 요청별 로그에 자동 \`reqId\` (또는 traceparent 헤더 사용 \`requestIdHeader\`).
- \`logger: { level: 'info', transport: { target: 'pino-pretty' } }\` 는 개발만.

## 라우트 분할

- \`@fastify/autoload\` — 디렉토리 구조가 곧 라우트.
- 또는 명시적 register: \`fastify.register(usersRoutes, { prefix: '/users' })\`.

## 인증

- \`@fastify/jwt\` 또는 직접 plugin 작성.
- 라우트별 \`preHandler: [fastify.authenticate]\`.
- \`@fastify/auth\` 로 인증 조합 (and/or 로직).

## 보안 플러그인

- \`@fastify/helmet\` — 보안 헤더
- \`@fastify/cors\` — CORS, origin 명시
- \`@fastify/rate-limit\` — rate limiting
- \`@fastify/sensible\` — \`reply.notFound()\` 등 유틸

## OpenAPI

- \`@fastify/swagger\` + \`@fastify/swagger-ui\` — 라우트 스키마로부터 자동 spec 생성.
- TypeBox/zod 스키마가 그대로 spec.

## 테스트

- \`fastify.inject({ method, url, payload })\` — listen 없이 in-memory 요청.
- e2e도 같은 API — 별도 supertest 불필요.

## 환경 변수

- \`@fastify/env\` + JSON Schema 또는 zod로 부팅 시점 검증.
- \`fastify.config\` 로 안전 접근.

## 비동기

- 핸들러는 \`async\` 함수 — return 값이 자동 응답 직렬화.
- \`reply.send()\` 명시 호출도 가능하지만 \`async + return\` 형태가 일관적.
- 한 핸들러에서 \`reply.send\` 와 \`return\` 동시 사용 금지.

## Graceful Shutdown

- \`fastify.close()\` — 진행 중 요청 완료 후 종료.
- SIGTERM/SIGINT 핸들러 등록.

## AI 행동 규칙

- 새 라우트는 항상 schema 옵션 포함 (body / params / querystring / response).
- 스키마 없는 라우트 발견 시 즉시 추가 권고.
- 응답에 \`reply.send\` 와 \`return\` 혼용 발견 시 일관화.
- TypeBox/zod 없이 raw JSON Schema 작성 시도 시 type-safe 옵션 권고.

## 패턴 (DO / DON'T)

### 스키마 우선 라우트

\`\`\`ts
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

const users: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post('/users', {
    schema: {
      body: Type.Object({
        email: Type.String({ format: 'email' }),
        password: Type.String({ minLength: 8 }),
      }),
      response: {
        201: Type.Object({ id: Type.String() }),
      },
    },
  }, async (req, reply) => {
    const user = await usersService.create(req.body);  // body 타입 추론됨
    reply.code(201);
    return { id: user.id };
  });
};
\`\`\`

### Plugin 캡슐화

\`\`\`ts
// 부모 컨텍스트에 노출되어야 하는 디코레이터
import fp from 'fastify-plugin';

export default fp(async (fastify) => {
  fastify.decorate('db', dbClient);
});
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| schema 없는 라우트 | TypeBox/zod 스키마 |
| \`reply.send\` + \`return\` 혼용 | async 핸들러에서 return 만 |
| 직접 외부 \`process.env\` | \`@fastify/env\` + 검증 |
| Express 미들웨어 import 그대로 | Fastify plugin으로 래핑 |
| pino 외 \`console.log\` | fastify.log |
`;
