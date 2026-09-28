export const frameworkNodeExpress = `---
title: 프레임워크 — Node.js + Express
stack: backend
category: 프레임워크
extends: [base.md, backend.md]
---

# Node.js + Express

> \`backend.md\` 를 상속. Node 20+ LTS, Express 4.18+ 또는 5.x 전제.
> Express는 미니멀하므로 표준 규약을 팀에서 명시적으로 잡아야 한다.

## 프로젝트 구조

\`\`\`
src/
├ app.ts              미들웨어 등록 + 라우트 마운트, listen 안 함
├ server.ts           listen 호출 (테스트와 분리)
├ routes/             라우터 단위 분할
├ controllers/        요청·응답 처리
├ services/           비즈니스 로직 (HTTP 모름)
├ repositories/       데이터 접근
├ middleware/         재사용 미들웨어
├ schemas/            zod / joi 검증 스키마
└ types/
\`\`\`

- \`app.ts\` 와 \`server.ts\` 분리 — 테스트에서 \`supertest(app)\` 으로 listen 없이 사용.

## TypeScript

- \`"strict": true\`, \`"noImplicitAny": true\` 필수.
  - 근거: 이 옵션이 꺼져 있으면 타입 없는 값이 조용히 흘러다니고, 컴파일 통과가 안전을 뜻하지 않게 된다. 한 곳만 꺼도 그 지점부터 타입 안전성이 무너진다.
- \`@types/express\` 설치. Request 확장은 module augmentation:
  \`\`\`ts
  declare global {
    namespace Express {
      interface Request { user?: User; }
    }
  }
  \`\`\`

## 미들웨어 등록 순서

1. \`helmet()\` (보안 헤더)
2. \`cors({...})\` (origin 명시, \`*\` 금지)
3. \`express.json({ limit: '1mb' })\` (페이로드 제한)
4. 요청 로깅 (\`pino-http\` 권장)
5. 라우트
6. 404 핸들러
7. 에러 핸들러 (4-arg signature)

- 근거: helmet/cors는 라우트 처리 전에. 에러 핸들러는 가장 마지막. 순서가 틀리면 보안 헤더가 누락되거나 에러가 캐치되지 않는다.

## 입력 검증 — 모든 외부 입력

- params / query / body 모두 zod로 검증. 검증 안 된 입력 사용 금지.
  - 근거: Express 는 이 값들을 타입 없이 넘긴다. 검증을 건너뛰면 타입은 있다고 믿는데 런타임 값은 무엇이든 될 수 있는 상태가 된다.
- 검증 미들웨어 패턴:
  \`\`\`ts
  const validate = <T>(schema: ZodSchema<T>) =>
    (req: Request, _res: Response, next: NextFunction) => {
      const result = schema.safeParse(req.body);
      // query/params는 동일 패턴으로 schema.safeParse(req.query / req.params)
      if (!result.success) return next(new ValidationError(result.error));
      req.body = result.data;
      next();
    };
  \`\`\`
- 근거: Express는 검증 빌트인이 없음. 검증 누락이 가장 흔한 보안 사고 원인.

## 에러 핸들링 — 중앙 집중

- 비동기 라우트는 try/catch 또는 wrapper:
  \`\`\`ts
  const asyncHandler = (fn: AsyncHandler) =>
    (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
  \`\`\`
  - 근거: Express 4의 라우트 핸들러는 Promise rejection을 자동으로 catch하지 않는다. 에러 핸들러에 도달 못 하고 요청이 hang → 결국 timeout 또는 \`unhandledRejection\`. Express 5(5.0 stable)는 async 핸들러 rejection을 error 미들웨어로 자동 전달한다. 다만 기존 코드베이스 다수가 여전히 4.x이고 asyncHandler 패턴은 4/5 양쪽에서 안전하므로 명시 권장.
- 커스텀 에러 클래스 (\`AppError\` extends Error) — status / code / message.
- 4-arg 에러 핸들러에서 분기:
  \`\`\`ts
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      return res.status(err.status).json({ code: err.code, message: err.message });
    }
    req.log.error({ err }, 'unhandled');
    res.status(500).json({ code: 'INTERNAL', message: 'Internal server error' });
  });
  \`\`\`
- 스택 트레이스를 응답 본문에 넣지 마라 — 정보 노출.

## 라우터

- 도메인 단위 라우터: \`routes/users.ts\` 가 \`/users\` 마운트.
- 컨트롤러는 얇게 — 검증·서비스 호출·응답 변환만. 비즈니스 로직은 service.
- 한 라우터 파일이 200줄 넘으면 분리 검토.

## 비동기 처리

- async/await 일관. promise chain 신규 작성 금지.
  - 근거: 두 스타일이 섞이면 에러 전파 경로가 두 갈래가 된다. 한쪽에서 누락된 \`.catch\` 가 unhandled rejection 으로 프로세스를 죽인다.
- 모든 async 라우트는 \`asyncHandler\` 또는 명시적 try/catch — uncaught는 hang 또는 500.
- \`process.on('unhandledRejection')\` 등록해서 로깅 + 알람 (프로세스 죽이지 마라 in prod).

## 로깅

- \`pino\` + \`pino-http\` 표준. console.log 금지.
  - 근거: \`console.log\` 는 레벨도 구조도 요청 상관관계도 없다. 수집기에서 검색·집계 대상이 되지 못해 운영에서는 없는 것과 같다.
- 요청 ID(traceId) 미들웨어 — 모든 로그에 포함.
- 민감 정보 마스킹 (\`pino\` redact 옵션).

## 보안

- \`helmet\` 디폴트 + 인라인 스크립트·외부 리소스 도메인을 \`Content-Security-Policy\`로 명시.
- 인증 토큰은 httpOnly cookie 또는 Authorization header.
- Rate limit: \`express-rate-limit\` (또는 reverse-proxy 단에서).
- CORS origin은 환경변수로 명시. \`*\` 와 \`credentials: true\` 동시 사용 금지(스펙 위반).
  - 근거: 브라우저가 이 조합을 거부해 요청이 실패한다. 통과시키려고 origin 을 요청 헤더로 그대로 되돌려주면 사실상 모든 사이트에 자격 증명을 허용하는 것이 된다.
- SQL 직접 작성하지 마 — ORM/쿼리빌더(Prisma/Drizzle/Knex).

## 테스트

- \`supertest(app)\` 으로 HTTP 레벨 통합 테스트.
- 서비스 단위 테스트는 vitest / jest로 분리.
- DB는 testcontainers 또는 별도 테스트 인스턴스.

## 종료 (Graceful Shutdown)

- \`SIGTERM\` / \`SIGINT\` 핸들러로 server.close() + DB pool 정리.
- 진행 중 요청은 처리 완료 후 종료.

## 환경변수

- \`zod\` 로 부팅 시점에 검증. 누락이면 즉시 실패:
  \`\`\`ts
  const env = z.object({
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
  }).parse(process.env);
  \`\`\`
- \`process.env.X\` 를 코드 곳곳에서 직접 참조하지 마 — env 모듈에서 한 번만.

## AI 행동 규칙

- 라우트 작성 시 항상 zod 검증 미들웨어 통과 후 컨트롤러 진입.
- async 라우트에 try/catch 또는 \`asyncHandler\` 누락 시 즉시 수정.
- DB 쿼리에 \`req.body\` / \`req.query\` 가 raw로 들어가면 ORM 파라미터화 확인.
- 컨트롤러에서 \`res.json\` 후 \`return\` 누락 시 추가 (이중 send 방지).

## 패턴 (DO / DON'T)

### 검증 미들웨어

\`\`\`ts
const CreatePost = z.object({
  title: z.string().min(1).max(120),
  body: z.string().max(10_000),
});

router.post('/posts', validate(CreatePost), asyncHandler(async (req, res) => {
  const post = await postService.create(req.body);   // req.body는 검증된 타입
  res.status(201).json(post);
}));
\`\`\`

### Async 안전

\`\`\`ts
// DON'T — 에러 catch 안 됨
router.get('/users/:id', async (req, res) => {
  const user = await userService.get(req.params.id);
  res.json(user);
});

// DO
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.get(req.params.id);
  res.json(user);
}));
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| \`cors({ origin: '*' })\` with credentials | origin 명시 |
| 스택 트레이스 응답 본문 | 코드 + 메시지만 |
| \`console.log\` | pino |
| 검증 없이 req.body 사용 | zod safeParse |
| async에 try/catch / wrapper 누락 | \`asyncHandler\` |

## 적용 범위와 경계

이 문서는 **Express 의 미들웨어 순서·검증·에러 처리 구성**만 다룬다. 배포·프로세스 관리는 다루지 않는다.

여기서 다루지 않는 것 → 레이어 구조와 DTO 는 \`backend.md\`, URL·상태 코드는 \`api-design.md\`, 인증 정책은 \`auth.md\`, 입력 검증의 보안 기준은 \`security.md\`, 에러 분류는 \`error-handling.md\`, 로그 포맷은 \`logging.md\`.

**Express 는 안전한 기본값을 주지 않는다.** 검증·인증·에러 처리·보안 헤더는 전부 명시적으로 붙여야 하며, 이 문서에 없는 것이 자동으로 처리된다고 가정하지 마라.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **미들웨어 등록 순서** — 순서가 이긴다. 에러 핸들러는 항상 마지막, 보안·파서는 라우트보다 앞. 편의를 위해 순서를 바꾸지 않는다.
- **zod 검증 vs 타입 단언** — 검증이 이긴다. \`req.body as CreateUserDto\` 는 아무것도 보장하지 않는다.
- **중앙 에러 핸들러 vs 라우트별 try/catch** — 중앙 핸들러가 이긴다. 라우트마다 흩어진 처리에서는 응답 포맷이 갈라진다.
- **이 문서 vs \`backend.md\`** — 프레임워크 관례는 이 문서가 이기지만, 레이어 경계와 DTO 분리는 \`backend.md\` 가 이긴다.

## 자가 점검

라우트를 추가·수정한 뒤 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] \`params\` / \`query\` / \`body\` 를 zod 로 검증한 뒤 사용한다
- [ ] 미들웨어 등록 순서가 보안 → 파서 → 라우트 → 404 → 에러 핸들러다
- [ ] 에러 핸들러가 마지막에 등록돼 있고 4개 인자 시그니처다
- [ ] 비동기 라우트의 에러가 \`next(err)\` 로 전달된다 — 삼켜지지 않는다
- [ ] \`console.log\` 대신 \`pino\` 를 쓴다
- [ ] CORS origin 이 환경 변수로 명시돼 있고 \`*\` + \`credentials\` 조합이 없다
- [ ] \`helmet\` 등 보안 헤더 미들웨어가 등록돼 있다
- [ ] 에러 응답에 스택 트레이스가 없다
- [ ] Graceful shutdown 처리가 있다
`;
