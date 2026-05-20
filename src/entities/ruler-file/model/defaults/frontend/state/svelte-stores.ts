export const stateSvelteStores = `---
title: 상태 관리 — Svelte Stores
stack: frontend
category: 상태 관리
extends: [base.md, svelte.md]
---

# Svelte Stores

> Svelte는 **내장 store 시스템**(\`svelte/store\`)을 제공한다. 외부 라이브러리 없이 \`writable\` / \`readable\` / \`derived\` 만으로 대부분의 상태 관리가 끝난다.
> Svelte 5의 \`$state\` runes와 함께 사용 — runes는 컴포넌트 로컬, store는 공유.

## 언제 store / 언제 runes

| 범위 | 도구 |
|------|------|
| 단일 컴포넌트 내부 | \`$state\` (Svelte 5 runes) 또는 일반 변수 |
| 부모-자식 prop 전달 | props |
| 여러 컴포넌트/페이지 공유 | **\`writable\` / \`readable\` store** |
| 라우트별 상태 (SvelteKit) | \`page\` store + load 함수 |

## Store 기본

\`\`\`ts
// stores/cart.ts
import { writable, derived } from 'svelte/store';

export const items = writable<CartItem[]>([]);
export const total = derived(items, ($items) =>
  $items.reduce((s, i) => s + i.price, 0),
);

export const addItem = (item: CartItem) => {
  items.update((list) => [...list, item]);
};
\`\`\`

- store는 \`{ subscribe, set?, update? }\` 인터페이스를 만족하는 객체.
- 컴포넌트에서는 \`$\` prefix로 자동 구독:
  \`\`\`svelte
  <p>Total: {$total}</p>
  <button on:click={() => addItem({...})}>추가</button>
  \`\`\`
- 근거: \`$store\` 문법은 컴파일러가 \`subscribe + unsubscribe\` 를 컴포넌트 lifecycle에 묶어준다. 메모리 누수 자동 방지.

## Writable / Readable / Derived

- **writable** — 일반 mutable store. \`.set\`, \`.update\`, \`.subscribe\`.
- **readable** — 외부에서 set 불가. 생성 시 \`start\` 콜백이 \`set\` 노출.
  - 사용: WebSocket / interval / 외부 이벤트 source.
- **derived** — 다른 store에서 파생. 단일/다중 의존:
  \`\`\`ts
  derived([items, discount], ([$items, $discount]) => ...);
  \`\`\`

## Custom Store 패턴

- 단순 wrapper에 그치지 않고 명시적 API를 노출하라:
  \`\`\`ts
  function createCart() {
    const { subscribe, set, update } = writable<CartItem[]>([]);
    return {
      subscribe,                                     // 외부 노출
      add: (i: CartItem) => update((arr) => [...arr, i]),
      clear: () => set([]),
    };
  }
  export const cart = createCart();
  \`\`\`
- 근거: \`set\` / \`update\` 를 직접 노출하면 외부에서 임의 mutation 가능. closure로 캡슐화하여 의도된 액션만 노출.

## Subscribe 직접 사용

- 컴포넌트 안에서는 항상 \`$store\` 사용 — 직접 subscribe 금지.
  - 근거: 컴포넌트 안 수동 subscribe는 \`onDestroy\` 에 unsubscribe 등록 누락 시 즉시 메모리 누수. \`$\` prefix는 컴파일러가 lifecycle 묶음을 보장.
- 컴포넌트 **밖**(util 함수, 이벤트 핸들러 외부)에서만 직접 subscribe + unsubscribe.
  \`\`\`ts
  const unsub = items.subscribe((v) => { ... });
  // cleanup
  unsub();
  \`\`\`
- non-reactive 1회 읽기: \`get(store)\` from \`svelte/store\` — 컴포넌트 외부에서만.

## Async 데이터

- 단순 fetch는 \`writable\` + load 함수.
- 캐시 / refetch / stale-while-revalidate 가 필요하면 **TanStack Query for Svelte** 또는 SvelteKit의 \`load\` 함수.
- 직접 store로 캐시 로직 짜기 시작하면 RTK Query/Pinia 와 같은 함정 — 무한 재발명.

## 큰 앱 — 도메인별 분할

- store 1개에 모든 상태 X. 도메인별 파일(\`stores/auth.ts\`, \`stores/cart.ts\`).
- cross-store 의존이 강해지면 derived store로 표현.
- 100+ stores 규모면 \`nanostores\` 같은 외부 라이브러리도 검토 — Svelte 외 프레임워크 호환·atom 단위 분할에 유리.

## SvelteKit 특화 store

- \`$app/stores\`: \`page\`, \`navigating\`, \`updated\`.
- \`page\` store는 \`load\` 함수의 결과·url·params 등을 담음.
- 서버에서만 접근 가능한 데이터는 \`load\` 함수에서 반환 → \`$page.data\`.
- \`browser\` import (\`$app/environment\`) — SSR/CSR 분기 시.

## TypeScript

- \`writable<T>(initial)\` — 명시 타입.
- custom store도 \`Readable<T>\` / \`Writable<T>\` 인터페이스 명시:
  \`\`\`ts
  import type { Readable } from 'svelte/store';
  export const total: Readable<number> = derived(...);
  \`\`\`

## Svelte 5 — runes와 store 공존

- 컴포넌트 로컬 reactive: \`let count = $state(0)\` (rune).
- 공유 reactive: store 유지.
- runes가 store를 대체하는 것은 컴포넌트 내부만 — 공유 상태는 여전히 store가 정답.
- store를 rune으로 변환하지 마라 (의미 차이가 명확함).

## AI 행동 규칙

- 공유 상태 추가 시 도메인 파일로 분리.
- 컴포넌트 안 \`store.subscribe(...)\` 발견 시 \`$store\` 문법으로 즉시 교체.
- \`writable\` 의 \`set\` / \`update\` 를 외부에 그대로 export 했다면 custom store 패턴으로 캡슐화 권고.
- HTTP 응답 캐싱 로직을 store에 직접 구현 시도 → TanStack Query / SvelteKit load 사용 권고.

## 패턴 (DO / DON'T)

### 자동 구독

\`\`\`svelte
<!-- DON'T — 수동 subscribe / cleanup -->
<script>
  import { onDestroy } from 'svelte';
  import { items } from './stores/cart';
  let value;
  const unsub = items.subscribe((v) => (value = v));
  onDestroy(unsub);
</script>

<!-- DO — $ prefix 자동 구독 -->
<script>
  import { items } from './stores/cart';
</script>
{#each $items as item}{item.name}{/each}
\`\`\`

### Custom store 캡슐화

\`\`\`ts
// DON'T — set/update 그대로 노출 (외부 임의 mutation 가능)
export const cart = writable<CartItem[]>([]);

// DO — 액션 메서드만 노출
function createCart() {
  const { subscribe, update, set } = writable<CartItem[]>([]);
  return {
    subscribe,
    add: (i: CartItem) => update((arr) => [...arr, i]),
    clear: () => set([]),
  };
}
export const cart = createCart();
\`\`\`

### Derived

\`\`\`ts
// DO
const total = derived(items, ($items) =>
  $items.reduce((s, i) => s + i.price, 0),
);

// DO — 다중 의존
const summary = derived([items, discount], ([$items, $discount]) => ({
  count: $items.length,
  net: $items.reduce((s, i) => s + i.price, 0) - $discount,
}));
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| 컴포넌트 안 수동 subscribe | \`$store\` 자동 구독 |
| \`writable\` 그대로 export | custom store로 액션 캡슐화 |
| 서버 응답 캐싱을 store로 자체 구현 | TanStack Query / SvelteKit load |
| 한 store에 도메인 다 몰기 | 도메인 파일 분할 |
| store를 SSR 모듈 스코프에 평가 후 변경 | per-request 격리 (SvelteKit \`load\`) |
`;
