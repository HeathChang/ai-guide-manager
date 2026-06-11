export const backendLogging = `---
title: 로깅
stack: backend
category: 운영
extends: [base.md, backend.md]
---

# Logging & Observability

> \`base.md\`, \`backend.md\`를 상속한다. 로깅·추적·모니터링 규칙이다.

## 로그 레벨

| 레벨 | 용도 |
|------|------|
| ERROR | 복구 불가, 알림 대상 |
| WARN | 정상 동작이나 주의 필요 |
| INFO | 중요한 비즈니스 이벤트 |
| DEBUG | 개발·디버깅 (프로덕션 off) |
| TRACE | 세부 추적 (개발만) |

- 프로덕션 기본은 **INFO**.

## 구조화된 로깅

- **JSON 포맷**으로 출력 — 후처리(검색·집계) 용이.
  - 근거: 텍스트 로그(\`"user logged in user_id=42"\`)는 grep 가능하지만 *집계·필터링*은 정규식 지옥. JSON은 ELK/Datadog/CloudWatch가 native로 인덱싱 → \`userId:42\` 한 줄 쿼리.
- 최소 필드: \`timestamp\`, \`level\`, \`service\`, \`traceId\`, \`message\`.
- 추가 컨텍스트는 평탄한 key-value로 (중첩 최소화).
  - 근거: 중첩 객체는 검색 엔진이 인덱싱 비용 ↑ + 대시보드 필터 표현이 복잡. \`user.profile.name\` 보다 \`userName\` 평탄화가 운영 친화적.

\`\`\`json
{"level":"INFO","service":"order","traceId":"abc","userId":42,"action":"create","orderId":"ord_01"}
\`\`\`

## 추적 (Tracing)

- 요청 진입 시 **Trace ID** 발급, 하위 호출/로그에 전파.
- 외부 호출은 span으로 감싸 지연 측정.
- OpenTelemetry 표준 준수.

## 민감 정보 마스킹

- PII(이메일, 전화, 주민번호)·시크릿은 **마스킹 또는 제외**.
- 공통 로그 필터에서 자동 마스킹 (개별 코드 의존 금지).

## 모니터링 연동

- 에러 로그는 Sentry/Datadog 등으로 **알림**.
- SLO 지표(응답시간, 에러율)를 메트릭으로 노출.
- 비즈니스 이벤트는 로그 + 메트릭 이중화.

## AI 행동 규칙

- 새 로그 추가 시 **레벨 선택 근거** 의식: 사용자 대응이 필요한가? → ERROR. 정상이지만 주의? → WARN. 비즈니스 이벤트? → INFO. ERROR 남용은 알림 피로 → 진짜 ERROR 무시.
- \`password\`, \`token\`, \`apiKey\`, \`secret\`, \`ssn\`, \`email\`, \`phone\` 같은 키가 로그 인자에 포함된 패턴 발견 시 즉시 마스킹 또는 제거.
- \`catch (e)\` 블록의 로그에 \`err: e\` 또는 stack 포함 — 누락 시 추가.
- 비구조화 출력 → 구조화 logger 교체(base.md 규칙)를 로깅 컨텍스트에서도 강제: logger 호출에 레벨을 명시하고 \`traceId\`를 인자로 전파한다.
  - 근거: base.md는 교체 자체를 규정하나 *레벨 선택·\`traceId\` 전파*는 로깅 고유 책임. 이 둘이 빠지면 교체해도 집계·추적이 불가.

## 패턴 (DO / DON'T)

### PII 마스킹

\`\`\`ts
// DON'T — 평문 PII·시크릿 로깅
logger.info('login', { email: user.email, password: req.body.password });

// DO — 마스킹 + 식별자만
logger.info('login', { userId: user.id, emailMasked: mask(user.email) });
\`\`\`

### 에러 로깅

\`\`\`ts
// DON'T — 반복 이벤트를 ERROR로
catch (e) { logger.error('user retry'); }

// DO — 레벨 구분 + 스택트레이스
catch (e) {
  if (isRetryable(e)) logger.warn({ err: e, attempt }, 'retrying');
  else logger.error({ err: e }, 'unexpected failure');
}
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| 레벨 없는 logger 호출 (전부 INFO) | 레벨 구분 (ERROR/WARN/INFO/DEBUG) |
| 평문 비밀번호/토큰 로깅 | 필터·스키마 기반 마스킹 |
| 중첩된 복잡 JSON 로그 | 평탄한 key-value |
| traceId 전파 누락 | 미들웨어/인터셉터에서 자동 전파 |
`;
