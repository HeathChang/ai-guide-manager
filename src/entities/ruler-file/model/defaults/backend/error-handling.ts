export const backendErrorHandling = `---
title: 에러 핸들링
stack: backend
category: 안정성
extends: [base.md, backend.md]
---

# Error Handling & Resilience

> \`base.md\`, \`backend.md\`를 상속한다. 에러 분류, 예외 처리, 복원력 규칙이다.

## 에러 분류

| 분류 | 예시 | 처리 |
|------|------|------|
| 클라이언트 오류 | 검증 실패, 권한 없음 | 4xx + 명확한 메시지 |
| 비즈니스 규칙 | 잔액 부족, 중복 | 4xx (주로 409/422) + code |
| 외부 의존 오류 | DB 단절, API timeout | 재시도 + 서킷 브레이커 |
| 시스템 오류 | OOM, 예상 불가 | 5xx + 알림 |

- 에러 타입별 **명시적 클래스/태그**로 분류 — 문자열 비교 금지.

## 글로벌 예외 처리

- 프레임워크의 **글로벌 예외 핸들러**에서 상태 코드 매핑.
- 스택트레이스는 **서버 로그**에만 — 응답에 포함 금지.
- 미분류 예외는 기본 500으로 매핑하되, 알림 발생.

## 응답 포맷

\`\`\`json
{
  "code": "INSUFFICIENT_BALANCE",
  "message": "잔액이 부족합니다",
  "details": [{"required": 10000, "current": 5000}]
}
\`\`\`

## 재시도 / 복원력

- **지수 백오프 + 지터**로 재시도 (1s, 2s, 4s + random).
  - 근거: 일정 간격 재시도는 외부 서비스 복구 직후 *모든 클라이언트가 동시 재요청* → 다시 다운(thundering herd). 지수 + 지터는 부하를 시간상으로 분산.
- **최대 재시도 횟수**를 제한.
  - 근거: 무한 재시도는 외부 의존이 영구 다운 시 *우리 서비스 리소스를 잠식* — 큐/스레드/메모리 고갈로 우리 서비스도 다운.
- 재시도 가능 여부는 **에러 타입**으로 판단 (타임아웃·5xx → 재시도, 4xx → 중단).
  - 근거: 4xx는 *우리 요청 자체의 문제*(검증/권한) — 재시도해도 같은 결과. 5xx/타임아웃만 *서버 측 일시 장애* 가능성.

## 서킷 브레이커

- 외부 의존 호출은 서킷 브레이커 패턴 적용.
- 실패율 임계치 초과 시 **빠른 실패** + 대체 경로.
- 상태 변화(Open/Half-Open/Closed)를 메트릭으로 노출.

## Idempotency

- 생성/결제 등 재시도 가능성 있는 요청은 **Idempotency Key** 헤더 지원.
- 동일 키로 재요청 시 이전 결과 반환.

## AI 행동 규칙

- 외부 호출(HTTP / DB / 큐 / 파일) 추가 시 — **타임아웃 누락은 즉시 막는다**. 재시도/서킷브레이커는 critical path에 우선 적용.
- \`catch (e) { ... }\` 블록 — 빈 블록 / \`return null\` / \`return undefined\` 발견 시 즉시 (1) 재분류 (2) rethrow (3) 명시적 사용자 메시지 중 하나로 명확히.
- 사용자 노출 메시지 — \`NullPointerException\`, \`ECONNREFUSED\`, \`PSQLException\` 같은 기술 용어 발견 시 사용자 친화 메시지로 변경. 기술 정보는 서버 로그에만.
- 결제·생성 같은 *재시도 부작용 있는* 엔드포인트에 Idempotency Key 없이 작성 시 추가 권고.

## 패턴 (DO / DON'T)

### 예외 분류

\`\`\`ts
// DON'T — 모든 예외 삼킴
try { ... } catch (e) { return null; }

// DO — 분류 + 로깅 + 재분류
try { ... } catch (e) {
  if (e instanceof ValidationError) throw e;          // 4xx 로 전파
  if (isTransient(e)) throw new RetryableError(e);    // 재시도 대상
  logger.error({ err: e }, 'unexpected');
  throw new InternalError('internal error', { cause: e });
}
\`\`\`

### 재시도

\`\`\`ts
// DON'T — 무한 재시도
while (true) { try { return call(); } catch { /* retry */ } }

// DO — 지수 백오프 + 지터 + 횟수 제한
for (let i = 0; i < 4; i++) {
  try { return await call(); }
  catch (e) {
    if (!isRetryable(e) || i === 3) throw e;
    await sleep(2 ** i * 1000 + Math.random() * 200);
  }
}
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| 클라이언트에 스택트레이스 노출 | 서버 로그에만 |
| 4xx/5xx 무분별 재시도 | 재시도 가능 타입만 |
| Idempotency Key 없이 결제 재요청 허용 | 헤더 기반 중복 방지 |
`;
