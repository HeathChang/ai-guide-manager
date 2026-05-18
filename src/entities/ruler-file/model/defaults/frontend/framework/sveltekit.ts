export const frameworkSveltekit = `---
title: 프레임워크 — SvelteKit
stack: frontend
category: 프레임워크
extends: [base.md, svelte.md]
---

# SvelteKit

> \`svelte.md\` (Svelte 5 runes) 를 상속한다. SvelteKit 2.x + Svelte 5 전제.
> 라우팅, 데이터 로딩, 폼 처리, 서버 사이드 렌더링, 빌드까지 통합된 풀스택 프레임워크.

## 라우팅

- 파일 기반: \`src/routes/{path}/+page.svelte\`.
- 동적 세그먼트: \`[slug]\` / \`[...rest]\` / \`[[optional]]\`.
- 라우트 그룹(URL 영향 X): \`(group)\`.
- 그룹별 layout: \`+layout.svelte\` / \`+layout.ts\`.

## 데이터 로딩 — \`load\` 함수

- \`+page.ts\` (universal) : 서버 + 클라이언트 양쪽 실행. fetch 가능한 데이터.
- \`+page.server.ts\` (server-only) : DB, 시크릿. \`$page.data\` 로 전달.
- 둘의 차이를 정확히:
  - **\`+page.server.ts\`** 가 항상 우선 — 시크릿 접근, DB 직접.
  - **\`+page.ts\`** 는 클라이언트 네비게이션에서 다시 실행되므로 가벼운 fetch에 유리.
- 부모 layout의 load 데이터: \`event.parent()\`.

\`\`\`ts
// +page.server.ts
import { error } from '@sveltejs/kit';

export async function load({ params, locals }) {
  const post = await locals.db.posts.findUnique({ where: { id: params.id } });
  if (!post) throw error(404, 'Post not found');
  return { post };
}
\`\`\`

## Form Actions

- mutation은 form action으로 작성. JS 비활성 환경에서도 동작.
- \`+page.server.ts\` 의 \`actions\` export:
  \`\`\`ts
  export const actions = {
    create: async ({ request, locals }) => {
      const form = await request.formData();
      const title = form.get('title')?.toString() ?? '';
      // validate with zod ...
      await locals.db.posts.create({ data: { title } });
      return { success: true };
    },
  };
  \`\`\`
- 클라이언트: \`<form method="POST" action="?/create" use:enhance>\`.
- \`use:enhance\` — progressive enhancement (JS 있으면 SPA-like, 없으면 표준 submit).

## Hooks

- \`src/hooks.server.ts\` : \`handle\`, \`handleFetch\`, \`handleError\`.
- 인증, 세션, locals 주입은 \`handle\` 안에서:
  \`\`\`ts
  export const handle: Handle = async ({ event, resolve }) => {
    event.locals.user = await getUserFromCookie(event.cookies);
    return resolve(event);
  };
  \`\`\`
- \`event.locals\` 타입은 \`src/app.d.ts\` 의 \`App.Locals\` 인터페이스로 보강.

## 에러 / 404

- \`+error.svelte\` : 라우트별 에러 페이지.
- \`error(status, message)\` from \`@sveltejs/kit\` — load 함수 안에서 던지면 적절히 처리.
- \`redirect(status, location)\` 도 같은 방식.

## 환경 변수

- \`$env/static/private\` — 서버 빌드타임 상수, 시크릿 안전.
- \`$env/static/public\` — 클라이언트 노출, \`PUBLIC_\` prefix 필수.
- \`$env/dynamic/private|public\` — 런타임. Adapter에 따라 가능.
- **\`process.env.X\` 직접 사용 금지** — type-safe import 깨짐.

## \`$app\` 모듈

| Import | 용도 |
|--------|------|
| \`$app/stores\` | page, navigating, updated |
| \`$app/navigation\` | goto, invalidate, invalidateAll, beforeNavigate, afterNavigate |
| \`$app/environment\` | browser, dev, version |
| \`$app/paths\` | base, assets |

## Adapter (배포)

- \`adapter-auto\` (개발 편의), 프로덕션은 명시적 선택:
  - Vercel: \`adapter-vercel\`
  - Cloudflare: \`adapter-cloudflare\`
  - Node 서버: \`adapter-node\`
  - 정적: \`adapter-static\`
- \`svelte.config.js\` 의 \`kit.adapter\` 명시.

## 캐싱 / 정적 생성

- \`+page.ts\` 의 \`export const prerender = true\` — 빌드 타임 정적.
- \`export const csr = false\` — 클라이언트 사이드 hydration 비활성 (순수 정적 HTML).
- \`export const ssr = false\` — SPA 모드.
- 페이지 단위 명시 — 디폴트는 SSR + CSR.

## Invalidation

- 데이터 재로드: \`invalidate(url)\` 또는 \`invalidateAll()\`.
- form action 성공 후 자동 \`invalidateAll\` (use:enhance 기본).

## TypeScript

- \`./$types\` 자동 생성 import — \`PageLoad\`, \`PageServerLoad\`, \`Actions\`.
- \`app.d.ts\` 의 \`App.Locals\`, \`App.PageData\`, \`App.Error\` 확장.

## 보안

- form 입력은 항상 검증 (zod).
- CSRF는 SvelteKit 기본 차단 (origin 검사). 끄지 마라.
- 시크릿은 \`+page.server.ts\` / hooks / endpoints 안에서만.

## AI 행동 규칙

- load 함수 작성 시 시크릿/DB 접근이면 \`+page.server.ts\`. 일반 fetch면 \`+page.ts\`.
- form mutation 시도 시 \`+page.server.ts\` 의 \`actions\` 패턴 우선 — JS 비활성 호환.
- \`process.env\` 직접 참조 시 \`$env/...\` 로 교체.
- 클라이언트 코드(\`+page.svelte\`) 에서 시크릿 import 시도 발견 시 차단.

## 패턴 (DO / DON'T)

### 데이터 로딩 분리

\`\`\`ts
// DON'T — 시크릿이 universal load에 노출
// +page.ts
export async function load() {
  return { data: await fetch('https://api/...', { headers: { 'X-API-KEY': API_KEY } }) };
}

// DO — server-only load
// +page.server.ts
import { API_KEY } from '$env/static/private';
export async function load() {
  return { data: await fetch('https://api/...', { headers: { 'X-API-KEY': API_KEY } }).then(r => r.json()) };
}
\`\`\`

### Form action

\`\`\`svelte
<!-- +page.svelte -->
<form method="POST" action="?/create" use:enhance>
  <input name="title" required />
  <button>Save</button>
</form>
\`\`\`

\`\`\`ts
// +page.server.ts
export const actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    // validate + persist
    return { success: true };
  },
};
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| \`process.env.X\` | \`$env/static/private\` |
| 시크릿을 \`+page.ts\` 에서 import | \`+page.server.ts\` |
| JS 전용 fetch + button onClick mutation | form action + use:enhance |
| CSRF 보호 비활성 | 기본값 유지 |
| adapter-auto 프로덕션 그대로 | 명시적 adapter |
`;
