export const frontendTesting = `# Frontend Testing

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

## 네이밍 규칙 (하나로 통일)

### should 형식

\`\`\`ts
describe('validateEmail', () => {
  it('should return true for valid email', () => { ... });
});
\`\`\`

### given/when/then 형식

\`\`\`ts
describe('validateEmail', () => {
  describe('given a valid email', () => {
    it('returns true', () => { ... });
  });
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

## 금지 패턴

- \`any\` / \`as any\`로 mock 타입 우회
- 시간 의존 테스트에서 실제 \`Date.now()\` 사용 (fake timer 사용)
- test 내 \`console.log\` 잔존
`;
