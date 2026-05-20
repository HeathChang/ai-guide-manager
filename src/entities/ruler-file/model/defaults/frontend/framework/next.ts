export const frameworkNext = `---
title: 프레임워크 — Next.js (App Router)
stack: frontend
category: 프레임워크
extends: [base.md, frontend.md]
---

# Next.js (App Router)

> \`frontend.md\` (React 베이스)를 상속한다. Next.js 14+ App Router 전제.
> Pages Router는 신규 코드에서 사용하지 않는다 — 새 라우트는 항상 App Router로 작성.

## Server Components vs Client Components

- **기본값은 Server Component**. 파일 최상단에 \`'use client'\` 없으면 서버에서만 실행.
- \`'use client'\` 를 붙이는 기준:
  - \`useState\`, \`useEffect\`, \`useReducer\` 등 React hook 사용
  - 브라우저 API (window, document, localStorage)
  - 이벤트 핸들러 (\`onClick\` 등)
  - 외부 클라이언트 전용 라이브러리 (예: 모달, 차트 라이브러리)
- \`'use client'\` 는 **그래프의 leaf 쪽으로 밀어내라**.
  - 근거: Client Component는 그 자체와 children이 클라이언트 번들에 포함된다. 상위에 두면 트리 전체가 클라이언트로 떨어진다. interactive한 잎만 client로.

## 파일 컨벤션

- \`app/{route}/page.tsx\` — 라우트 진입.
- \`layout.tsx\` — 레이아웃 (중첩 가능, persistent state 유지).
- \`template.tsx\` — 라우트 진입마다 새 인스턴스 (animation 등).
- \`loading.tsx\` — Suspense fallback.
- \`error.tsx\` — Error boundary (반드시 \`'use client'\`).
- \`not-found.tsx\` — 404.
- \`route.ts\` — API 핸들러 (GET/POST/etc export).

## 데이터 페칭

- Server Component 안에서는 **\`async\` 함수로 직접 fetch**:
  \`\`\`tsx
  export default async function Page() {
    const data = await fetch('https://api/...', { next: { revalidate: 60 } }).then(r => r.json());
    return <View data={data} />;
  }
  \`\`\`
- 캐시 옵션 명시 필수:
  - \`{ cache: 'force-cache' }\` (기본, build-time) — 정적 데이터
  - \`{ next: { revalidate: N } }\` — N초마다 재검증
  - \`{ cache: 'no-store' }\` — 매번 새로 (개인화 데이터)
- 근거: Next 14에서 fetch 캐시 기본 동작이 변경되었고 (Next 15+는 더더욱), 명시하지 않으면 의도와 다르게 캐싱될 수 있다.
- Client Component에서 데이터 페칭이 필요하면 **TanStack Query** 또는 \`useSWR\`. 직접 \`fetch + useEffect\` 금지.

## Server Actions

- form 제출, mutation은 Server Action으로:
  \`\`\`tsx
  async function createPost(formData: FormData) {
    'use server';
    await db.posts.create({ ... });
    revalidatePath('/posts');
  }
  <form action={createPost}>...</form>
  \`\`\`
- 입력 검증 필수 — Server Action도 외부 입력. zod로 파싱.
- mutation 후 \`revalidatePath\` / \`revalidateTag\` 로 캐시 무효화.

## 빌트인 컴포넌트 사용 강제

- \`next/image\` — \`<img>\` 직접 사용 금지 (lazy, srcset, blur placeholder, layout shift 자동).
- \`next/link\` — \`<a href=>\` 내부 라우트 금지 (prefetch + 클라이언트 네비게이션).
- \`next/font\` — Google Fonts 직접 \`<link>\` 금지 (셀프 호스팅 + layout shift 제거).
- 근거: Core Web Vitals (LCP, CLS) 개선이 이 컴포넌트들의 핵심 가치.

## 메타데이터

- 정적: \`export const metadata: Metadata = {...}\`.
- 동적: \`export async function generateMetadata({ params }): Promise<Metadata> {...}\`.
- \`<head>\` 직접 조작 금지 — 위 API만 사용.

## 라우팅 / 네비게이션

- 클라이언트 네비게이션: \`next/link\` 또는 \`useRouter()\` (from \`next/navigation\`).
- \`useRouter\` 는 Client Component에서만.
- Server Component에서는 \`redirect()\` / \`notFound()\` import.

## 환경 변수

- 서버 전용: \`process.env.X\` (어떤 키든).
- 클라이언트 노출: **\`NEXT_PUBLIC_\`** prefix 필수.
- 시크릿은 절대 \`NEXT_PUBLIC_\` 붙이지 마라.
  - 근거: \`NEXT_PUBLIC_\` 변수는 빌드 시점에 클라이언트 JS 번들에 인라인된다. 한 번 빌드되면 브라우저 DevTools에서 raw 문자열로 조회 가능. API 키/DB 비밀번호가 들어가면 즉시 누출.
- \`.env.local\` 은 \`.gitignore\` 필수.

## 캐시 모델

| 종류 | 무효화 |
|------|--------|
| Data Cache (fetch) | \`revalidatePath\`, \`revalidateTag\`, \`{ next: { revalidate } }\` |
| Full Route Cache | 동적 함수(\`cookies()\`, \`headers()\`) 사용 시 자동 비활성 |
| Router Cache (client) | \`router.refresh()\` |

- 근거: Next.js 캐시는 4단(데이터·라우트·라우터·풀라우트)이라 의도하지 않은 캐시 적중이 가장 흔한 버그.

## TypeScript

- \`next-env.d.ts\` 자동 생성 — 수정 금지.
- 페이지/레이아웃 props 타입: \`{ params, searchParams }\` 명시.
- App Router는 \`tsconfig.json\` 에 \`"plugins": [{ "name": "next" }]\` 자동 추가.

## 미들웨어 / Edge

- \`middleware.ts\` — 인증 가드, redirect, header 조작.
- Edge 런타임은 Node API 일부 미지원 — fs / 무거운 의존성 사용 불가.
- 미들웨어는 모든 요청에 영향 → \`matcher\` 로 범위 한정 필수.

## AI 행동 규칙

- 컴포넌트 새로 만들 때: hook이나 onClick 없으면 **\`'use client'\` 절대 추가하지 마라**.
- fetch 호출 시 cache 옵션 명시 안 했으면 의도 확인 (정적인가 동적인가).
- \`<img>\` / \`<a>\` 내부 라우트로 발견 시 즉시 \`next/image\` / \`next/link\` 로 교체.
- form 제출 로직을 Client + API route로 짜는 시도 → Server Action 우선 권고.
- \`process.env.X\` 직접 클라이언트 코드에서 참조 → \`NEXT_PUBLIC_\` 여부 확인.

## 패턴 (DO / DON'T)

### Server / Client 경계

\`\`\`tsx
// app/products/page.tsx — Server Component (기본)
import { ProductList } from './ProductList';
export default async function Page() {
  const products = await db.products.findMany();    // 서버에서 DB 접근
  return <ProductList products={products} />;       // props로 전달
}

// app/products/ProductList.tsx — Client Component (interactive)
'use client';
import { useState } from 'react';
export function ProductList({ products }: Props) {
  const [filter, setFilter] = useState('');
  return ...;
}
\`\`\`

### Image / Link

\`\`\`tsx
// DON'T
<img src="/hero.png" />
<a href="/about">About</a>

// DO
import Image from 'next/image';
import Link from 'next/link';
<Image src="/hero.png" alt="..." width={800} height={600} />
<Link href="/about">About</Link>
\`\`\`

### Server Action

\`\`\`tsx
// DO — 명시적 action + revalidate
async function deletePost(id: string) {
  'use server';
  await db.posts.delete({ where: { id } });
  revalidatePath('/posts');
}
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| 모든 컴포넌트 상단에 \`'use client'\` | leaf 인터랙티브 컴포넌트만 |
| fetch cache 옵션 누락 | \`revalidate\` / \`no-store\` 명시 |
| \`<img>\` / 내부 라우트 \`<a>\` | \`next/image\` / \`next/link\` |
| API route로 mutation | Server Action |
| \`NEXT_PUBLIC_API_KEY\` (시크릿) | 서버 전용 환경변수 + Server Action |
`;
