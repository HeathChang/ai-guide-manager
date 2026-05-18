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

- 신규는 Vite + \`svelte-vite-plugin\` 또는 SvelteKit (다음 파일 참고).
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
`;
