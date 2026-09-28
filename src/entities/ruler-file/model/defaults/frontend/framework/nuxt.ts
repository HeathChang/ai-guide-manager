export const frameworkNuxt = `---
title: 프레임워크 — Nuxt 3
stack: frontend
category: 프레임워크
extends: [base.md, vue.md]
---

# Nuxt 3

> \`vue.md\` (Vue 3) 를 상속한다. Nuxt 3.x 전제. Nuxt 2 (Vue 2 기반) 는 신규 코드 금지.

## 디렉토리 컨벤션

| 폴더 | 역할 |
|------|------|
| \`pages/\` | 파일 기반 라우팅 |
| \`layouts/\` | 라우트별 레이아웃 |
| \`components/\` | 자동 import |
| \`composables/\` | \`use*\` 자동 import |
| \`utils/\` | 순수 함수 자동 import |
| \`server/api/\` | 서버 라우트 (h3) |
| \`server/middleware/\` | 모든 요청 전처리 |
| \`middleware/\` | 라우트 가드 (클라이언트 + 서버) |
| \`plugins/\` | Nuxt 부팅 시점 로직 |
| \`assets/\` | 빌드 처리 자산 |
| \`public/\` | 빌드 그대로 정적 서빙 |

## Auto-Imports

- \`components/\`, \`composables/\`, \`utils/\` 의 export는 자동 import.
- Vue API(\`ref\`, \`computed\`, \`watch\`) / Nuxt 컴포저블(\`useFetch\`, \`useRoute\`)도 자동.
- 명시 import 작성 금지 — 자동 import와 중복되면 IDE 경고.
  - 근거: Nuxt가 \`.nuxt/auto-imports.d.ts\` 에 타입 매핑을 자동 생성. 명시 import 추가하면 vue-tsc가 같은 이름 두 번 선언으로 인식, 빌드 경고 발생.
- 자동 import 비활성 옵션은 명확한 이유가 있을 때만.

## 데이터 페칭 — \`useFetch\` vs \`useAsyncData\` vs \`$fetch\`

| API | 용도 |
|-----|------|
| \`useFetch(url)\` | URL 기반 GET. SSR + 클라이언트 동시 처리. 캐시 자동 |
| \`useAsyncData(key, fn)\` | 임의 비동기 함수. SSR-safe. key로 중복 호출 dedupe |
| \`$fetch(url)\` | 명령형 호출. 이벤트 핸들러 / mutation 안에서만 |

- 페이지 진입 데이터는 **\`useFetch\` / \`useAsyncData\`** — SSR에서 직렬화되어 hydration에 재사용된다.
- 컴포넌트 마운트 후 사용자 인터랙션으로 fetch는 \`$fetch\`.
- 근거: \`$fetch\` 를 setup 최상단에서 호출하면 SSR 결과가 클라이언트에 hydrate되지 않아 깜빡임 + 중복 요청.

## Server Routes (\`server/api\`)

- \`server/api/posts.get.ts\` → \`GET /api/posts\`.
- HTTP 메서드 suffix (\`.get.ts\`, \`.post.ts\`).
- \`defineEventHandler\` 로 작성. 검증은 \`readValidatedBody\` + zod.
- 외부 API 키, DB 접근 등 시크릿은 서버 라우트에서만.

## State — \`useState\`

- SSR-safe 공유 상태:
  \`\`\`ts
  const counter = useState('counter', () => 0);
  \`\`\`
- 키 필수 (\`'counter'\`) — SSR-CSR hydration 매칭.
  - 근거: 서버가 만든 상태와 클라이언트가 이어받을 상태를 이 키로 짝짓는다. 키가 없으면 하이드레이션 후 값이 초기값으로 되돌아간다.
- 큰 도메인은 Pinia (\`state/pinia.md\`) — \`useState\` 는 작은 공유.

## SSR vs CSR vs Static

- \`nuxt.config.ts\` 의 \`ssr: true\` (기본). 페이지/라우트 단위로 SSR을 끄려면 아래 \`routeRules\` 의 \`{ ssr: false }\` 또는 클라이언트 전용 부분만 \`<ClientOnly>\` 로 감싼다.
- 정적 사이트는 \`npx nuxt generate\` — \`useFetch\` 결과가 빌드 타임에 fetch되어 정적 JSON으로 떨어짐.
- 페이지별 라우트 규칙: \`routeRules\` in \`nuxt.config.ts\`:
  \`\`\`ts
  routeRules: {
    '/blog/**': { isr: 3600 },
    '/admin/**': { ssr: false },
  }
  \`\`\`

## 런타임 설정 / 환경 변수

- 공개 가능: \`nuxt.config.ts\` 의 \`runtimeConfig.public\`.
- 서버 전용: \`runtimeConfig\` 의 그 외.
- 접근: \`useRuntimeConfig()\`.
- \`.env\` 자동 로드. \`NUXT_PUBLIC_\` prefix는 클라이언트 노출.

## 미들웨어 — 클라이언트 vs 서버

- \`middleware/auth.ts\` — 라우트 navigate 시 실행 (클라이언트+서버 모두).
- \`server/middleware/log.ts\` — 모든 서버 요청.
- 두 종류 혼동 금지 — 폴더로 구분.
  - 근거: 서버 미들웨어는 모든 요청에서 Node 로 실행되고 클라이언트 미들웨어는 라우팅 시점에 브라우저에서 실행된다. 섞으면 서버 전용 시크릿이 클라이언트 번들로 넘어가거나 인증 가드가 아예 동작하지 않는다.

## Plugins

- \`plugins/\` 의 파일은 Nuxt 부팅 시 1회 실행.
- 인자 \`nuxtApp\` 으로 모든 컨텍스트 접근.
- 클라이언트만/서버만: \`plugins/foo.client.ts\` / \`foo.server.ts\` 접미사.

## SEO / 메타데이터

- \`useHead\`, \`useSeoMeta\` 컴포저블.
- \`<head>\` 직접 조작 금지.
  - 근거: Nuxt 가 SSR 과 클라이언트 전환에서 head 를 함께 관리한다. 직접 조작하면 하이드레이션 후 값이 되돌아가거나 중복 태그가 쌓인다.

## 이미지 / 폰트

- \`@nuxt/image\` 모듈 — \`<NuxtImg />\` / \`<NuxtPicture />\`.
- 폰트는 \`@nuxt/fonts\` (자동 셀프 호스팅 + layout shift 방지).

## TypeScript

- \`nuxt.config.ts\` 의 \`typescript.strict: true\` 확인.
- 자동 생성 타입: \`.nuxt/\` 안 — gitignore.
- 페이지 props는 \`definePageMeta\` + Nuxt가 자동 추론.

## AI 행동 규칙

- 새 페이지에서 데이터 페칭 추가 시 \`useFetch\` 또는 \`useAsyncData\` 우선.
- \`$fetch\` 를 setup 최상단에서 사용 시도 → 즉시 \`useFetch\` 로 교체.
- 자동 import 가능한 함수에 명시 import 추가 시도 시 제거 권고.
- 시크릿(API key, DB password) 을 클라이언트 코드에 노출하지 마라 — server routes 통해서만.
- \`useState\` 키 누락 시 즉시 키 추가 (SSR hydration 안정성).

## 패턴 (DO / DON'T)

### 데이터 페칭

\`\`\`vue
// DON'T — SSR/CSR 깜빡임 + 중복 요청
<script setup>
const data = ref(null);
onMounted(async () => {
  data.value = await $fetch('/api/posts');
});
</script>

// DO — SSR-safe + dedupe
<script setup>
const { data } = await useFetch('/api/posts');
</script>
\`\`\`

### Server route

\`\`\`ts
// server/api/posts.post.ts
import { z } from 'zod';
const Body = z.object({ title: z.string().min(1).max(120) });

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, Body.parse);
  return await db.posts.create({ data: body });
});
\`\`\`

### useState 키

\`\`\`ts
// DON'T — 키 없음 → SSR/CSR 매칭 안 됨
const count = useState(() => 0);

// DO
const count = useState('count', () => 0);
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| setup 최상단 \`$fetch\` | \`useFetch\` / \`useAsyncData\` |
| 자동 import 가능한 것 명시 import | 빈 \`<script setup>\` 으로 시작 |
| 시크릿 \`NUXT_PUBLIC_\` 노출 | \`runtimeConfig\` (server only) |
| 직접 \`<head>\` 조작 | \`useHead\` / \`useSeoMeta\` |
| \`<img>\` / 일반 \`<a>\` | \`<NuxtImg>\` / \`<NuxtLink>\` |

## 적용 범위와 경계

이 문서는 **Nuxt 3** 만 다룬다. Nuxt 2 프로젝트에는 적용하지 않는다 — 그 경우 유저에게 버전을 확인한다.

여기서 다루지 않는 것 → Vue 컴포넌트 문법은 \`vue.md\`, 전역 상태는 \`pinia.md\`, 클래스·토큰은 \`styling.md\`, 접근성은 \`a11y.md\`.

**\`server/api\` 안의 코드는 백엔드 규칙을 따른다.** 입력 검증·인가·에러 응답은 이 문서가 아니라 백엔드 룰셋의 \`security.md\`, \`auth.md\`, \`error-handling.md\` 를 참조한다.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **이 문서 vs \`vue.md\`** — 이 문서가 이긴다. auto-import 와 SSR 라이프사이클이 순수 Vue 와 다르게 동작한다.
- **\`useFetch\`/\`useAsyncData\` vs \`$fetch\` 직접 호출** — 컴포넌트 셋업에서는 전자가 이긴다. \`$fetch\` 는 이벤트 핸들러와 서버 라우트 안에서만 쓴다.
- **서버 전용 값 vs 편의** — \`runtimeConfig\` 의 서버 키를 클라이언트에서 읽지 않는다. \`public\` 에 넣어 해결하려 하지 마라.
- **SSR/CSR/Static 선택** — 명시되지 않았으면 추측하지 말고 유저에게 렌더링 모드를 묻는다.

## 자가 점검

변경을 제출하기 전 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] 컴포넌트 셋업의 데이터 페칭에 \`useFetch\` 또는 \`useAsyncData\` 를 썼다
- [ ] \`$fetch\` 를 이벤트 핸들러나 \`server/api\` 안에서만 호출했다
- [ ] 서버 미들웨어와 클라이언트 미들웨어를 올바른 폴더에 두었다
- [ ] 서버 전용 시크릿이 \`runtimeConfig.public\` 에 없다
- [ ] 메타데이터를 \`useHead\`/\`useSeoMeta\` 로 설정했다 — \`<head>\` 직접 조작이 없다
- [ ] 공유 상태에 \`useState\` 를 써 요청 간 격리를 유지했다 — 모듈 스코프 변수가 아니다
- [ ] \`server/api\` 핸들러의 입력을 검증하고 인가를 확인했다
- [ ] auto-import 에 의존하는 이름이 실제로 해석되는지 확인했다
`;
