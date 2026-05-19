export const frameworkGoGin = `---
title: 프레임워크 — Go + Gin
stack: backend
category: 프레임워크
extends: [base.md, backend.md]
---

# Go + Gin

> \`backend.md\` 를 상속. Go 1.22+ / Gin 1.10+ 전제.
> 본 규칙은 Gin 외 표준 라이브러리(\`net/http\`) + chi / echo / fiber 와도 대부분 호환된다.

## 프로젝트 레이아웃

\`\`\`
cmd/
└ server/
   └ main.go                  진입점 (얇게)
internal/                      외부 import 금지 패키지
├ http/                        라우터 + 핸들러
│  ├ handler/
│  ├ middleware/
│  └ router.go
├ service/                     비즈니스 로직
├ repository/                  데이터 접근
├ domain/                      도메인 모델 + 인터페이스
└ config/
pkg/                            외부 import 가능한 공용 (있다면)
api/                            OpenAPI spec
\`\`\`

- \`internal/\` 활용 — Go의 내장 캡슐화. 다른 모듈에서 import 불가.
- \`cmd/{name}/main.go\` 패턴으로 여러 바이너리 가능.

## 패키지 네이밍

- 소문자 단일 단어. \`userservice\` 같은 합성보다 \`service\` 폴더 안의 \`user.go\`.
- 패키지 이름 = 의미. \`util\` / \`common\` / \`helpers\` 같은 무의미한 이름 금지.

## 의존성 주입 — 명시적

- DI 컨테이너 라이브러리(\`wire\`, \`fx\`) 도입 전에 **수동 주입**으로 시작.
  - 근거: Go는 명시성 선호. 5~10개 의존성까지는 \`main.go\` 에서 직접 구성이 가장 읽기 쉽다.
- \`main.go\` 에서 모든 의존성 그래프 구성 → router에 주입.

## Gin 핸들러

\`\`\`go
type UserHandler struct {
    svc *service.UserService
}

func (h *UserHandler) Create(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, ErrorResponse{Code: "INVALID_INPUT", Message: err.Error()})
        return
    }
    user, err := h.svc.Create(c.Request.Context(), req.toDomain())
    if err != nil {
        h.handleError(c, err)
        return
    }
    c.JSON(201, UserResponse{}.fromDomain(user))
}
\`\`\`

- 핸들러는 메서드(\`(h *UserHandler) Create\`) — 의존성을 receiver로.
- 함수 핸들러 + 패키지 전역 변수 패턴 금지 (테스트 어려움).

## 입력 검증

- \`go-playground/validator\` (Gin 내장):
  \`\`\`go
  type CreateUserRequest struct {
      Email    string \`json:"email" binding:"required,email"\`
      Password string \`json:"password" binding:"required,min=8"\`
  }
  \`\`\`
- \`ShouldBindJSON\` / \`ShouldBindQuery\` — \`MustBind\` 시리즈(\`BindJSON\`)는 자동 400 응답을 보내므로 분기 제어 어려움. \`Should\` 시리즈 권장.

## 에러 처리

- 표준 \`error\` 인터페이스. \`errors.Is\` / \`errors.As\` 로 분류.
- 도메인 에러는 sentinel 또는 타입:
  \`\`\`go
  var ErrUserNotFound = errors.New("user not found")
  type ValidationError struct { Field string; Msg string }
  \`\`\`
- 핸들러 helper에서 도메인 에러 → HTTP status 매핑:
  \`\`\`go
  func (h *UserHandler) handleError(c *gin.Context, err error) {
      switch {
      case errors.Is(err, service.ErrUserNotFound):
          c.JSON(404, ErrorResponse{Code: "USER_NOT_FOUND"})
      case errors.As(err, &service.ValidationError{}):
          c.JSON(400, ErrorResponse{Code: "VALIDATION"})
      default:
          slog.ErrorContext(c, "unhandled", "err", err)
          c.JSON(500, ErrorResponse{Code: "INTERNAL"})
      }
  }
  \`\`\`
- panic은 라이브러리 버그 또는 복구 불가능 상황에만 — recover 미들웨어로 500 응답.

## Context

- 모든 핸들러 → service → repository에서 \`context.Context\` 첫 인자로 전달.
- HTTP 요청 종료 시 자동 cancel — DB 쿼리·외부 호출에서 활용.
- 절대 \`context.Background()\` 를 request 처리에서 사용 금지.

## 미들웨어

- \`gin.Recovery()\`, \`gin.Logger()\` 디폴트 + 커스텀.
- 인증 미들웨어 — JWT 검증 후 \`c.Set("user", user)\` → 핸들러 \`c.MustGet("user").(domain.User)\`.
- traceId / requestId 미들웨어 — 로그 + 응답 헤더에 포함.

## 로깅

- 표준 \`log/slog\` (Go 1.21+) — 구조화 로깅. zerolog / zap 도 OK.
- request context로 전달:
  \`\`\`go
  slog.InfoContext(ctx, "user created", "user_id", user.ID)
  \`\`\`
- \`fmt.Println\` 금지.

## DB

- \`database/sql\` 또는 ORM(\`gorm\`, \`ent\`, \`bun\`, \`sqlc\`).
- 권장: **sqlc** — SQL 작성, 컴파일 타임 타입 생성. ORM 없이 안전.
- 트랜잭션은 service 레벨에서 시작·종료. repository는 받은 tx 사용.
- prepared statement / parameterized query 강제. 문자열 포맷 SQL 금지.

## 동시성

- 고루틴은 lifecycle 명확하게 — \`context\` 또는 \`sync.WaitGroup\` 으로 종료 보장.
- channel은 작은 범위에서만. 큰 시스템에서는 일반 함수 호출이 명료.
- 공유 가변 상태는 mutex 또는 channel. **\`-race\` 플래그로 항상 테스트**.

## 환경 변수

- \`envconfig\` 또는 \`viper\` 로 한 번에 구조체에 로드:
  \`\`\`go
  type Config struct {
      Port        int    \`envconfig:"PORT" default:"3000"\`
      DatabaseURL string \`envconfig:"DATABASE_URL" required:"true"\`
      JWTSecret   string \`envconfig:"JWT_SECRET" required:"true"\`
  }
  \`\`\`
- 부팅 시점 검증 — 누락이면 즉시 실패.

## 테스트

- 표준 \`testing\` + \`testify\` (assert/require).
- 테이블 드리븐 테스트 권장:
  \`\`\`go
  cases := []struct{
      name string; input string; want int
  }{...}
  for _, tc := range cases {
      t.Run(tc.name, func(t *testing.T) { ... })
  }
  \`\`\`
- repository 테스트: testcontainers 또는 sqlmock.
- HTTP: \`httptest.NewRecorder\` + \`gin.New\` 직접.

## Graceful Shutdown

\`\`\`go
srv := &http.Server{...}
go func() { srv.ListenAndServe() }()

quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit

ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()
srv.Shutdown(ctx)
\`\`\`

## OpenAPI

- 코드 우선: \`swaggo/swag\` — 주석으로 spec 생성.
- 스펙 우선: \`oapi-codegen\` — OpenAPI yaml에서 핸들러 인터페이스 생성.
- 후자가 큰 팀에서 더 안전.

## AI 행동 규칙

- 함수 시그니처에 \`ctx context.Context\` 누락 시 추가.
- \`context.Background()\` 가 request 처리 코드에서 발견되면 즉시 \`c.Request.Context()\` 또는 매개변수로 받은 ctx로 교체.
- \`fmt.Println\` 발견 시 \`slog\` 로 교체.
- raw SQL 문자열 합치기 발견 시 parameterized query로 교체.
- 에러 무시(\`_ = err\`) 발견 시 처리 또는 명시적 무시 사유 주석.

## 패턴 (DO / DON'T)

### Context 전파

\`\`\`go
// DON'T — context 무시
func (s *UserService) Get(id string) (*User, error) {
    return s.repo.Find(id)
}

// DO
func (s *UserService) Get(ctx context.Context, id string) (*User, error) {
    return s.repo.Find(ctx, id)
}
\`\`\`

### 에러 wrap

\`\`\`go
// DON'T
if err != nil { return err }

// DO — wrap으로 호출 경로 보존
if err != nil { return fmt.Errorf("find user %s: %w", id, err) }
\`\`\`

### 핸들러 의존성

\`\`\`go
// DON'T — 전역 변수
var userSvc = service.New()
func CreateUser(c *gin.Context) { userSvc.Create(...) }

// DO — 구조체 + 메서드
type UserHandler struct{ svc *service.User }
func (h *UserHandler) Create(c *gin.Context) { h.svc.Create(...) }
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| \`ctx\` 누락 또는 \`context.Background()\` in request | 매개변수 ctx 전파 |
| panic으로 비즈니스 에러 표현 | error return |
| \`fmt.Println\` 디버깅 | \`slog\` |
| 패키지 전역 mutable 변수 | 구조체 receiver |
| 에러 \`_ = err\` 침묵 | 처리 또는 wrap |
`;
