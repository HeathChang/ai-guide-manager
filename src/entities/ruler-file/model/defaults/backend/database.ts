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
  - 근거: 행 수는 항상 자란다. 개발 DB 에서 100건이던 쿼리가 운영에서 100만 건이 되면 메모리와 응답 시간이 같이 터진다. 상한이 없는 조회는 지금 안 터졌을 뿐이다.

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

## 적용 범위와 경계

이 문서는 **관계형 DB 의 스키마·인덱스·쿼리·마이그레이션**만 다룬다. NoSQL·시계열·검색 엔진에는 적용하지 않는다 — 해당 저장소를 쓴다면 유저에게 별도 규칙을 요청한다.

여기서 다루지 않는 것 → 조회 결과 캐싱은 \`caching.md\`, 트랜잭션을 어느 레이어에 둘지는 \`backend.md\`, SQL 인젝션 방어는 \`security.md\`, 마이그레이션 PR 절차는 \`git.md\`.

**이 문서는 운영 DB 에 대한 실행 권한을 주지 않는다.** 마이그레이션 적용, 인덱스 생성, 데이터 수정은 유저 승인 없이 실행하지 않는다.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **데이터 보존 vs 스키마 정리** — 데이터 보존이 이긴다. \`DROP\` / \`RENAME\` 이 필요하면 2단계로 나누고, 유저 승인 없이 실행하지 않는다.
- **정규화 vs 성능** — 측정 전에는 정규화가 이긴다. 역정규화는 EXPLAIN 이나 실제 지연 수치를 근거로만 한다.
- **인덱스 추가 vs 쓰기 성능** — 실제 조회 패턴에 쓰이지 않는 인덱스는 추가하지 않는다. 판단이 갈리면 추가하지 않는 쪽이 기본값이다.
- **ORM 편의 vs 생성 쿼리** — 생성 쿼리가 이긴다. ORM 이 만들어내는 SQL 을 확인하지 않고 넘어가지 마라.

## 자가 점검

스키마나 쿼리를 바꾼 뒤 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] 새 테이블에 \`created_at\`, \`updated_at\` 과 외래 키 제약이 있다
- [ ] 새 쿼리의 EXPLAIN 을 확인했고 풀스캔이 아니다
- [ ] \`SELECT *\` 를 쓰지 않고 필요한 컬럼만 지정했다
- [ ] 목록 조회에 페이지네이션이 있다 — 상한 없는 조회가 없다
- [ ] N+1 이 생기지 않는지 실제 생성 쿼리를 로그로 확인했다
- [ ] 추가한 인덱스마다 카디널리티·조회 패턴·쓰기 빈도를 확인했다
- [ ] 마이그레이션이 포워드 전용이고, 데이터 손실 가능한 변경은 2단계로 나눴다
- [ ] 트랜잭션 안에서 외부 API 를 호출하지 않는다
`;
