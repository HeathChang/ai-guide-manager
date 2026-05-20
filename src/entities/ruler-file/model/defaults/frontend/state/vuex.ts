export const stateVuex = `---
title: 상태 관리 — Vuex
stack: frontend
category: 상태 관리
extends: [base.md, vue.md]
---

# Vuex

> **⚠️ Legacy**
> Vue 3 신규 프로젝트는 **Pinia**를 사용한다. Vuex 4는 Vue 3 호환을 위한 마지막 메이저이며 사실상 maintenance 모드다.
> 본 문서는 이미 Vuex를 사용 중인 코드베이스의 안전한 운영 + Pinia 마이그레이션을 위한 규칙이다.

## 구조

- store는 **module로 분할**, 루트 store에 \`combine\`.
- 각 모듈은 \`namespaced: true\` **필수**.
  - 근거: 같은 mutation/action 이름이 다른 모듈에 있을 때 충돌 방지. namespaced가 아니면 같은 이름이 모든 모듈에서 호출된다.

\`\`\`ts
const cartModule = {
  namespaced: true,
  state: () => ({ items: [] }),
  mutations: { ADD_ITEM(state, item) { state.items.push(item); } },
  actions: { addItem({ commit }, item) { commit('ADD_ITEM', item); } },
  getters: { total: (s) => s.items.reduce((a, i) => a + i.price, 0) },
};
\`\`\`

## State

- \`state: () => ({...})\` — **반드시 함수**. 객체 직접 대입은 SSR/테스트 시 모든 인스턴스가 같은 객체 공유.
  - 근거: SSR은 요청마다 새 store 인스턴스를 만들지만 객체 리터럴은 모듈 평가 시점에 한 번 생성 → 요청 간 상태 누수 + 동시 요청 간 race condition.
- 새 속성 추가 시 \`Vue.set\` (Vue 2) 또는 직접 spread (Vue 3) — 반응성 등록.

## Mutation

- **동기 only**. 비동기 코드 절대 금지.
- 이름은 SCREAMING_SNAKE_CASE 컨벤션: \`ADD_ITEM\`, \`REMOVE_USER\`.
- 매개변수: \`(state, payload)\`. payload는 1개 — 여러 값 필요하면 객체로.
- 근거: devtools의 time-travel debugging이 mutation 단위로 동작. 비동기를 mutation에 넣으면 trace가 깨진다.

## Action

- 비동기 OK. \`async/await\` 사용.
- **state를 직접 변경 금지** — 반드시 \`commit(mutation)\` 통해서.
- 외부 모듈 mutation: \`commit('other/MUTATION', payload, { root: true })\`.
- 외부 모듈 dispatch도 같은 패턴.

## Getter

- 파생값. Vue computed처럼 메모.
- 매개변수화된 getter: 함수를 반환:
  \`\`\`ts
  getters: {
    userById: (state) => (id: string) => state.users.find((u) => u.id === id),
  }
  \`\`\`
- 호출: \`store.getters['users/userById']('u1')\`.

## 컴포넌트에서 사용

### Options API

- \`mapState\` / \`mapGetters\` / \`mapMutations\` / \`mapActions\`.
- namespaced 모듈은 helpers의 첫 인자에 path: \`...mapState('cart', ['items'])\`.

### Composition API

- \`useStore()\` from \`vuex\`. namespaced도 그대로 (\`store.state.cart.items\`).
- 반응성 유지: \`computed(() => store.state.cart.items)\`.

## TypeScript

- Vuex 4의 TS 지원은 **빈약**.
- 권장: \`InjectionKey\` 패턴으로 store 타입 주입.
  \`\`\`ts
  export const key: InjectionKey<Store<RootState>> = Symbol();
  app.use(store, key);
  // 컴포넌트에서
  const store = useStore(key);
  \`\`\`
- 새로 작성하는 store라면 Pinia로 가는 게 TS DX 측면에서 압도적으로 낫다.

## 모듈 동적 등록 / 해제

- \`store.registerModule\` / \`unregisterModule\` — code splitting 시 활용.
- 동적 등록은 \`preserveState: true\` 옵션 — SSR hydration 후 재등록 시 상태 보존.

## Pinia 마이그레이션 매핑

| Vuex | Pinia |
|------|-------|
| \`module.state()\` | \`defineStore + ref/reactive\` |
| \`mutations\` | 직접 변경 또는 \`$patch\` (mutation 개념 자체 제거) |
| \`actions\` | function (동기/비동기 동일) |
| \`getters\` | \`computed\` |
| \`namespaced: true\` | store id가 곧 namespace |
| \`mapState / mapGetters\` | \`storeToRefs\` |
| \`commit('ADD_ITEM', x)\` | \`store.addItem(x)\` |

### 마이그레이션 전략

1. **store 단위로 점진**: 한 모듈씩 Pinia store로 교체.
2. **동일 도메인 데이터를 두 곳에 동시 보관 금지** — 마이그레이션 중에는 한쪽이 source of truth.
3. **읽기부터** 옮기고, mutation/action 호출 지점을 마지막에 일괄 변경.
4. 모든 모듈 이전 후 Vuex 의존성 제거.

## AI 행동 규칙

- **새 store/모듈 추가 시 항상 Pinia 권고** — 기존 Vuex 패턴에 추가하지 마라.
- mutation에 \`async/await\` 발견 시 즉시 action으로 이동.
- namespaced: false 모듈 발견 시 즉시 true로 변경 + 호출 지점 path 보강.
- action 안에서 \`state.x = y\` 발견 시 mutation으로 분리.

## 패턴 (DO / DON'T)

### State 정의

\`\`\`ts
// DON'T — 객체 공유 위험
const module = {
  state: { items: [] },
};

// DO — 함수
const module = {
  state: () => ({ items: [] }),
};
\`\`\`

### 비동기는 action

\`\`\`ts
// DON'T — mutation에 비동기
mutations: {
  async FETCH_USERS(state) {                    // 절대 금지
    state.users = await api.fetch();
  },
}

// DO
actions: {
  async fetchUsers({ commit }) {
    const users = await api.fetch();
    commit('SET_USERS', users);
  },
},
mutations: {
  SET_USERS(state, users) { state.users = users; },
}
\`\`\`

### Namespaced

\`\`\`ts
// DON'T
modules: {
  cart: { state, mutations, actions },          // namespaced 누락
}

// DO
modules: {
  cart: { namespaced: true, state, mutations, actions },
}
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| 신규 모듈을 Vuex로 추가 | Pinia로 신규, Vuex는 동결 |
| mutation 안 비동기 | action에서 await → commit |
| namespaced: false | 항상 true |
| action 안에서 state 직접 변경 | mutation commit |
| 같은 데이터를 Vuex + Pinia에 동시 보관 | 한쪽이 source of truth |
`;
