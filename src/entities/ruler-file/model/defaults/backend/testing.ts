export const backendTesting = `---
title: 테스트
stack: backend
category: 품질
extends: [base.md, backend.md]
---

# Backend Testing

> \`base.md\`, \`backend.md\`를 상속한다. 테스트 피라미드와 전략 규칙이다.

## 테스트 피라미드

| 레벨 | 비율 | 목적 |
|------|:----:|------|
| Unit | 70% | 순수 로직, 도메인 규칙 |
| Integration | 20% | Repository, 외부 의존성 포함 |
| E2E / Contract | 10% | 주요 플로우, 계약 검증 |

## 단위 테스트

- **순수 함수·도메인 로직**을 우선 테스트.
- 외부 의존(DB, HTTP)은 **Fake / Stub**으로 대체.
- 하나의 테스트는 **하나의 동작**만 검증.

## 통합 테스트

- Repository 테스트는 **실제 DB** (Testcontainers, 인메모리) 사용 — 모킹 지양.
  - 근거: DB 모킹은 *SQL 문법 오류 / 인덱스 미스매치 / 트랜잭션 격리 수준 차이*를 잡지 못함. 모킹된 테스트가 통과해도 프로덕션 마이그레이션에서 깨지는 사고가 흔하다.
- 외부 API는 **Contract Test** + Wiremock.
- 테스트 간 독립성: 트랜잭션 롤백 또는 스키마 초기화.
  - 근거: 한 테스트가 데이터를 남기면 다음 테스트의 결과가 *실행 순서*에 의존 = CI에서 병렬화/셔플 시 깨진다.

## 픽스처 / 데이터

- 팩토리 패턴으로 테스트 데이터 생성 (\`UserFactory.create()\`).
- 시나리오마다 필요한 **최소 데이터**만.
- 프로덕션 데이터를 테스트에 사용 금지 (민감정보 유출 위험).

## 커버리지

- 도메인 / 서비스 레이어 **80% 이상** 지향.
- 커버리지 수치보다 **테스트 의도**가 우선.
- 100% 커버리지를 위한 무의미한 테스트 금지.

## AI 행동 규칙

- 새 도메인 로직(service 메서드, 검증 함수) 추가 시 unit test를 **같은 PR에** 작성.
- 버그 수정 시 **회귀 테스트를 먼저** — 버그를 재현하는 실패 테스트 → 수정 → 통과 순서. 그래야 *같은 버그가 다시 생기는 걸* 막는다.
- flaky 테스트 발견 시 \`it.skip\` + 이슈 등록 후 머지. 그대로 두면 다른 진짜 실패도 무시되기 시작.
- 프로덕션 DB / 프로덕션 API 키를 테스트에 사용 시도 시 즉시 차단 — \`.env.test\` + 격리 환경 강제.

## 패턴 (DO / DON'T)

### Repository 테스트

\`\`\`ts
// DON'T — DB를 모킹하면 SQL/매핑 버그를 못 잡음
const db = { query: vi.fn().mockResolvedValue([{ id: 1 }]) };

// DO — Testcontainers로 실제 DB
const container = await new PostgreSqlContainer().start();
const repo = new UserRepo(buildClient(container.getConnectionUri()));
\`\`\`

### 하나의 동작

\`\`\`ts
// DON'T — 한 테스트에서 여러 동작
it('create + find + delete', async () => { ... });

// DO — 동작 단위 분할
it('should create user with given email', async () => { ... });
it('should find user by id', async () => { ... });
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| 내부 모듈 과도 모킹 | 경계(HTTP/DB)만 모킹 |
| 실행 순서에 의존하는 테스트 | 각 테스트 독립(before/after 격리) |
| 프로덕션 환경 변수 사용 | \`.env.test\` + 격리된 DB |
| 프로덕션 데이터 덤프 사용 | 팩토리로 필요 최소 데이터 |
`;
