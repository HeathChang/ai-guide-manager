export const frameworkSvelte = `---
title: 프레임워크 — Svelte 5
stack: frontend
category: 프레임워크
extends: [base.md]
---

# Svelte 5

> \`base.md\` 를 상속. Svelte 5 (runes) 전제. Svelte 4 이전 문법은 신규 코드 금지.
> Svelte는 컴파일러 — 런타임 가상 DOM 없음, 빌드 시점에 반응성 코드 생성.

## Runes — 새 반응성 모델

| Rune | 역할 |
|------|------|
| \`$state(initial)\` | reactive 상태 |
| \`$derived(expr)\` | 파생값 (메모, 자동) |
| \`$effect(() => ...)\` | side effect, cleanup 반환 |
| \`$props()\` | 컴포넌트 props |
| \`$bindable()\` | 양방향 바인딩 허용 props |

\`\`\`svelte
<script lang="ts">
  let count = $state(0);
  let doubled = $derived(count * 2);
  $effect(() => {
    document.title = \`count: \${count}\`;
    return () => { document.title = ''; };
  });
</script>

<button onclick={() => count++}>{doubled}</button>
\`\`\`

- Svelte 4의 \`let count = 0\` 자동 reactive는 **legacy**. 신규는 \`$state\` 명시.
- \`$:\` 라벨 reactive 문법도 legacy → \`$derived\` / \`$effect\` 로.

## Props

\`\`\`svelte
<script lang="ts">
  let { id, count = 0, name }: { id: string; count?: number; name: string } = $props();
</script>
\`\`\`

- \`export let\` 은 legacy.
- 기본값은 destructure 패턴으로.
- 양방향 바인딩은 \`$bindable()\`:
  \`\`\`ts
  let { value = $bindable('') }: { value: string } = $props();
  \`\`\`

## 이벤트

- Svelte 5: **\`onclick\`** (소문자, DOM 표준에 가까움).
- Svelte 4의 \`on:click\` 은 legacy.
- 이벤트 modifier (\`|preventDefault\`)는 함수 합성으로 대체:
  \`\`\`svelte
  <form onsubmit={(e) => { e.preventDefault(); save(); }}>
  \`\`\`

## Snippets — children 대체

- Svelte 4의 \`<slot>\` 은 \`{#snippet}\` 으로 진화:
  \`\`\`svelte
  <!-- Parent -->
  <Modal>
    {#snippet header()}<h2>Title</h2>{/snippet}
    {#snippet body()}<p>content</p>{/snippet}
  </Modal>

  <!-- Modal.svelte -->
  <script>
    let { header, body } = $props();
  </script>
  <div>{@render header()}</div>
  <div>{@render body()}</div>
  \`\`\`

## 컴포넌트 통신

- 부모 → 자식: props.
- 자식 → 부모: **callback prop** (이벤트 dispatcher는 Svelte 5에서 제거 방향):
  \`\`\`svelte
  let { onSelect }: { onSelect: (id: string) => void } = $props();
  <button onclick={() => onSelect('x')}>...</button>
  \`\`\`
  - 근거: \`createEventDispatcher\` 는 Svelte 5에서 deprecated. 콜백 prop은 타입 추론이 더 강하고 (제네릭 매개변수 OK), DOM 이벤트와 동일 시그니처(\`onclick\`)라 학습 부담이 없다.
- 깊은 트리: context API (\`setContext\` / \`getContext\`).
- 전역: Svelte Stores (\`state/svelte-stores.md\`).

## Style

- \`<style>\` 기본 스코프(컴포넌트 격리).
- 글로벌: \`:global(.x)\`.
- Tailwind 사용 시 컴포넌트 단위 \`<style>\` 최소화 (대부분 class).

## TypeScript

- \`<script lang="ts">\` 항상.
- 컴포넌트 타입은 컴파일러 자동 추론. 외부에서 export 필요하면:
  \`\`\`ts
  import type { Component } from 'svelte';
  type ButtonProps = { label: string; onClick: () => void };
  declare const Button: Component<ButtonProps>;
  \`\`\`

## 라이프사이클

- \`onMount\`, \`onDestroy\` 는 유지 (\`svelte\` import).
- 또는 \`$effect\` 의 cleanup 함수 반환으로 통일 — runes 권장 형태.
- \`beforeUpdate\` / \`afterUpdate\` 는 deprecated.

## 비동기 / await 블록

\`\`\`svelte
{#await promise}
  <Spinner />
{:then value}
  <View {value} />
{:catch error}
  <Error {error} />
{/await}
\`\`\`

- 컴포넌트 안 비동기 렌더링에 권장. Suspense 패턴.

## 빌드 / Vite

- 신규는 Vite + \`@sveltejs/vite-plugin-svelte\` 또는 SvelteKit (다음 파일 참고).
- vanilla Svelte 5 + Vite로 시작하는 SPA는 충분히 가능.

## AI 행동 규칙

- \`let x = 0\` 으로 reactive 변수 시도 → \`$state(0)\` 으로 교체.
- \`$:\` 라벨 사용 시 \`$derived\` / \`$effect\` 로 마이그레이션.
- \`on:click\` 사용 시 \`onclick\` 으로 교체.
- \`export let\` 사용 시 \`$props()\` 패턴으로 교체.
- 새 컴포넌트는 무조건 runes로.

## 패턴 (DO / DON'T)

### Reactive 상태

\`\`\`svelte
<!-- DON'T (legacy) -->
<script>
  let count = 0;
  $: doubled = count * 2;
</script>

<!-- DO -->
<script lang="ts">
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>
\`\`\`

### Props

\`\`\`svelte
<!-- DON'T (legacy) -->
<script>
  export let id;
  export let count = 0;
</script>

<!-- DO -->
<script lang="ts">
  let { id, count = 0 }: { id: string; count?: number } = $props();
</script>
\`\`\`

### 이벤트

\`\`\`svelte
<!-- DON'T (legacy) -->
<button on:click={handle}>...</button>

<!-- DO -->
<button onclick={handle}>...</button>
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| \`let x = 0\` 으로 reactive | \`$state(0)\` |
| \`$:\` 라벨 | \`$derived\` / \`$effect\` |
| \`on:click\` | \`onclick\` |
| \`export let\` | \`$props()\` |
| \`<slot>\` | \`{#snippet}\` + \`{@render}\` |
| createEventDispatcher | callback prop |

## 적용 범위와 경계

이 문서는 **Svelte 5 (runes)** 컴포넌트 작성만 다룬다. Svelte 4 이전 문법(\`export let\`, \`$:\`)의 신규 작성에는 적용하지 않는다.

여기서 다루지 않는 것 → 라우팅·\`load\`·SSR·Form Actions 는 \`sveltekit.md\`, 컴포넌트 간 공유 상태는 \`svelte-stores.md\`, 클래스·토큰은 \`styling.md\`, 접근성은 \`a11y.md\`.

**이 문서는 React 규칙(\`frontend.md\`)과 함께 쓰지 않는다.** 두 문서가 같이 로드돼 있으면 진행하지 말고 유저에게 어느 프레임워크인지 묻는다.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **룬 vs Svelte 4 문법** — 새 코드는 룬이 이긴다. 기존 파일을 일괄 변환할지는 유저에게 확인한다.
- **\`$derived\` vs \`$effect\`** — 값을 파생시키는 목적이면 \`$derived\` 가 이긴다. \`$effect\` 안에서 상태를 대입해 값을 만들지 마라.
- **컴포넌트 지역 상태 vs store** — 한 컴포넌트 안에서만 쓰면 \`$state\` 가 이긴다. 공유가 필요할 때만 store 로 올린다.
- **SvelteKit 프로젝트에서 이 문서와 \`sveltekit.md\` 가 다를 때** — \`sveltekit.md\` 가 이긴다.

## 자가 점검

컴포넌트를 제출하기 전 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] 상태를 \`$state\` 로 선언했다 — \`export let\` / \`$:\` 를 새로 쓰지 않았다
- [ ] 파생 값을 \`$derived\` 로 계산했다 — \`$effect\` 안에서 대입으로 만들지 않았다
- [ ] \`$effect\` 마다 정리(cleanup)가 필요한지 확인했고, 필요하면 반환했다
- [ ] props 를 \`$props()\` 로 받고 타입을 붙였다
- [ ] 양방향이 필요한 prop 에만 \`$bindable()\` 을 썼다
- [ ] \`children\` 대신 snippet 을 썼다
- [ ] 이 컴포넌트에서만 쓰는 상태를 store 로 올리지 않았다
- [ ] 접근성 최소선(\`alt\`, label, \`<button>\`, \`aria-label\`)을 통과한다
`;
