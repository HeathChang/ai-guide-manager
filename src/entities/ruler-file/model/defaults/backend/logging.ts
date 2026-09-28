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
  - 근거: 개별 호출자가 매번 기억해서 가리는 방식은 언젠가 반드시 한 곳을 빠뜨린다. 그 한 줄이 PII 유출이다. 필터는 빠뜨릴 수 없는 위치에 둔다.

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

## 적용 범위와 경계

이 문서는 **애플리케이션이 무엇을 어떤 형식으로 남기는가**만 다룬다. 로그 수집·저장·대시보드 구성(ELK, Loki, Datadog 설정)은 다루지 않는다.

여기서 다루지 않는 것 → 에러를 어떻게 분류하고 응답할지는 \`error-handling.md\`, 무엇이 민감 정보인지의 정의는 \`security.md\`, 인증 이벤트의 감사 요건은 \`auth.md\`.

**이 문서는 알림 정책을 정하지 않는다.** 어떤 ERROR 가 사람을 깨울지는 운영 결정이다. 임의로 알림 임계값을 만들지 말고 유저에게 확인한다.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **마스킹 vs 디버깅 편의** — 마스킹이 이긴다. 문제를 재현하려고 PII 를 평문으로 남기지 않는다. 필요하면 식별자(해시·ID)만 남긴다.
- **구조화 로깅 vs 기존 문자열 로그** — 새 코드는 구조화가 이긴다. 기존 문자열 로그를 일괄 변경할지는 유저에게 확인한다.
- **로그 추가 vs 노이즈** — 판단이 갈리면 남기지 않는 쪽이 기본값이다. 모든 것을 INFO 로 남기면 정작 중요한 이벤트가 묻힌다.
- **\`catch\` 블록에서는 예외다** — 로그를 남기지 않는 선택지가 없다. 최소한 ERROR 또는 WARN 으로 기록한다.

## 자가 점검

로깅 코드를 추가·수정한 뒤 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] \`console.log\` / \`System.out\` / \`print\` 대신 구조화 logger 를 썼다
- [ ] 로그가 JSON 이고 \`timestamp\`, \`level\`, \`service\`, \`traceId\`, \`message\` 를 포함한다
- [ ] 로그 레벨이 정의에 맞다 — 정상 흐름을 ERROR 로 남기지 않았다
- [ ] 요청 진입점에서 Trace ID 를 발급하고 하위 호출에 전파한다
- [ ] 로그 인자에 비밀번호·토큰·시크릿·PII 가 평문으로 들어가지 않는다
- [ ] 마스킹이 공통 필터에 있다 — 개별 호출자가 기억해서 가리는 방식이 아니다
- [ ] 새로 추가한 \`catch\` 블록에 로깅이 있다
- [ ] DEBUG/TRACE 로그가 프로덕션 설정에서 꺼져 있다
`;
