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
- 한 파일이 200줄 넘으면 분리 검토 (composable 추출).

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

## v-model

- Vue 3.4+ : **\`defineModel()\`** 사용:
  \`\`\`ts
  const modelValue = defineModel<string>();
  // 부모에서: <Input v-model="text" />
  \`\`\`
- 이전 패턴 \`props.modelValue + emit('update:modelValue')\` 는 새 코드에서 사용하지 마라.
- 다중 v-model: \`defineModel<string>('first')\` + \`<Input v-model:first="...">\`.

## Computed vs watch vs watchEffect

| 도구 | 용도 |
|------|------|
| \`computed\` | 파생값 (메모, getter 형태) |
| \`watch(source, cb)\` | 특정 source 변화에 side effect, lazy |
| \`watchEffect(cb)\` | 의존성 자동 감지, immediate 실행 |

- 가능한 한 \`computed\` 우선 — 명시적이고 메모됨.
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
- \`vite.config.ts\` 의 \`resolve.alias\` 로 \`@\` → \`src\`.

## AI 행동 규칙

- 새 컴포넌트는 \`<script setup lang="ts">\` 만 사용. Options API 코드 생성 금지.
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
`;
