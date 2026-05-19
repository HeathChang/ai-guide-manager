export const frameworkSpringBoot = `---
title: 프레임워크 — Spring Boot
stack: backend
category: 프레임워크
extends: [base.md, backend.md]
---

# Spring Boot (Java / Kotlin)

> \`backend.md\` 를 상속. Spring Boot 3.x / Java 21 (또는 Kotlin) / Spring Framework 6.x 전제.
> Jakarta EE 네임스페이스(\`jakarta.*\`) — \`javax.*\` 는 legacy.

## 프로젝트 구조 — 도메인 단위 패키지

\`\`\`
com.company.app
├ Application.java        @SpringBootApplication
├ users/                  도메인 모듈
│  ├ UserController.java
│  ├ UserService.java
│  ├ UserRepository.java
│  ├ User.java            엔티티
│  ├ dto/
│  └ exception/
├ orders/
└ common/                 횡단 관심사 (config, exception, security)
\`\`\`

- 패키지 = 도메인. 레이어(controller/service/repository)로 최상위 분리하지 마라.
  - 근거: 도메인 단위 응집이 변경 영향 범위를 줄인다. 레이어 우선 분리는 마이크로서비스 분할 시 도메인이 흩어진다.

## Bean / DI

- **생성자 주입만** 사용. \`@Autowired\` 필드 주입 금지.
  - 근거: final 필드로 immutability 보장, 테스트에서 mock 주입 명시적, 순환 의존성을 컴파일/부팅 시점에 감지.
- Kotlin: 생성자 매개변수 \`val\` 로.
- 비즈니스 로직 클래스는 \`@Service\`. 데이터 접근은 \`@Repository\`. HTTP는 \`@RestController\`.

## Controller — 얇게

- 요청 검증 + 서비스 호출 + 응답 매핑.
- 비즈니스 로직 금지. 트랜잭션 어노테이션 금지(\`@Transactional\` 은 Service에).

## Service

- \`@Service\` 클래스. 도메인 로직 위치.
- 트랜잭션: \`@Transactional\` 메서드 단위. 클래스 단위 적용은 신중히.
  - read-only: \`@Transactional(readOnly = true)\` — 쿼리 최적화 + flush 회피.
- 예외는 도메인 예외 던지고, controller advice에서 HTTP status 매핑.

## Repository

- Spring Data JPA: \`extends JpaRepository<User, UUID>\` 또는 \`CrudRepository\`.
- 쿼리: 메서드 이름 규칙 → 복잡해지면 \`@Query\` JPQL → 더 복잡하면 \`QueryDSL\` 또는 jOOQ.
- 동적 쿼리는 Specification 또는 QueryDSL — JPQL 문자열 합치기 금지(SQL 인젝션).

## 검증 — Bean Validation

- DTO 필드에 \`@NotBlank\`, \`@Email\`, \`@Size(min=8)\` 등.
- 컨트롤러 파라미터에 \`@Valid\` 필수:
  \`\`\`java
  @PostMapping
  public UserDto create(@Valid @RequestBody CreateUserRequest req) { ... }
  \`\`\`
- 검증 실패는 \`MethodArgumentNotValidException\` → \`@ControllerAdvice\` 에서 400 응답.

## 예외 처리 — 중앙 집중

\`\`\`java
@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(UserNotFoundException.class)
  public ResponseEntity<ApiError> handle(UserNotFoundException e) {
    return ResponseEntity.status(404).body(new ApiError("USER_NOT_FOUND", e.getMessage()));
  }
}
\`\`\`

- 스택 트레이스를 응답에 노출 금지.
- 도메인 예외 클래스 계층 명확히.

## 설정 — application.yml

- \`@ConfigurationProperties\` 로 타입 안전 바인딩:
  \`\`\`java
  @ConfigurationProperties("app.jwt")
  public record JwtProps(String secret, Duration ttl) {}
  \`\`\`
- 환경별 분리: \`application-{dev,prod}.yml\`.
- 시크릿은 환경변수 또는 외부 시크릿 매니저 — yml에 평문 금지.

## 보안 — Spring Security

- \`SecurityFilterChain\` Bean으로 명시:
  \`\`\`java
  @Bean
  public SecurityFilterChain filter(HttpSecurity http) throws Exception {
    return http
      .csrf(csrf -> csrf.disable())             // stateless API면 OK, 명시적
      .authorizeHttpRequests(a -> a.anyRequest().authenticated())
      .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
      .build();
  }
  \`\`\`
- 디폴트 비활성 금지. CSRF / CORS / session 정책을 명시적 선언.

## 로깅

- SLF4J + Logback. \`System.out.println\` 금지.
- 구조화 로깅(JSON) — Logstash 인코더 또는 \`logstash-logback-encoder\`.
- MDC로 traceId 주입 — 모든 로그에 자동 포함.

## 비동기 / 동시성

- \`@Async\` — \`@EnableAsync\` 필수, 별도 ExecutorService 정의 (default는 SimpleAsyncTaskExecutor — 풀 없음).
- 가상 스레드(Java 21): \`spring.threads.virtual.enabled=true\` 검토.
- CompletableFuture 또는 Reactor (\`WebFlux\` 채택 시).

## 테스트

- 단위: \`@ExtendWith(MockitoExtension.class)\`, Mockito로 의존 mock.
- 슬라이스: \`@WebMvcTest\` / \`@DataJpaTest\` / \`@JsonTest\`.
- 통합: \`@SpringBootTest\` + Testcontainers (Postgres/Kafka 등).
- 통합 테스트 시 모든 빈 로드는 비용 큼 — 슬라이스 우선.

## OpenAPI

- \`springdoc-openapi\` — 컨트롤러로부터 자동 생성.
- \`@Operation\`, \`@ApiResponse\` 데코레이터로 보강.

## Kotlin 사용 시 추가

- data class로 DTO/Value Object.
- null safety로 NPE 방지.
- \`runCatching\` 보다 명시적 try/catch + 도메인 예외 throw.
- coroutine 사용 시 \`suspend\` 컨트롤러 OK (Spring 6 지원).

## AI 행동 규칙

- 필드 주입(\`@Autowired\` 필드) 발견 시 즉시 생성자 주입으로 리팩토링.
- Controller에 \`@Transactional\` 발견 시 Service로 이동.
- JPQL 문자열 합치기 발견 시 named parameter / Specification으로 교체.
- application.yml에 평문 시크릿 발견 시 환경변수 + \`\${ENV_VAR}\` 패턴 권고.
- \`System.out.println\` / \`e.printStackTrace()\` 발견 시 SLF4J 로깅으로 교체.

## 패턴 (DO / DON'T)

### 생성자 주입

\`\`\`java
// DON'T
@Service
public class UserService {
  @Autowired private UserRepository repo;
}

// DO
@Service
@RequiredArgsConstructor       // Lombok 또는 명시적 생성자
public class UserService {
  private final UserRepository repo;
}
\`\`\`

### 트랜잭션 위치

\`\`\`java
// DON'T — Controller에 트랜잭션
@RestController
public class UserController {
  @PostMapping @Transactional
  public UserDto create(...) { ... }
}

// DO — Service
@Service
public class UserService {
  @Transactional
  public User create(CreateUserCmd cmd) { ... }
}
\`\`\`

### SQL 인젝션 방어

\`\`\`java
// DON'T
@Query("SELECT u FROM User u WHERE u.email = '" + email + "'")

// DO — named parameter
@Query("SELECT u FROM User u WHERE u.email = :email")
Optional<User> findByEmail(@Param("email") String email);
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| 필드 \`@Autowired\` | 생성자 주입 |
| Controller에 비즈니스 로직 | Service |
| \`@Transactional\` Controller | Service 메서드 |
| application.yml 평문 시크릿 | \`\${ENV}\` + 시크릿 매니저 |
| \`javax.*\` import | \`jakarta.*\` |
| \`System.out\` | SLF4J Logger |
`;
