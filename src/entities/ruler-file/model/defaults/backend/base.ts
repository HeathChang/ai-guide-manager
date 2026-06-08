export const backendBase = `---
title: 기본 코딩 규칙
stack: backend
category: 공통
extends: []
---

# Base Coding Rules

> 모든 백엔드 코드에 적용되는 기본 규칙이다. 다른 ruler 파일은 이 규칙을 상속한다.

## 기본 원칙

- 모든 응답/설명은 **한국어**로 작성한다.
- 추측하지 않는다 — 불확실하면 질문한다.
- 규칙 위반이 불가피한 경우 **이유를 주석으로 명시**한다.

## 언어 공통

- 정적 타입 언어는 **엄격한 컴파일러/린트 옵션** 사용 (TS strict, Kotlin explicit API, Go는 vet + staticcheck).
  - 근거: 엄격 옵션 없이 작성된 코드는 *컴파일 통과 = 안전* 이라는 잘못된 자신감을 준다. nullable 누락, 사용 안 한 변수, 누락된 return — 모두 런타임 버그로 이어진다.
- null 처리 정책을 명시 (Optional / nullable / sentinel 중 하나로 통일).
  - 근거: 한 코드베이스에 \`null\`, \`undefined\`, \`Optional.empty()\`, \`""\` 가 섞이면 *무엇이 비어있음인지* 매번 결정해야 한다. 통일하면 검사 코드 패턴이 하나로 수렴.
- 예외/에러는 **클래스/타입으로 분류**, 문자열 비교 금지.
  - 근거: \`err.message.includes('not found')\` 같은 문자열 비교는 메시지 텍스트 변경 한 번에 무너진다. 타입 분류(\`instanceof UserNotFoundError\`)는 컴파일러가 추적.

## 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 변수 / 함수 | camelCase (또는 snake_case — 언어 컨벤션) | \`getUserById\` |
| 타입 / 클래스 | PascalCase | \`UserRepository\` |
| 상수 | SCREAMING_SNAKE_CASE | \`MAX_RETRY\` |
| boolean | is/has/can/should | \`isActive\` |
| 패키지 | 소문자, 도메인-중심 | \`user\`, \`order.payment\` |

## 함수

- 함수명은 **동사로 시작**.
- 하나의 함수는 **하나의 책임**.
- 매개변수 3개 초과 시 **파라미터 객체**로 변경.
- 순수 함수로 추출 가능한 로직은 분리.

## 에러 핸들링

- **예상 가능한 에러**(입력, 네트워크)와 **예상 불가 에러**(버그)를 구분.
  - 근거: 예상 가능한 에러는 사용자에게 안내 + 재시도, 예상 불가 에러는 알람 + 모니터링. 둘을 같은 catch에서 같은 식으로 다루면 사용자에게 stack trace 노출 / 진짜 버그가 무시되는 사고.
- catch 블록에서 에러를 **삼키지 않는다** — 최소한 로깅.
  - 근거: 빈 catch는 디버깅 지옥의 1번 원인. 에러가 발생했는데 *어디서 발생했는지* 흔적이 사라진다.
- 사용자 노출 메시지는 **기술 용어 회피**.
  - 근거: \`NullPointerException at line 42\` 같은 메시지는 사용자가 행동을 결정할 수 없고 *공격자에게 내부 구조 정보 제공*.

## AI 행동 규칙

- 새 파일/엔드포인트 생성 직전: 작업 디렉토리의 \`ruler/*.md\` 중 *관련 카테고리* 룰을 먼저 Read.
- 타입/스키마(zod, JSON Schema, Pydantic, JPA Entity 등)를 **구현보다 먼저 정의**.
- 주석은 **왜(why)**만 — \`// 입력 검증\` 같은 무엇 주석 금지. \`// reason: <뭐가 왜 필요한지>\` 로.
- catch 블록 발견 시 — 로깅이 있는지 확인. 없으면 logger 호출 추가.

## 패턴 (DO / DON'T)

### 에러 분류

\`\`\`ts
// DON'T — 문자열 비교, 삼킴
try { ... } catch (e) {
  if (e.message.includes('not found')) return null;
}

// DO — 타입 기반 분류 + 로깅
try { ... } catch (e) {
  if (e instanceof UserNotFoundError) return null;
  logger.error({ err: e }, 'unexpected error');
  throw e;
}
\`\`\`

### 파라미터 객체

\`\`\`ts
// DON'T — 순서 실수 위험
function create(name, email, role, orgId, teamId) { ... }

// DO — 명시적 키
function create(params: { name: string; email: string; role: Role; orgId: string; teamId: string }) { ... }
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| \`System.out\` / \`fmt.Println\` / \`console.log\` 커밋 | 구조화 logger |
| 하드코딩된 시크릿 | 환경 변수 / 시크릿 매니저 |
| 주석 처리된 코드 | 삭제 (git history 보존) |
| 설명 없는 \`TODO\` | \`TODO(owner, date): 이유/티켓\` |
`;
