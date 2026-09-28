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
  - 근거: mutation 을 거치지 않은 변경은 devtools 타임라인에 남지 않는다. 값이 언제 왜 바뀌었는지 추적할 방법이 사라진다.
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

## 적용 범위와 경계

이 문서는 **기존 Vuex 코드를 유지·보수하는 방법**만 다룬다. Vuex 는 유지 모드이므로 이 문서는 신규 채택을 전제하지 않는다.

여기서 다루지 않는 것 → 컴포넌트 작성 규칙은 \`vue.md\`, SSR 라이프사이클은 \`nuxt.md\`, 신규 store 설계는 \`pinia.md\`.

**새 store 나 모듈은 이 문서가 아니라 \`pinia.md\` 를 따른다.** 이관 매핑은 위 표에 있다. 신규 Vuex 모듈 추가가 요청되면 그 사실을 유저에게 먼저 알린다.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **신규 코드의 라이브러리 선택** — Pinia 가 이긴다. 이 문서는 기존 모듈을 고칠 때만 적용한다.
- **mutation 동기 규칙 vs 코드 간결함** — 동기 규칙이 이긴다. mutation 안에 비동기를 넣으면 devtools 의 상태 추적이 어긋난다.
- **\`namespaced: true\` vs 전역 이름** — 네임스페이스가 이긴다. 전역 이름은 모듈이 늘어날수록 충돌한다.
- **action 에서 직접 state 변경** — 어떤 경우에도 하지 않는다. 반드시 \`commit\` 을 거친다.
  - 근거: mutation 만이 변경 지점의 단일 통로다. action 에서 우회하면 그 통로가 무의미해지고 추적성이 사라진다.

## 자가 점검

Vuex 코드를 수정한 뒤 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] 새 store/모듈이라면 Pinia 를 먼저 제안했다
- [ ] 모든 모듈이 \`namespaced: true\` 다
- [ ] mutation 이 전부 동기다 — 안에 비동기 코드가 없다
- [ ] action 이 state 를 직접 바꾸지 않고 \`commit\` 을 거친다
- [ ] 파생 값을 getter 로 계산한다 — 컴포넌트에서 중복 계산하지 않는다
- [ ] 동적 등록한 모듈에 해제 경로가 있다
- [ ] 서버 응답 캐싱을 store 로 직접 구현하지 않았다
`;
