export const frameworkSolid = `---
title: 프레임워크 — SolidJS
stack: frontend
category: 프레임워크
extends: [base.md]
---

# SolidJS

> \`base.md\` 를 상속. JSX 문법을 쓰지만 **React가 아니다.**
> Virtual DOM 없음, reconciliation 없음. signal 기반 fine-grained reactivity.
> 컴파일 후 \`createSignal\` 호출이 곧 의존성 그래프 — 한 signal 변경 시 그 signal을 읽는 정확한 DOM 노드만 업데이트.

## 가장 큰 함정 — Props는 reactive

- props 객체는 **destructure 하면 reactivity 끊김**:
  \`\`\`tsx
  // DON'T
  function Greet({ name }: { name: string }) {
    return <span>{name}</span>;   // name은 첫 값에 고정
  }

  // DO
  function Greet(props: { name: string }) {
    return <span>{props.name}</span>;  // 매번 접근 → reactive
  }
  \`\`\`
- 부분 destructure도 금지. \`splitProps\` / \`mergeProps\` 로 분리.
- 근거: SolidJS는 컴파일러가 \`props.name\` 같은 access pattern을 추적해서 의존성을 등록한다. destructure는 그 시점에 값이 고정.

## Signal — 상태 단위

\`\`\`tsx
const [count, setCount] = createSignal(0);

// 읽기: 함수 호출
console.log(count());

// 쓰기
setCount(1);
setCount((prev) => prev + 1);
\`\`\`

- 읽기가 **함수 호출** — \`count()\`. React의 \`count\` 와 다르다.
- 이게 SolidJS의 핵심 — 의존성을 코드 위치로 추적.

## Memo / Effect

- \`createMemo(() => ...)\` — 파생값. 의존성 자동.
- \`createEffect(() => ...)\` — side effect. 첫 실행 + 의존성 변화마다.
- cleanup: \`onCleanup(() => ...)\` — Effect 내부에서 등록.

## Stores — 객체/배열 reactive

\`\`\`tsx
import { createStore } from 'solid-js/store';

const [state, setState] = createStore({ count: 0, user: { name: '' } });

setState('user', 'name', 'Alice');             // 중첩 path
setState('count', (c) => c + 1);
\`\`\`

- 큰 객체 상태는 store. signal은 primitive에.
- store는 path 기반 set으로 **불변성 자동 처리**.

## 비동기 — Resource

\`\`\`tsx
const [user] = createResource(userId, async (id) => {
  return fetch(\`/api/users/\${id}\`).then(r => r.json());
});

// user() — 데이터
// user.loading — 로딩
// user.error — 에러
\`\`\`

- \`Suspense\` boundary와 자연스럽게 통합.
- 서버 데이터는 항상 \`createResource\` — 직접 fetch + signal 금지.

## Show / For — JSX 흐름 제어

- 조건부: \`<Show when={cond}>\`. React의 \`{cond && ...}\` 대신.
- 리스트: \`<For each={items}>{(item) => <Item ... />}</For>\`. React의 \`map\` 대신.
- 근거: For/Show는 fine-grained 재사용 — 변경된 아이템만 업데이트.

## React 와 다른 점 — AI 가 가장 실수하는 부분

| React | SolidJS |
|-------|---------|
| \`useState\` | \`createSignal\` (읽기 \`count()\`) |
| \`useEffect(() => ..., [a, b])\` | \`createEffect(() => ...)\` (자동 의존성) |
| \`useMemo(() => x, [a, b])\` | \`createMemo(() => x)\` |
| \`useRef\` | \`let ref!: HTMLElement; <div ref={ref!}>\` |
| props destructure OK | props destructure 금지 |
| \`{items.map(...)}\` | \`<For each={items}>...\` |
| \`{cond && ...}\` | \`<Show when={cond}>\` |

## TypeScript

- \`tsconfig\` 의 \`jsx: 'preserve'\` + \`jsxImportSource: 'solid-js'\`.
- 컴포넌트 시그니처: \`(props: Props) => JSX.Element\`.

## 라이프사이클

- \`onMount(() => ...)\` — 마운트 후.
- \`onCleanup(() => ...)\` — unmount 또는 effect 재실행 전.
- \`createEffect\` 안에서 직접 cleanup도 가능.

## 라우팅 / 메타프레임워크

- 라우터: \`@solidjs/router\`.
- SSR / 파일 라우팅 / form action 등 풀스택: **SolidStart**.
- SolidStart는 SvelteKit/Next 와 유사한 컨벤션.

## AI 행동 규칙

- 컴포넌트 시그니처에 props destructure 발견 시 즉시 \`props.x\` 패턴 + 필요시 \`splitProps\`.
- \`useState\` / \`useEffect\` / \`useMemo\` 시도 발견 시 Solid API로 교체.
- 리스트 렌더링에 \`.map()\` 사용 시 \`<For>\` 권고.
- signal 읽기에서 \`count\` (괄호 누락) 사용 시 \`count()\` 로 즉시 수정.
- 서버 데이터에 직접 fetch + signal 패턴 시도 시 \`createResource\` 권고.

## 패턴 (DO / DON'T)

### Props

\`\`\`tsx
// DON'T — destructure → 초기값 고정
function Counter({ count }: { count: number }) {
  return <span>{count}</span>;
}

// DO
function Counter(props: { count: number }) {
  return <span>{props.count}</span>;
}

// 부분 추출 필요 시
import { splitProps } from 'solid-js';
function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ['variant', 'size']);
  return <button class={local.variant} {...rest} />;
}
\`\`\`

### Signal 사용

\`\`\`tsx
// DON'T — 괄호 누락
const [count, setCount] = createSignal(0);
return <span>{count}</span>;   // 함수 자체 출력

// DO
return <span>{count()}</span>;
\`\`\`

### 리스트

\`\`\`tsx
// DON'T (전체 re-render)
{items().map((item) => <Item data={item} />)}

// DO (fine-grained)
<For each={items()}>{(item) => <Item data={item} />}</For>
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| props destructure | \`props.x\` 또는 splitProps |
| signal 읽기에 괄호 누락 | \`count()\` |
| 서버 데이터에 signal + fetch 수동 | \`createResource\` |
| \`{items.map(...)}\` | \`<For each={...}>\` |
| React API (\`useState\` 등) | Solid API (\`createSignal\` 등) |
`;
