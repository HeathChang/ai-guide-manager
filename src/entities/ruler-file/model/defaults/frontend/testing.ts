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
  - 근거: 리팩토링의 정의 = 동작은 같고 구조만 변경. 테스트가 없으면 "동작이 같다"를 증명할 도구가 없음 = 사실상 무모한 변경.
- 테스트는 **구현이 아닌 동작**을 검증 (내부 상태 직접 접근 금지).
  - 근거: 구현에 결합된 테스트는 동일 동작의 리팩토링에도 깨진다 — 테스트가 *리팩토링의 적*이 됨. 사용자 관찰 가능한 동작만 검증하면 내부 구조 자유롭게 변경 가능.
- **모킹 최소화** — 내부 모듈 모킹은 설계 문제의 신호.
  - 근거: 내부 모듈을 mock 해야 한다 = 그 모듈에 너무 강하게 결합 = 책임 분리 실패. mock 없이 테스트할 수 있게 의존성 역전을 검토한다.
- 각 테스트는 **하나의 동작**만 검증.
- 테스트 간 독립성 유지 (실행 순서 비의존).
  - 근거: 순서 의존 테스트는 병렬 실행·셔플 시 깨진다. CI 환경에서 flaky의 가장 흔한 원인.

## AI 행동 규칙

- 순수 함수 추가 시 **같은 PR에** 테스트 파일도 작성. 별도 PR로 미루지 마라.
- custom hook 추가 시 \`renderHook\` 테스트 작성 — 단순 렌더 검증이라도.
- flaky 테스트 발견 시(같은 input에서 결과가 다름) **고치기 전까지 머지 금지**. \`it.skip\` 으로 잠시 비활성 후 이슈 트래커에 등록.
- 시간(\`Date.now()\`, \`setTimeout\`) / 랜덤 / 네트워크가 들어간 테스트는 fake timer / seed / MSW 등으로 결정성 확보 — 그 처리 없이는 테스트 작성 금지.

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
