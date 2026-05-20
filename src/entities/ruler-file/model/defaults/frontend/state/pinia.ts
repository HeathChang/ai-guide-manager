export const statePinia = `---
title: 상태 관리 — Pinia
stack: frontend
category: 상태 관리
extends: [base.md, vue.md]
---

# Pinia

> Vue 3 공식 상태 관리. Vuex 5 가 될 예정이었던 라이브러리가 그대로 표준이 됐다.
> Composition API 친화, TypeScript first, devtools 통합 — **Vue 3 신규 프로젝트는 무조건 Pinia**.

## 설치 / 등록

- \`pinia\` + Vue 3.
- \`main.ts\`에서 \`app.use(createPinia())\` 한 번.
- SSR(Nuxt): per-request 인스턴스. Nuxt 3는 \`@pinia/nuxt\` 모듈이 자동 처리.

## Store 작성 — Setup 문법 권장

\`\`\`ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useCartStore = defineStore('cart', () => {
  // state
  const items = ref<CartItem[]>([]);
  // getters
  const total = computed(() => items.value.reduce((s, i) => s + i.price, 0));
  // actions
  const addItem = (item: CartItem) => items.value.push(item);
  const clear = () => { items.value = []; };
  return { items, total, addItem, clear };
});
\`\`\`

- **Setup 문법**(함수 반환) 이 Options 문법(\`state/getters/actions\` 객체)보다 권장.
  - 근거: Composition API와 동일한 문법 → 학습 부담 없음. composable과 자유롭게 조합 가능. TS 추론 더 깔끔.
- store id(\`'cart'\`)는 전역 유일 — 모듈 prefix 권장: \`'cart/main'\` 등 의미 있는 이름.

## 한 store = 한 도메인

- 거대 store 1개 금지. 도메인 단위로 분할.
- cross-store 접근: 한 store 안에서 다른 \`useOtherStore()\` 호출 OK.
- 순환 의존 발생하면 store 외부 함수로 추출 또는 한쪽을 합치는 방향.

## 컴포넌트에서 사용

\`\`\`vue
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useCartStore } from '@/stores/cart';

const cart = useCartStore();
const { items, total } = storeToRefs(cart);   // 리액티비티 유지 destructure
const { addItem, clear } = cart;              // 액션은 그냥 destructure OK
</script>
\`\`\`

- **\`storeToRefs()\` 필수** — 단순 destructure는 reactive 연결 끊김.
  - 근거: \`cart.items\` 는 reactive ref, destructure하면 일반 변수로 분리되어 더 이상 추적 안 됨. \`storeToRefs\`는 ref 형태로 보존.
- 액션은 reactive 객체가 아니므로 일반 destructure로 OK.

## State 변경 규칙

세 단계 계단:

1. **금지** — 컴포넌트에서 store state 직접 대입 (\`cart.items = []\`).
2. **표준** — store에 정의된 action 호출 (\`cart.clear()\`, \`cart.addItem(item)\`).
3. **허용 (action 내부만)** — 액션 함수 안에서는 \`items.value = []\` 같은 직접 변경 OK.

- 여러 필드 동시 변경은 \`store.$patch({...})\` 또는 \`store.$patch((state) => {...})\`:
  \`\`\`ts
  cart.$patch({ items: [], total: 0 });   // 한 번의 reactivity 트리거
  \`\`\`
  - 근거: 개별 대입은 각각 update를 일으킴. $patch는 한 번에 묶음 → 미세 성능 + 의도 명확.
- 근거(왜 컴포넌트 직접 변경 금지): action 경계를 두면 devtools에서 변경 출처를 추적 가능. 컴포넌트 직접 변경은 누가 언제 바꿨는지 grep으로만 찾아야 한다. 중대형 앱에서 디버깅 비용 폭증.

## Reset

- Setup 문법은 \`$reset\` 기본 동작이 없음 → 직접 reset action 작성:
  \`\`\`ts
  const reset = () => { items.value = []; };
  \`\`\`
- Options 문법만 자동 \`$reset()\` 지원.

## Getter (computed)

- 파생값은 항상 \`computed()\` (Setup) 또는 \`getters\` (Options).
- 다른 store의 getter 참조도 자유 (\`const other = useOtherStore()\`).

## Action

- 동기/비동기 둘 다 가능. \`async\` action OK.
- action 안에서 \`this\` 의 의미는 Options 문법에만 존재 (state/getter 접근). Setup 문법은 closure로 접근.

## Subscribe

- \`store.$subscribe((mutation, state) => {...})\` — 디버깅/로깅용.
- 실제 비즈니스 로직은 action 안에서 처리. $subscribe는 횡단 관심사(로깅, persistence) 에만.

## 영속화

- 공식 플러그인 없음 → \`pinia-plugin-persistedstate\` 사용:
  \`\`\`ts
  defineStore('cart', () => {...}, { persist: true });
  \`\`\`
- 일부 필드만 저장: \`persist: { paths: ['items'] }\`.

## TypeScript

- defineStore의 반환 타입이 자동. 명시적 \`interface CartState\` 불필요.
- 외부에서 store 타입이 필요하면 \`type CartStore = ReturnType<typeof useCartStore>\`.

## SSR (Nuxt)

- \`@pinia/nuxt\` 사용 — auto-import + per-request 인스턴스.
- store 초기화에서 \`window\` / \`document\` 접근 금지 → \`onMounted\` 또는 \`if (process.client)\`.

## 서버 상태와의 관계

- Vue Query (\`@tanstack/vue-query\`) 와 병행 권장.
- HTTP 캐시는 Vue Query, 클라이언트 상태(폼, UI 토글, 인증 토큰)는 Pinia.

## AI 행동 규칙

- 새 store 추가 시: 도메인 1개당 1 store. 5개 이상 필드면 분할 검토.
- 컴포넌트에서 \`const { x } = cart\` 발견하면 → \`storeToRefs\` 로 교체 (x가 state/getter면).
- 직접 \`store.x = y\` mutation 발견 시 → action으로 위임 권고.
- 새 store는 Setup 문법으로.

## 패턴 (DO / DON'T)

### Destructure

\`\`\`vue
<script setup>
// DON'T — 리액티비티 끊김
const { items, total } = useCartStore();

// DO
const cart = useCartStore();
const { items, total } = storeToRefs(cart);
const { addItem } = cart;
</script>
\`\`\`

### Batch mutation

\`\`\`ts
// DON'T — reactivity 두 번
cart.items = [];
cart.discount = 0;

// DO — 한 번
cart.$patch({ items: [], discount: 0 });
\`\`\`

### Setup vs Options

\`\`\`ts
// DO — Setup (권장)
export const useUser = defineStore('user', () => {
  const name = ref('');
  const setName = (v: string) => { name.value = v; };
  return { name, setName };
});

// 가능하지만 비추 — Options
export const useUser = defineStore('user', {
  state: () => ({ name: '' }),
  actions: { setName(v: string) { this.name = v; } },
});
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| store 직접 destructure | \`storeToRefs()\` |
| 여러 필드 개별 대입 | \`$patch\` |
| 컴포넌트에서 \`store.x = y\` mutation | action 호출 |
| HTTP 응답 캐시를 store에 자체 구현 | Vue Query + Pinia |
| Options 문법 새로 시작 | Setup 문법 |
`;
