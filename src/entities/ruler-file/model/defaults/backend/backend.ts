export const backendBackend = `---
title: 백엔드 공통
stack: backend
category: 공통
extends: [base.md]
---

# Backend Common Rules

> \`base.md\`를 상속한다. 백엔드 공통 아키텍처/설계 원칙이다.

## 레이어드 아키텍처

| 레이어 | 책임 | 금지 |
|--------|------|------|
| Controller / Handler | 입력 검증, 라우팅, 응답 포맷 | 비즈니스 로직 |
| Service / UseCase | 비즈니스 규칙, 트랜잭션 경계 | SQL 직접 작성 |
| Repository / DAO | 영속성 접근 | HTTP 응답 처리 |
| Domain / Entity | 도메인 규칙, 불변식 | 외부 의존 |

- 의존성은 **안쪽으로만** 흐른다 (Controller → Service → Repository).
  - 근거: Repository 가 Controller 를 참조하면 도메인 로직이 HTTP에 묶인다 = 같은 비즈니스 로직을 CLI/스케줄러/큐 워커에서 재사용 불가. 안쪽으로만 흐르면 외피(HTTP/CLI/큐)는 교체 가능한 어댑터가 된다.
- Domain은 프레임워크에 의존하지 않는다.
  - 근거: Domain 이 Spring/Nest/Django 같은 프레임워크 import 하면 도메인 단위 테스트에 프레임워크 부팅이 필요. 도메인은 plain 클래스/함수로 유지 — 부팅 0초 테스트 가능.

## DTO / Entity 분리

- 외부 노출은 **DTO**로만 — Entity 직접 노출 금지.
  - 근거: Entity 직접 노출 = 모든 내부 필드(passwordHash, createdBy, internalFlags 등)가 응답에 포함될 위험 + Entity 스키마 변경이 곧 API breaking change. DTO 경계가 *API 계약*을 분리.
- DTO는 입력(Request) / 출력(Response)을 분리.
  - 근거: Request에는 \`password\` 가 필요하지만 Response엔 없어야 함. 같은 DTO를 양방향에 쓰면 *입력 필드를 응답에 노출*하거나 *응답 필드를 요청에 받아들이는* 사고 가능.
- Entity ↔ DTO 변환은 **전용 매퍼**에서 처리.

## 에러 처리 전략

- 에러 분류 체계는 error-handling.md의 4분류(클라이언트/비즈니스 규칙/외부 의존/시스템)를 표준으로 한다. 글로벌 핸들러에서 각 분류를 HTTP 상태로 매핑.
- 에러 응답 포맷을 **표준화** (code, message, details).

## 설정 관리

- 환경별 설정(\`application-{env}.yml\`) 분리.
- 시크릿은 **환경 변수** 또는 시크릿 매니저에서 주입.
- 기본값은 **안전한 쪽**으로 (권한 최소, 기능 비활성).

## AI 행동 규칙

- 새 기능은 **Domain → Service → Controller** 순서로 작성. Controller 부터 짜기 시작하면 비즈니스 로직이 Controller에 새어들어간다.
- 트랜잭션 경계를 Service에 명시 — Controller 또는 Repository 에 \`@Transactional\` 발견 시 즉시 Service로 이전.
- 외부 호출(HTTP, DB, 큐) 코드 작성 시 **타임아웃 명시 없이는 작성 금지** — 기본 무한 대기는 사고 원인.
  - 근거: 대부분의 HTTP·DB 클라이언트가 기본 무한 대기다. 상대가 응답하지 않으면 커넥션 풀이 차고, 그 순간 이 서비스 전체가 함께 멈춘다.
- Entity 를 그대로 \`res.json(...)\` / \`return entity\` 시도 시 즉시 DTO 매퍼 추가 권고.

## 패턴 (DO / DON'T)

### 레이어 경계

\`\`\`ts
// DON'T — Controller가 Repository 직접 호출
@Get('/users/:id')
async find(@Param('id') id: string) {
  return this.userRepo.findById(id);   // 비즈니스 규칙·인가 우회
}

// DO — Service 경유
@Get('/users/:id')
async find(@Param('id') id: string) {
  return this.userService.findByIdForViewer(id, this.viewer);
}
\`\`\`

### Entity vs DTO

\`\`\`ts
// DON'T — 내부 필드(passwordHash 등) 그대로 노출
res.json(userEntity);

// DO — 전용 DTO 매핑
res.json(toUserResponse(userEntity));
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| 설정값을 코드에 하드코딩 | 환경 변수 / 설정 파일 |
| Service 없이 Controller↔Repository | Service 레이어 경유 |
| 외부 호출에 타임아웃 누락 | 타임아웃 + 재시도 + 서킷브레이커 |

## 적용 범위와 경계

이 문서는 **레이어 경계, DTO/Entity 분리, 설정 관리**만 다룬다. 특정 프레임워크의 문법과 관례는 다루지 않는다 — 그쪽은 \`spring-boot.md\`, \`node-nestjs.md\` 같은 프레임워크 문서가 담당한다.

여기서 다루지 않는 것 → 엔드포인트 URL·상태 코드는 \`api-design.md\`, 에러 분류 체계는 \`error-handling.md\`, 트랜잭션 내부 동작과 쿼리는 \`database.md\`, 인가 정책은 \`auth.md\`.

이 문서는 **어떤 아키텍처 스타일을 쓸지 재협상하지 않는다.** 헥사고날·클린 아키텍처 등 다른 스타일이 필요하면 유저에게 확인한다. 임의로 레이어 이름을 바꾸지 마라.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **레이어 경계 vs 코드 줄 수** — 레이어 경계가 이긴다. Controller 에서 Repository 를 직접 부르면 코드는 짧아지지만 인가와 트랜잭션 경계가 함께 사라진다.
- **프레임워크 관례 vs 이 문서** — 프레임워크 문서가 이긴다. 다만 "Domain 은 프레임워크에 의존하지 않는다"는 예외 없이 유지한다.
- **DTO 분리 vs 빠른 구현** — DTO 분리가 이긴다. Entity 를 그대로 반환하는 코드는 작성하지 않는다.
- **타임아웃 명시 vs 라이브러리 기본값** — 명시가 이긴다. 기본값이 무한 대기인 클라이언트가 많다.

## 자가 점검

기능을 제출하기 전 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] Controller 에 비즈니스 로직이 없고, Repository 를 직접 호출하지 않는다
- [ ] Service 가 SQL 을 직접 쓰지 않는다
- [ ] Domain 코드가 프레임워크를 import 하지 않는다
- [ ] 응답에 Entity 를 그대로 내보내지 않고 DTO 로 매핑했다
- [ ] Request DTO 와 Response DTO 가 분리돼 있다
- [ ] 트랜잭션 경계가 Service 에 있다 — Controller/Repository 에 없다
- [ ] 새로 추가한 외부 호출(HTTP·DB·큐)에 타임아웃이 명시돼 있다
- [ ] 새 설정값이 환경 변수로 주입되고, 기본값이 안전한 쪽이다
- [ ] Domain → Service → Controller 순서로 작성했다
`;
