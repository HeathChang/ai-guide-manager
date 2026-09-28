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
  - 근거: \`@Transactional\` 은 Spring의 AOP 프록시로 동작. 같은 클래스 내부 호출(\`this.method()\`)에는 트랜잭션이 안 걸린다. Controller에 두면 Service 호출은 트랜잭션 안인데, Service 내부 다른 메서드 호출은 트랜잭션 밖이라는 비대칭이 생긴다. Service 단에 두면 외부 호출이라 모든 메서드가 일관되게 트랜잭션 안.

## Service

- \`@Service\` 클래스. 도메인 로직 위치.
- 트랜잭션: \`@Transactional\` 메서드 단위. 클래스 단위 적용은 신중히.
  - read-only: \`@Transactional(readOnly = true)\` — 쿼리 최적화 + flush 회피.
- 예외는 도메인 예외 던지고, controller advice에서 HTTP status 매핑.

## Repository

- Spring Data JPA: \`extends JpaRepository<User, UUID>\` 또는 \`CrudRepository\`.
- 쿼리: 메서드 이름 규칙 → 복잡해지면 \`@Query\` JPQL → 더 복잡하면 \`QueryDSL\` 또는 jOOQ.
- 동적 쿼리는 Specification 또는 QueryDSL — JPQL 문자열 합치기 금지(SQL 인젝션).
  - 근거: JPQL 문자열을 합치면 입력이 곧 쿼리 구조가 된다. Specification 은 파라미터 바인딩을 강제해 그 경로를 없앤다.

## 검증 — Bean Validation

- DTO 필드에 \`@NotBlank\`, \`@Email\`, \`@Size(min=8)\` 등.
- 컨트롤러 파라미터에 \`@Valid\` 필수. 근거: DTO 에 제약 애노테이션을 달아도 \`@Valid\` 가 없으면 검증이 아예 실행되지 않는다. 검증한다고 믿는 상태로 통과하는 게 검증이 없는 것보다 위험하다.
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
  - 근거: 내부 경로·라이브러리 버전·쿼리 구조가 그대로 드러난다. 공격자에게는 정찰 정보이고 사용자에게는 아무 쓸모가 없다.
- 도메인 예외 클래스 계층 명확히.

## 설정 — application.yml

- \`@ConfigurationProperties\` 로 타입 안전 바인딩:
  \`\`\`java
  @ConfigurationProperties("app.jwt")
  public record JwtProps(String secret, Duration ttl) {}
  \`\`\`
- 환경별 분리: \`application-{dev,prod}.yml\`.
- 시크릿은 환경변수 또는 외부 시크릿 매니저 — yml에 평문 금지.
  - 근거: yml 은 저장소에 커밋된다. git history 는 영원하므로 한 번 올라간 시크릿은 재발급 외에 되돌릴 방법이 없다.

## 보안 — Spring Security

- \`SecurityFilterChain\` Bean으로 명시:
  \`\`\`java
  @Bean
  public SecurityFilterChain filter(HttpSecurity http) throws Exception {
    return http
      .csrf(csrf -> csrf.disable())             // 쿠키 세션 미사용(토큰/Bearer 인증)일 때만 disable. 쿠키 세션이면 CSRF 유지
      .authorizeHttpRequests(a -> a.anyRequest().authenticated())
      .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
      .build();
  }
  \`\`\`
- 디폴트 비활성 금지. CSRF / CORS / session 정책을 명시적 선언.
  - 근거: 에러를 없애려고 보안 필터를 통째로 끄는 선택이 가장 흔한 사고 경로다. 정책을 명시하면 무엇을 허용했는지 코드에 남는다.

## 로깅

- SLF4J + Logback. \`System.out.println\` 금지.
  - 근거: 레벨도 구조도 요청 상관관계도 없어 수집·검색·알림 대상이 되지 못한다. 운영에서 그 출력은 사실상 사라진 것과 같다.
- 구조화 로깅(JSON) — Logstash 인코더 또는 \`logstash-logback-encoder\`.
- MDC로 traceId 주입 — 모든 로그에 자동 포함.

## 비동기 / 동시성

- \`@Async\` — \`@EnableAsync\` 필수, 별도 ExecutorService 정의 (default는 SimpleAsyncTaskExecutor — 풀 없음).
  - 근거: 기본 SimpleAsyncTaskExecutor 는 요청마다 새 스레드를 만들고 재사용하지 않는다. 부하가 오르면 스레드 수가 그대로 따라 올라 OOM 으로 끝난다.
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

## 적용 범위와 경계

이 문서는 **Spring Boot 의 Bean/DI, 레이어 구현, 검증, 예외 처리, 설정**만 다룬다. 배포와 인프라(Kubernetes, 서비스 메시)는 다루지 않는다.

여기서 다루지 않는 것 → 레이어 구조의 원칙은 \`backend.md\`, URL·상태 코드는 \`api-design.md\`, 인증 정책은 \`auth.md\`, 쿼리·인덱스는 \`database.md\`, 에러 분류는 \`error-handling.md\`.

**이 문서는 Spring Security 정책을 대신 정하지 않는다.** 어떤 경로를 누구에게 열지는 제품 결정이다. 명시되지 않았으면 추측하지 말고 유저에게 묻는다.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **보안 필터 유지 vs 에러 제거** — 보안이 이긴다. CSRF·CORS 에러를 없애려고 설정을 통째로 끄지 않는다.
- **생성자 주입 vs 필드 주입** — 생성자 주입이 이긴다. 필드 주입은 필수 의존성을 숨기고 테스트에서 교체를 막는다.
  - 근거: 생성자 시그니처가 곧 의존성 목록이다. 필드 주입은 그 목록을 숨겨 클래스가 무엇을 필요로 하는지 읽어서는 알 수 없게 만든다.
- **Controller 얇게 유지 vs 코드 줄 수** — 얇게가 이긴다.
- **이 문서 vs \`backend.md\`** — 프레임워크 관례는 이 문서가 이기지만, 레이어 경계와 DTO 분리는 \`backend.md\` 가 이긴다.

## 자가 점검

기능을 추가·수정한 뒤 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] Controller 에 비즈니스 로직이 없다
- [ ] 요청 DTO 파라미터에 \`@Valid\` 가 붙어 있고 제약 애노테이션이 있다
- [ ] 의존성을 생성자 주입으로 받는다 — 필드 \`@Autowired\` 가 없다
- [ ] Entity 를 그대로 반환하지 않고 DTO 로 매핑했다
- [ ] \`@Transactional\` 이 Service 에 있다 — Controller/Repository 가 아니다
- [ ] \`@ControllerAdvice\` 예외 핸들러가 스택 트레이스를 응답에 넣지 않는다
- [ ] Spring Security 의 CSRF/CORS/session 정책을 명시적으로 선언했다
- [ ] \`System.out.println\` 대신 SLF4J 로거를 쓴다
- [ ] 설정값을 \`application.yml\` + 프로파일로 분리했다
`;
