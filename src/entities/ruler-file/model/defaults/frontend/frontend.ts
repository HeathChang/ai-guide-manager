export const frontendFrontend = `---
title: 프론트엔드 공통
stack: frontend
category: 공통
extends: [base.md]
---

# Frontend Rules (React)

> \`base.md\` 규칙을 상속한다. React 프론트엔드에 추가로 적용되는 규칙이다.

## 컴포넌트 기본 원칙

- **함수 컴포넌트만** 사용한다. 클래스형 금지.
- 한 컴포넌트 파일이 **200줄 초과 시** 분리를 검토한다.
- \`default export\`는 **Page 컴포넌트**에서만 허용한다. 그 외는 named export.

## 컴포넌트 역할 분리

### Presentational — \`{Name}.ui.tsx\`

- UI 렌더링만 담당한다.
- 비즈니스 로직, API 호출, 전역 상태 접근 금지.
- Props로만 데이터를 받는다.

### Container — \`{Name}.container.tsx\`

- 비즈니스 로직, Hook 사용, 데이터 가공 담당.
- UI를 직접 렌더링하지 않고 Presentational에 위임한다.

### Page — \`{Name}.page.tsx\`

- 라우트 단위 책임만 갖는다.
- path param / query 검증, redirect 처리.

## Hooks

- 커스텀 훅은 \`useXxx\` 형태로 작성한다.
- 훅에서 **JSX 반환 금지**.
- 하나의 훅은 **데이터 / 상태 / 액션** 중 하나의 관심사만 담당.

## 상태 관리

| 상태 유형 | 도구 |
|-----------|------|
| 서버 상태 | React Query / RTK Query (\`fetch\` 직접 사용 금지) |
| 로컬 UI 상태 | useState / useReducer |
| 공유 UI 상태 | Context (최소 범위 Provider) |

- UI 상태와 서버 상태를 같은 store에 섞지 않는다.

## 접근성 필수

- \`<img>\` → \`alt\` 필수 (장식용은 \`alt=""\`)
- \`<input>\` → \`<label>\` 또는 \`aria-label\`
- 클릭 영역은 \`<button>\` / \`<a>\` 사용 (\`div + onClick\` 금지)
- 아이콘 버튼 → \`aria-label\` 필수

## AI 행동 규칙

- 컴포넌트 생성 시 역할(UI / Container / Page)을 먼저 결정한다.
- 성능 최적화는 **측정 후** 적용한다. 추측 기반 \`memo\` / \`useMemo\` 금지.

## 패턴 (DO / DON'T)

### 클릭 요소

\`\`\`tsx
// DON'T — 키보드 접근 불가, 시맨틱 부재
<div onClick={handleClick}>저장</div>

// DO
<button type="button" onClick={handleClick}>저장</button>
\`\`\`

### Props 타입

\`\`\`tsx
// DON'T
type Props = { data: any };

// DO
type Props = { data: UserDto };
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| 색상·간격·폰트 크기 하드코딩 | 디자인 토큰 (\`text-text-main\`, \`p-4\`) |
| props drilling 3단계 이상 | Context / 컴포넌트 재구성 |
| \`fetch\` 직접 호출 | React Query / RTK Query |
| 클래스 컴포넌트 | 함수 컴포넌트 + Hooks |
`;
