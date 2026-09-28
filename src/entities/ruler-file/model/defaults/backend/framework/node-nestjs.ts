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
  - 근거: Controller 에 로직이 들어가면 그 로직은 HTTP 요청 없이는 실행할 수 없다. 스케줄러·큐 워커·CLI 에서 같은 규칙을 재사용하지 못하고 복사된다.
- 데코레이터로 라우트 정의: \`@Get(':id')\`, \`@Post()\`.
- 응답 직렬화는 ClassSerializerInterceptor + \`@Expose() / @Exclude()\` 또는 직접 DTO 매핑.

## Service

- 비즈니스 로직 위치. 다른 서비스 의존성 주입.
- HTTP 개념(Request, Response)을 service에서 import 금지 — 테스트와 재사용에 해.
  - 근거: service 가 HTTP 에 묶이면 스케줄러·큐 워커에서 재사용할 수 없고, 단위 테스트마다 가짜 Request 객체를 만들어야 한다.
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

- 글로벌 적용은 \`app.useGlobalGuards(...)\` 또는 \`APP_GUARD\` provider — 각각 다른 시멘틱. \`APP_GUARD\` provider는 DI가 동작해 다른 서비스를 주입할 수 있고, \`app.useGlobalGuards(new X())\` 는 인스턴스를 직접 생성하므로 의존성 주입이 안 된다 — 주입이 필요하면 \`APP_GUARD\` 사용.
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
  // 전제: const envSchema = z.object({ ... }) 로 환경 변수 스키마를 미리 정의
  ConfigModule.forRoot({
    isGlobal: true,
    // validate의 반환값이 ConfigService의 소스가 된다 — 반드시 파싱된 객체를 return
    validate: (raw) => envSchema.parse(raw),
  });
  \`\`\`
- 서비스에서 \`ConfigService\` 주입 — \`process.env\` 직접 참조 금지.
  - 근거: ConfigService는 부팅 시점에 검증된 값을 캐시. 테스트에서 mock provider로 교체 가능. \`process.env\` 직접 참조는 테스트가 환경에 의존하고, 값 변환(string→number) 검증 누락.
- \`getOrThrow\` 사용 — 누락 키는 부팅 실패가 안전.
  - 근거: \`get\` 는 undefined 반환 → 라우트 처리 중 NPE. \`getOrThrow\` 는 부팅 시점에 발견 → 배포 차단.

## 데이터베이스

- ORM: **Prisma** (강력 추천) 또는 TypeORM.
- TypeORM 사용 시 active record vs data mapper 선택을 팀에서 통일.
- 마이그레이션은 코드와 함께 PR.
- N+1 방지: relation eager / explicit join.

## 비동기 / 에러

- async/await + 글로벌 \`HttpExceptionFilter\`.
- 도메인 에러는 커스텀 클래스 → 필터에서 HTTP status로 변환.
- 스택 트레이스 응답 노출 금지.
  - 근거: 내부 경로·라이브러리 버전·쿼리 구조가 그대로 드러난다. 공격자에게는 정찰 정보이고 사용자에게는 아무 쓸모가 없다.

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

## 적용 범위와 경계

이 문서는 **NestJS 의 모듈·DI·파이프/가드/인터셉터/필터 구성**만 다룬다. 배포와 마이크로서비스 트랜스포트는 다루지 않는다.

여기서 다루지 않는 것 → 레이어 구조와 DTO 개념은 \`backend.md\`, URL·상태 코드는 \`api-design.md\`, 인증 정책은 \`auth.md\`, 입력 검증의 보안 기준은 \`security.md\`, 에러 분류는 \`error-handling.md\`.

**이 문서는 어떤 ORM 을 쓸지 정하지 않는다.** TypeORM·Prisma·MikroORM 선택은 프로젝트 결정이며, 쿼리 규칙은 \`database.md\` 를 따른다.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **Controller 얇게 유지 vs 코드 줄 수** — 얇게가 이긴다. Controller 의 로직은 HTTP 없이 재사용할 수 없다.
- **DI vs 직접 인스턴스화** — DI 가 이긴다. \`new Service()\` 를 직접 만들면 테스트에서 교체할 수 없다.
- **전역 ValidationPipe vs 컨트롤러별 처리** — 전역이 이긴다. 빠뜨릴 수 있는 위치에 검증을 두지 않는다.
- **이 문서 vs \`backend.md\`** — 프레임워크 관례는 이 문서가 이기지만, 레이어 경계와 DTO 분리는 \`backend.md\` 가 이긴다.

## 자가 점검

기능을 추가·수정한 뒤 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] Controller 에 비즈니스 로직이 없다 — 검증·DI·응답 변환만 한다
- [ ] DTO 에 class-validator 데코레이터가 있고 전역 \`ValidationPipe\` 가 켜져 있다
- [ ] \`whitelist\` / \`forbidNonWhitelisted\` 로 정의되지 않은 필드를 걸러낸다
- [ ] 의존성을 생성자 주입으로 받는다 — 직접 인스턴스화가 없다
- [ ] 모듈 경계가 feature 단위이고 순환 의존이 없다
- [ ] 인가를 Guard 로 처리한다 — 핸들러 안 흩어진 역할 비교가 아니다
- [ ] 예외 필터가 스택 트레이스를 응답에 넣지 않는다
- [ ] 환경 변수를 \`ConfigModule\` 스키마로 검증해서 읽는다
`;
