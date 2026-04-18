export const frontendTesting = `---
title: 테스트
stack: frontend
category: 품질
extends: [base.md]
---

# Frontend Testing

> \`base.md\` 규칙을 상속한다. 테스트 코드 규칙이다.

## 테스트 필수 대상

| 대상 | 도구 | 수준 |
|------|------|------|
| 순수 함수 (utils, helpers) | Jest / Vitest | 필수 |
| Custom Hook | renderHook | 필수 |
| Presentational Component | Storybook + Testing Library | 권장 |
| 페이지 주요 플로우 | Playwright / Cypress | 권장 |

## 파일 위치 / 네이밍

- 테스트 파일은 대상과 **같은 디렉토리**.
- 네이밍: \`{대상}.test.ts(x)\`

## 네이밍 규칙

프로젝트는 **should 형식**을 기본으로 한다.

\`\`\`ts
describe('validateEmail', () => {
  it('should return true for valid email', () => { ... });
});
\`\`\`

## 테스트 원칙

- **테스트 없는 리팩토링 금지**. 기존 테스트가 없으면 먼저 테스트 추가.
- 테스트는 **구현이 아닌 동작**을 검증 (내부 상태 직접 접근 금지).
- **모킹 최소화** — 내부 모듈 모킹은 설계 문제의 신호.
- 각 테스트는 **하나의 동작**만 검증.
- 테스트 간 독립성 유지 (실행 순서 비의존).

## AI 행동 규칙

- 순수 함수 추가 시 테스트 파일을 **함께** 작성한다.
- custom hook 추가 시 renderHook 테스트를 작성한다.
- flaky 테스트는 고치기 전까지 머지 금지.

## 패턴 (DO / DON'T)

### 동작 검증

\`\`\`ts
// DON'T — 내부 구현(state)에 결합
expect(component.state.count).toBe(1);

// DO — 사용자 관점의 관찰 가능한 동작
expect(screen.getByText('카운트: 1')).toBeInTheDocument();
\`\`\`

### 시간 의존

\`\`\`ts
// DON'T — flaky
if (Date.now() > expiresAt) { ... }

// DO — fake timer 사용
vi.useFakeTimers();
vi.setSystemTime(new Date('2026-01-01'));
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| \`any\` / \`as any\`로 mock 타입 우회 | 실제 타입 기반 mock (\`vi.mocked\`) |
| test 내 \`console.log\` 잔존 | 디버깅 후 삭제 |
| 내부 모듈 과도 모킹 | 경계(HTTP, DB)에서만 모킹 |
`;
