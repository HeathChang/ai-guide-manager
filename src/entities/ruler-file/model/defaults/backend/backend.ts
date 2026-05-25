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

- 도메인 예외(\`BusinessError\`)와 시스템 예외(\`SystemError\`)를 분리.
- 글로벌 예외 핸들러에서 HTTP 상태 코드로 매핑.
- 에러 응답 포맷을 **표준화** (code, message, details).

## 설정 관리

- 환경별 설정(\`application-{env}.yml\`) 분리.
- 시크릿은 **환경 변수** 또는 시크릿 매니저에서 주입.
- 기본값은 **안전한 쪽**으로 (권한 최소, 기능 비활성).

## AI 행동 규칙

- 새 기능은 **Domain → Service → Controller** 순서로 작성. Controller 부터 짜기 시작하면 비즈니스 로직이 Controller에 새어들어간다.
- 트랜잭션 경계를 Service에 명시 — Controller 또는 Repository 에 \`@Transactional\` 발견 시 즉시 Service로 이전.
- 외부 호출(HTTP, DB, 큐) 코드 작성 시 **타임아웃 명시 없이는 작성 금지** — 기본 무한 대기는 사고 원인.
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
`;
