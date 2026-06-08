export const backendDatabase = `---
title: 데이터베이스
stack: backend
category: 데이터
extends: [base.md, backend.md]
---

# Database

> \`base.md\`, \`backend.md\`를 상속한다. DB 설계·쿼리·마이그레이션 규칙이다.

## 설계 원칙

- 기본은 **3NF 정규화** — 성능 이슈 시 측정 후 역정규화.
- 외래 키 제약을 **명시적으로** 선언 (참조 무결성).
- 모든 테이블에 \`created_at\`, \`updated_at\` 포함.
- soft delete는 \`deleted_at\` + 필터링으로 처리.

## 인덱스

- **조회 패턴**에 기반해 인덱스를 설계한다 (EXPLAIN 확인).
- 고카디널리티 컬럼을 인덱스 앞쪽에.
- 복합 인덱스 설계 시 **ORDER BY**와 일치 여부 확인.
- 불필요한 인덱스는 쓰기 비용 — 사용되지 않으면 제거.

## 쿼리

- **N+1 방지**: eager loading / batch 조회 / DataLoader.
  - 근거: N+1은 *기능 테스트에선 거의 안 보임* (소량 데이터) → 프로덕션에서 행 수가 늘면 즉시 latency 폭증. 개발 단계에서 적극 차단해야 한다.
- \`SELECT *\` 금지 — 필요한 컬럼만.
  - 근거: 새 컬럼이 테이블에 추가될 때마다 응답 페이로드가 *침묵으로* 늘어남. 또 \`TEXT\`/\`BLOB\` 컬럼이 모든 조회에 끌려오면 메모리·네트워크 낭비.
- ORM 생성 쿼리를 **반드시 확인** (의도와 다른 JOIN 주의).
  - 근거: ORM이 lazy/eager 설정에 따라 *완전히 다른 쿼리*를 만든다. 로그(\`logging: true\`)로 실제 쿼리를 보지 않으면 N+1을 모르고 지나간다.
- 대량 조회는 **페이지네이션** 필수.

## 마이그레이션

- 마이그레이션은 **포워드만** — 롤백은 새 마이그레이션으로.
  - 근거: down 마이그레이션은 운영 환경에서 *데이터 손실* 위험. 새 forward 마이그레이션이 의도를 명시적으로 보존 + 이력 보존.
- Breaking change는 **2단계**: 추가(호환) → 전환 → 제거.
  - 근거: 단일 마이그레이션으로 컬럼명 변경 = 배포 도중 *옛 코드 인스턴스*가 새 스키마를 못 읽음. 무중단 배포 불가. 2단계는 옛/새 코드 둘 다 동작하는 호환 구간 보장.
- 프로덕션 마이그레이션은 **lock 최소화** (online DDL, 무중단 절차).
  - 근거: 큰 테이블에 \`ALTER TABLE\` 은 분 단위 락 → 전체 서비스 중단. Postgres \`CONCURRENTLY\`, MySQL Online DDL 등 도구 활용 + off-peak 시간.

## 트랜잭션

- Service 레이어에 트랜잭션 경계를 명시.
- 외부 API 호출은 **트랜잭션 밖**에서 (락 시간 최소화).
- 분산 트랜잭션은 Saga / Outbox 패턴 고려.

## AI 행동 규칙

- 새 쿼리 작성 시 EXPLAIN 결과를 PR 설명에 첨부 권고 — 특히 큰 테이블 대상.
- 인덱스 추가 전 (a) 카디널리티 (b) 실제 조회 패턴 (c) 쓰기 빈도 확인. 인덱스는 쓰기 비용을 늘리니까 해당 컬럼이 WHERE/JOIN/ORDER BY에 실제로 쓰일 때만 추가한다.
- ORM \`include\` / eager loading 사용 시 — 실제 생성되는 쿼리를 로그로 확인. 의도와 다른 JOIN 발견 시 즉시 수정.
- 마이그레이션 작성 시 **롤백 가능성**을 의식적으로 검토 — 데이터 손실 가능한 변경(DROP, RENAME)은 2단계로 분리 권고.

## 패턴 (DO / DON'T)

### N+1 방지

\`\`\`ts
// DON'T — 주문별로 사용자 쿼리 N+1회
const orders = await orderRepo.findAll();
for (const order of orders) {
  order.user = await userRepo.findById(order.userId);
}

// DO — eager loading / JOIN / batch
const orders = await orderRepo.findAll({ include: { user: true } });
// 또는 DataLoader로 userId 배치
\`\`\`

### SELECT 범위

\`\`\`sql
-- DON'T
SELECT * FROM users WHERE id = ?;

-- DO — 필요한 컬럼만
SELECT id, email, display_name FROM users WHERE id = ?;
\`\`\`

### 마이그레이션 2단계

\`\`\`
-- DON'T — 컬럼명 in-place 변경 → 무중단 불가
ALTER TABLE users RENAME COLUMN name TO display_name;

-- DO — 추가 → 백필 → 코드 전환 → 제거 (4개 마이그레이션)
-- 1) ADD COLUMN display_name
-- 2) 백필 (UPDATE users SET display_name = name)
-- 3) 읽기·쓰기 코드 전환
-- 4) DROP COLUMN name
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| 애플리케이션 레벨 JOIN | DB JOIN 또는 eager loading |
| WHERE 없는 큰 테이블 스캔 | 인덱스 + 조건 + 페이지네이션 |
| 프로덕션 \`TRUNCATE\` / \`DROP\` | 마이그레이션 + 리뷰 + 백업 |
| 외부 API 호출을 트랜잭션 내부에서 | 트랜잭션 밖, DB 변경과 외부 호출을 원자적으로 묶어야 하면 Outbox |
`;
