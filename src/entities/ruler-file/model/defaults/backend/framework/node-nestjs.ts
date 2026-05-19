export const frameworkNodeNestjs = `---
title: 프레임워크 — NestJS
stack: backend
category: 프레임워크
extends: [base.md, backend.md]
---

# NestJS

> \`backend.md\` 를 상속. NestJS 10+ 전제. TypeScript 우선, Angular 스타일 DI 컨테이너 기반.
> Express(또는 Fastify)를 어댑터로 사용 — Express 자체 API 직접 호출은 지양하고 Nest의 추상 사용.

## 모듈 구조 — Feature 단위

\`\`\`
src/
├ main.ts
├ app.module.ts
└ users/
   ├ users.module.ts
   ├ users.controller.ts
   ├ users.service.ts
   ├ dto/
   │  ├ create-user.dto.ts
   │  └ update-user.dto.ts
   ├ entities/
   └ users.controller.spec.ts
\`\`\`

- **한 도메인 = 한 모듈**. AppModule은 feature module만 import.
- 횡단 관심사(인증, 로깅 등)는 별도 모듈 + \`@Global()\` 신중히.

## DTO + Validation

- **DTO는 class** (interface 아님) — class-validator 데코레이터 사용:
  \`\`\`ts
  export class CreateUserDto {
    @IsEmail() email!: string;
    @MinLength(8) password!: string;
    @IsOptional() @IsString() name?: string;
  }
  \`\`\`
- 글로벌 \`ValidationPipe\` 등록 + \`whitelist: true, forbidNonWhitelisted: true\`:
  - 근거: whitelist는 정의되지 않은 필드 제거, forbidNonWhitelisted는 그 자체로 거부. mass assignment 방어.
- 또는 zod + \`nestjs-zod\` — 팀이 zod에 익숙하면 권장.

## Controller

- 얇게. 비즈니스 로직 금지. 검증·DI·HTTP 응답 변환만.
- 데코레이터로 라우트 정의: \`@Get(':id')\`, \`@Post()\`.
- 응답 직렬화는 ClassSerializerInterceptor + \`@Expose() / @Exclude()\` 또는 직접 DTO 매핑.

## Service

- 비즈니스 로직 위치. 다른 서비스 의존성 주입.
- HTTP 개념(Request, Response)을 service에서 import 금지 — 테스트와 재사용에 해.
- 한 메서드 = 한 책임.

## Module 의존성

- \`providers\` 에 서비스 등록, \`exports\` 로 다른 모듈에 노출.
- 순환 의존성 발생 시 \`forwardRef\` 가능하지만 **설계 결함 신호** — 경계 재검토.
- Dynamic Module (\`forRoot\`, \`forRootAsync\`) 은 라이브러리 패키지에만.

## Pipe / Guard / Interceptor / Filter

| 단계 | 용도 |
|------|------|
| Pipe | 입력 변환/검증 (\`ValidationPipe\`, \`ParseIntPipe\`) |
| Guard | 인증/인가 (canActivate) |
| Interceptor | 응답 변환, 로깅, 캐싱, timeout |
| ExceptionFilter | 에러 → HTTP 응답 매핑 |

- 글로벌 적용은 \`app.useGlobalGuards(...)\` 또는 \`APP_GUARD\` provider — 각각 다른 시멘틱.
- 컨트롤러 단위 적용은 데코레이터 (\`@UseGuards(JwtAuthGuard)\`).

## 인증 — 표준 패턴

- Passport 통합 (\`@nestjs/passport\`) 또는 직접 JWT.
- Strategy 클래스 + Guard 조합:
  \`\`\`ts
  @Injectable()
  export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(config: ConfigService) {
      super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: config.getOrThrow('JWT_SECRET'),
      });
    }
    async validate(payload: JwtPayload) { return { id: payload.sub }; }
  }
  \`\`\`
- 인가는 \`RolesGuard\` 등 별도 — 인증과 분리.

## 환경 변수 — ConfigModule

- \`@nestjs/config\` + zod 검증:
  \`\`\`ts
  ConfigModule.forRoot({
    isGlobal: true,
    validate: (raw) => envSchema.parse(raw),
  });
  \`\`\`
- 서비스에서 \`ConfigService\` 주입 — \`process.env\` 직접 참조 금지.
- \`getOrThrow\` 사용 — 누락 키는 부팅 실패가 안전.

## 데이터베이스

- ORM: **Prisma** (강력 추천) 또는 TypeORM.
- TypeORM 사용 시 active record vs data mapper 선택을 팀에서 통일.
- 마이그레이션은 코드와 함께 PR.
- N+1 방지: relation eager / explicit join.

## 비동기 / 에러

- async/await + 글로벌 \`HttpExceptionFilter\`.
- 도메인 에러는 커스텀 클래스 → 필터에서 HTTP status로 변환.
- 스택 트레이스 응답 노출 금지.

## 테스트

- \`@nestjs/testing\` 의 \`Test.createTestingModule\`.
- 단위 테스트는 의존성 mock provider.
- e2e는 \`supertest(app.getHttpServer())\`.
- 한 도메인 모듈은 단독으로 부팅 가능해야 함 (테스트 용이성).

## 로깅 / 옵저버빌리티

- \`@nestjs/common\` 기본 Logger 대신 \`pino\` (\`nestjs-pino\`) 권장 — JSON 로그.
- traceId 미들웨어 + AsyncLocalStorage 로 모든 로그에 자동 포함.

## OpenAPI

- \`@nestjs/swagger\` — DTO에 \`@ApiProperty()\` 명시.
- 자동 생성 spec을 docs 엔드포인트에 노출.
- spec을 코드와 함께 PR 리뷰.

## AI 행동 규칙

- 컨트롤러에 비즈니스 로직 추가 시도 → service로 추출 권고.
- DTO interface 사용 시 → class + class-validator로 교체 (또는 nestjs-zod).
- \`process.env\` 직접 참조 → ConfigService.
- 순환 의존성 \`forwardRef\` 사용 시 모듈 경계 재검토.
- 글로벌 ValidationPipe 누락 시 즉시 \`main.ts\` 에 추가.

## 패턴 (DO / DON'T)

### 글로벌 ValidationPipe

\`\`\`ts
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
\`\`\`

### Service 분리

\`\`\`ts
// DON'T — Controller에 비즈니스 로직
@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}
  @Post()
  async create(@Body() dto: CreateUserDto) {
    const hash = await argon2.hash(dto.password);
    return this.prisma.user.create({ data: { email: dto.email, hash } });
  }
}

// DO
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}
  @Post()
  create(@Body() dto: CreateUserDto) { return this.users.create(dto); }
}
\`\`\`

### Config 안전

\`\`\`ts
// DON'T
const secret = process.env.JWT_SECRET;

// DO
const secret = configService.getOrThrow<string>('JWT_SECRET');
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| Controller에 비즈니스 로직 | Service로 위임 |
| interface DTO | class + validator |
| Request/Response를 service로 import | DI + 순수 service |
| \`process.env\` 직접 | ConfigService |
| 순환 의존 forwardRef 남발 | 모듈 경계 재설계 |
`;
