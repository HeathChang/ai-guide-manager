export const frontendBase = `---
title: 기본 코딩 규칙
stack: frontend
category: 공통
extends: []
---

# Base Coding Rules

> 모든 코드에 적용되는 기본 규칙이다. 다른 ruler 파일은 이 규칙을 상속한다.

## 기본 원칙

- 모든 응답/설명은 **한국어**로 작성한다.
- 추측하지 않는다 — 불확실하면 질문한다.
- 가정이 필요하면 \`"다음과 같이 가정하고 진행합니다"\`를 명시한다.
- 규칙 위반이 불가피한 경우 **이유를 주석으로 명시**한다.

## TypeScript

### 절대 금지

- \`any\` 타입 → \`unknown\` + 런타임 타입 가드 사용
- \`@ts-ignore\` / \`@ts-expect-error\` 남발 → 근본 원인 해결
- 숫자 \`enum\` → \`as const\` + union type 사용

### 필수

- \`strict: true\` 환경을 전제로 작성한다.
- 제네릭은 의미 있는 이름(\`TItem\`, \`TResponse\`)을 사용한다.

## 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 변수 / 함수 | camelCase | \`getUserName\` |
| 컴포넌트 / 타입 | PascalCase | \`UserProfile\` |
| 상수 | SCREAMING_SNAKE_CASE | \`MAX_RETRY\` |
| boolean | is/has/can/should 접두어 | \`isLoading\` |

## 함수

- 함수명은 **동사로 시작**한다 (\`getUser\`, \`validateInput\`).
- 가능한 한 **순수 함수**로 작성한다.
- 중첩 조건문 대신 **Early Return**을 사용한다.
- 매개변수가 3개 초과면 **객체 파라미터**로 변경한다.

## AI 행동 규칙

- 작업 시작 전 관련 ruler 파일을 먼저 읽는다.
- 파일이 200줄을 넘으면 분리를 검토한다.
- 사용하지 않는 import는 즉시 제거한다.

## 패턴 (DO / DON'T)

### any 타입

\`\`\`ts
// DON'T
function parse(data: any) { return data.id; }

// DO
function parse(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'id' in data) {
    return String(data.id);
  }
  throw new Error('invalid data');
}
\`\`\`

### Early Return

\`\`\`ts
// DON'T
function check(user) {
  if (user) {
    if (user.active) {
      if (user.verified) { return true; }
    }
  }
  return false;
}

// DO
function check(user) {
  if (!user) return false;
  if (!user.active) return false;
  if (!user.verified) return false;
  return true;
}
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| \`console.log\` / \`console.warn\` 디버깅용 커밋 | 전용 logger 유틸 또는 삭제 후 커밋 |
| 하드코딩된 API URL, 시크릿, 토큰 | 환경 변수 (\`import.meta.env.*\`) |
| 주석 처리된 코드 블록 | 삭제 (git history에 남음) |
| 설명 없는 \`TODO\` | \`TODO(username, 2026-05): 이유/티켓 링크\` |
`;
