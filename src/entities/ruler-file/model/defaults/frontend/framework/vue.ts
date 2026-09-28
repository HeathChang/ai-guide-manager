export const frameworkVue = `---
title: 프레임워크 — Vue 3
stack: frontend
category: 프레임워크
extends: [base.md]
---

# Vue 3

> \`base.md\` 를 상속. Vue 3.4+ 전제.
> Options API는 신규 코드에서 사용하지 않는다 — **Composition API + \`<script setup>\`** 단독.

## SFC 구조

\`\`\`vue
<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{ id: string }>();
const emit = defineEmits<{ change: [value: string] }>();

const count = ref(0);
const doubled = computed(() => count.value * 2);
</script>

<template>
  <button @click="count++">{{ doubled }}</button>
</template>

<style scoped>
button { color: var(--color-brand); }
</style>
\`\`\`

- \`<script setup lang="ts">\` 항상.
- \`<style scoped>\` 컴포넌트 단위 격리 권장.
- 한 파일이 200줄을 넘으면 재사용 로직을 \`composables/useXxx.ts\` 로 추출해 분리한다.

## ref vs reactive

- **primitive(number, string, boolean) → \`ref\`**.
- **객체/배열 → \`ref\` 또는 \`reactive\` 둘 다 가능 — \`ref\` 로 통일 권장**.
  - 근거: ref는 \`.value\` 접근이 일관적이고 destructure 시 reactivity 잃지 않음(\`toRefs\`). reactive는 destructure하면 리액티비티 끊김 → 두 가지를 섞으면 혼란.
- 외부 export 할 때는 항상 ref — 일관성이 큰 이점.

## Props / Emits

- 타입 기반 선언 권장 (런타임 validation 자동 생성):
  \`\`\`ts
  defineProps<{ id: string; count?: number }>();
  defineEmits<{ submit: [data: FormData]; cancel: [] }>();
  \`\`\`
- 기본값: \`withDefaults(defineProps<...>(), { count: 0 })\`.
- props를 **mutate 금지** — readonly. 변경 필요하면 emit으로 부모에 알림.
  - 근거: props는 부모 reactive 객체의 참조다. 자식이 mutate하면 부모도 변하고 — 그 변경이 *왜* 일어났는지 부모는 모른다. 단방향 데이터 흐름이 깨져서 디버깅 난이도가 폭증한다.

## v-model

- Vue 3.4+ : **\`defineModel()\`** 사용:
  \`\`\`ts
  const modelValue = defineModel<string>();
  // 부모에서: <Input v-model="text" />
  \`\`\`
- 이전 패턴 \`props.modelValue + emit('update:modelValue')\` 는 새 코드에서 사용하지 마라.
  - 근거: \`defineModel()\` 이 같은 동작을 한 줄로 표현하고 타입까지 추론한다. 수동 패턴은 prop 이름과 이벤트 이름을 손으로 맞춰야 해서 오타가 조용한 미동작으로 이어진다.
- 다중 v-model: \`defineModel<string>('first')\` + \`<Input v-model:first="...">\`.

## Computed vs watch vs watchEffect

| 도구 | 용도 |
|------|------|
| \`computed\` | 파생값 (메모, getter 형태) |
| \`watch(source, cb)\` | 특정 source 변화에 side effect, lazy |
| \`watchEffect(cb)\` | 의존성 자동 감지, immediate 실행 |

- side-effect가 없는 파생값은 **무조건 \`computed\`** — \`ref + watch\` 로 같은 결과를 만들 수 있어도 금지.
  - 근거: computed는 의존성 자동 추적 + 메모, watch는 둘 다 수동. 같은 결과를 더 비싸게 만든다.
- watch 의 \`{ immediate, deep, flush }\` 옵션을 명시.
- watchEffect 는 의존성이 불명확해 디버깅이 어려움 — 단순 케이스에만.

## Composables (\`use*\`)

- 재사용 가능한 로직은 composable로 추출. 파일은 \`composables/useXxx.ts\`.
- composable은 setup() 또는 다른 composable 안에서만 호출.
- 반환은 ref / computed / 함수의 객체.

## 라이프사이클

| Vue 2 | Vue 3 Composition |
|-------|-------------------|
| beforeCreate / created | setup() 본문 |
| beforeMount / mounted | onBeforeMount / onMounted |
| beforeUpdate / updated | onBeforeUpdate / onUpdated |
| beforeDestroy / destroyed | onBeforeUnmount / onUnmounted |

- mounted 안에서 DOM 직접 조작은 ref(\`useTemplateRef\` 권장)로.

## v-for

- 항상 \`:key\` 필수. **\`:key="index"\` 금지** — 항목 추가/삭제 시 잘못된 컴포넌트 재사용.
  - 근거: Vue diff 알고리즘이 key를 기준으로 재사용 결정. index는 위치가 바뀌면 같은 자식이 다른 데이터로 매핑됨.
- 같은 요소에 \`v-if\` + \`v-for\` 동시 사용 금지 — \`<template v-if>\` 또는 computed로 필터링.
  - 근거: Vue 3 에서는 v-if 가 먼저 평가되어 v-for 의 변수를 아직 못 본다. 참조 에러가 나거나 의도와 다른 항목이 걸러진다.

## 슬롯 / 컴포넌트 통신

- 부모 → 자식: props.
- 자식 → 부모: emit.
- 깊은 트리: \`provide\` / \`inject\` — typed key 사용:
  \`\`\`ts
  const userKey: InjectionKey<Ref<User>> = Symbol();
  provide(userKey, userRef);
  const user = inject(userKey);
  \`\`\`
- 전역 공유 상태는 Pinia (별도 \`state/pinia.md\`).

## 비동기 컴포넌트 / 코드 스플리팅

- \`defineAsyncComponent(() => import('./Heavy.vue'))\`.
- Suspense + ErrorBoundary 패턴 가능 (\`<Suspense>\`, errorCaptured).

## TypeScript

- \`<script setup lang="ts">\` 강제.
- props/emits는 타입 인자로 — 런타임 객체 형태(\`defineProps({ id: String })\`) 지양.
- Volar (또는 official Vue extension) 사용.

## 빌드 / Vite

- 신규는 Vite + \`@vitejs/plugin-vue\`. webpack 신규 도입 금지.
  - 근거: Vue 3 생태계의 기본 도구가 Vite 다. webpack 으로 시작하면 SFC·HMR·SSR 플러그인을 직접 맞춰야 하고, 공식 문서의 예제가 그대로 적용되지 않는다.
- \`vite.config.ts\` 의 \`resolve.alias\` 로 \`@\` → \`src\`.

## AI 행동 규칙

- 새 컴포넌트는 \`<script setup lang="ts">\` 만 사용. Options API 코드 생성 금지.
  - 근거: 한 코드베이스에 두 API 가 섞이면 컴포넌트를 열 때마다 어느 쪽인지 먼저 판별해야 한다. \`<script setup>\` 은 타입 추론도 더 정확하다.
- v-for 발견 시 :key index 사용 여부 확인.
- props 직접 mutate 시도 발견 시 즉시 emit으로 분리.
- reactive 와 ref 혼용 발견 시 ref로 통일 권고.

## 패턴 (DO / DON'T)

### Composition API

\`\`\`vue
<!-- DON'T — Options API (신규 금지) -->
<script>
export default {
  data() { return { count: 0 }; },
  computed: { doubled() { return this.count * 2; } },
};
</script>

<!-- DO -->
<script setup lang="ts">
const count = ref(0);
const doubled = computed(() => count.value * 2);
</script>
\`\`\`

### Props mutation

\`\`\`ts
// DON'T
const props = defineProps<{ count: number }>();
props.count++;   // readonly

// DO — emit으로 부모에 위임
const emit = defineEmits<{ update: [value: number] }>();
const increment = () => emit('update', props.count + 1);
\`\`\`

### v-for key

\`\`\`vue
<!-- DON'T -->
<li v-for="(item, i) in items" :key="i">{{ item.name }}</li>

<!-- DO -->
<li v-for="item in items" :key="item.id">{{ item.name }}</li>
\`\`\`

### v-model

\`\`\`ts
// DON'T — 옛 패턴
const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [string] }>();

// DO — Vue 3.4+
const modelValue = defineModel<string>();
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| Options API 신규 | \`<script setup>\` |
| reactive + ref 혼용 | ref로 통일 |
| props mutate | emit |
| :key="index" | :key="item.id" |
| v-if + v-for 같은 요소 | computed 필터 또는 \`<template v-if>\` |

## 적용 범위와 경계

이 문서는 **Vue 3 Composition API + \`<script setup>\`** 만 다룬다. Vue 2 와 Options API 신규 작성에는 적용하지 않는다.

여기서 다루지 않는 것 → 전역 상태는 \`pinia.md\`(신규) 또는 \`vuex.md\`(기존), SSR·라우팅·서버 라우트는 \`nuxt.md\`, 클래스·토큰은 \`styling.md\`, 접근성은 \`a11y.md\`.

**이 문서는 React 규칙(\`frontend.md\`)과 함께 쓰지 않는다.** 두 문서가 같이 로드돼 있으면 진행하지 말고 유저에게 어느 프레임워크인지 묻는다.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **\`<script setup>\` vs 기존 Options API 코드** — 새 컴포넌트는 \`<script setup>\` 이 이긴다. 기존 파일을 일괄 변환할지는 유저에게 확인한다.
- **\`defineModel()\` vs 수동 \`modelValue\` 패턴** — \`defineModel()\` 이 이긴다.
- **\`computed\` vs \`watch\`** — 값을 파생시키는 목적이면 \`computed\` 가 이긴다. \`watch\` 는 부수효과가 필요할 때만 쓴다.
- **Nuxt 프로젝트에서 이 문서와 \`nuxt.md\` 가 다를 때** — \`nuxt.md\` 가 이긴다.

## 자가 점검

컴포넌트를 제출하기 전 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] 새 컴포넌트가 \`<script setup lang="ts">\` 다 — Options API 를 새로 만들지 않았다
- [ ] props 와 emits 를 타입으로 선언했다
- [ ] 양방향 바인딩에 \`defineModel()\` 을 썼다
- [ ] 파생 값을 \`computed\` 로 계산했다 — \`watch\` 로 값을 복제하지 않았다
- [ ] \`v-for\` 에 안정적인 \`key\` 가 있다 — 배열 인덱스가 아니다
- [ ] 재사용 로직을 \`use*\` composable 로 분리했다
- [ ] 라우트 단위로 비동기 컴포넌트 분할을 검토했다
- [ ] 접근성 최소선(\`alt\`, label, \`<button>\`, \`aria-label\`)을 통과한다
`;
