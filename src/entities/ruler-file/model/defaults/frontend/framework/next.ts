export const frameworkNext = `---
title: 프레임워크 — Next.js (App Router)
stack: frontend
category: 프레임워크
extends: [base.md, frontend.md]
---

# Next.js (App Router)

> \`frontend.md\` (React 베이스)를 상속한다. Next.js 14/15 App Router 전제 — fetch 캐시 기본값이 버전 간 다르다(14: force-cache, 15: no-store). 캐시 옵션 명시를 원칙으로.
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
  - 근거: Error boundary 는 렌더 중 발생한 예외를 잡는 클라이언트 기능이다. 서버 컴포넌트로 두면 경계가 성립하지 않는다.
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
  - \`{ cache: 'force-cache' }\` — 명시적 정적 캐시 (Next 14는 이게 기본이었으나 Next 15부터 기본이 비캐시(no-store 유사)로 바뀌어 정적 캐시를 원하면 명시 필요)
  - \`{ next: { revalidate: N } }\` — N초마다 재검증
  - \`{ cache: 'no-store' }\` — 매번 새로 (개인화 데이터)
- 근거: fetch 캐시 기본 동작이 Next 14→15에서 force-cache → no-store로 역전됐다. 명시하지 않으면 버전·환경에 따라 의도와 정반대로 캐싱/비캐싱된다.
- Client Component에서 데이터 페칭이 필요하면 **TanStack Query** 또는 \`useSWR\`. 직접 \`fetch + useEffect\` 금지.
  - 근거: \`useEffect\` 페칭은 요청 취소·중복 제거·경쟁 조건 처리를 직접 짜야 한다. 대부분 빠뜨리고, 그 결과가 이전 요청 응답이 나중에 도착해 화면을 덮어쓰는 버그다.

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
  - 근거: Server Action 은 폼에서만 호출된다는 보장이 없다. 클라이언트가 직접 POST 할 수 있으므로 일반 엔드포인트와 같은 검증이 필요하다.
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
  - 근거: Next 가 메타데이터를 스트리밍과 함께 관리한다. 직접 조작하면 SSR 결과와 클라이언트 상태가 어긋나 크롤러가 보는 내용과 사용자가 보는 내용이 달라진다.

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
  - 근거: git history 는 영원하다. 한 번 커밋된 시크릿은 삭제 커밋을 해도 남아 있어 재발급 외에는 방법이 없다.

## 캐시 모델

| 종류 | 무효화 |
|------|--------|
| Data Cache (fetch) | \`revalidatePath\`, \`revalidateTag\`, \`{ next: { revalidate } }\` |
| Full Route Cache | 동적 함수(\`cookies()\`, \`headers()\`) 사용 시 자동 비활성 |
| Router Cache (client) | \`router.refresh()\` |

- 근거: Next.js 캐시는 4단(데이터·라우트·라우터·풀라우트)이라 의도하지 않은 캐시 적중이 가장 흔한 버그.

## TypeScript

- \`next-env.d.ts\` 자동 생성 — 수정 금지.
  - 근거: 빌드마다 덮어쓰인다. 여기 넣은 변경은 조용히 사라지고, 사라진 이유를 찾는 데 시간이 든다.
- 페이지/레이아웃 props 타입: \`{ params, searchParams }\` 명시.
- App Router용 TS 플러그인 \`"plugins": [{ "name": "next" }]\` 은 create-next-app 템플릿의 \`tsconfig.json\` 에 포함된다(세그먼트 config 검증, \`'use client'\`·클라이언트 훅 오용 경고 등 IDE 지원). 기존 프로젝트 마이그레이션 시에는 직접 추가해야 할 수 있다 — 없으면 추가하고, 임의로 제거하지 마라.

## 미들웨어 / Edge

- \`middleware.ts\` — 인증 가드, redirect, header 조작.
- Edge 런타임은 Node API 일부 미지원 — fs / 무거운 의존성 사용 불가.
- 미들웨어는 모든 요청에 영향 → \`matcher\` 로 범위 한정 필수.
  - 근거: 정적 자원과 이미지 요청까지 미들웨어를 타면 모든 응답에 지연이 더해진다. 범위를 안 좁히면 페이지 하나 보호하려다 사이트 전체가 느려진다.

## AI 행동 규칙

- 컴포넌트 새로 만들 때: hook이나 onClick 없으면 **\`'use client'\` 절대 추가하지 마라**.
  - 근거: \`'use client'\` 는 그 컴포넌트와 하위 트리를 전부 클라이언트 번들에 넣는다. 한 줄이 트리 전체를 서버 렌더링에서 끌어내려 번들과 TTI 를 동시에 악화시킨다.
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

## 적용 범위와 경계

이 문서는 **Next.js App Router** 만 다룬다. Pages Router 프로젝트에는 적용하지 않는다 — 그 경우 유저에게 라우터 종류를 확인한다.

여기서 다루지 않는 것 → React 컴포넌트·훅 규칙은 \`frontend.md\`, 파일 배치는 \`fsd.md\`/\`atomic.md\`, 클래스·토큰은 \`styling.md\`, 접근성은 \`a11y.md\`, 상태 라이브러리는 프로젝트가 채택한 상태 문서.

**Route Handler 안의 서버 코드는 백엔드 규칙을 따른다.** 입력 검증·인가·에러 응답은 이 문서가 아니라 백엔드 룰셋의 \`security.md\`, \`auth.md\`, \`error-handling.md\` 를 참조한다.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **이 문서 vs \`frontend.md\`** — 이 문서가 이긴다. Server Component 에는 훅 규칙이 적용되지 않는다.
- **Server Component 기본값 vs 개발 편의** — 서버가 이긴다. 상호작용이 필요해질 때만 경계 컴포넌트에 \`'use client'\` 를 붙이고, 트리 위쪽으로 올리지 않는다.
- **빌트인 컴포넌트(\`next/image\`, \`next/link\`, \`next/font\`) vs 직접 구현** — 빌트인이 이긴다.
- **캐시 동작이 애매할 때** — 추측해서 \`revalidate\` 값을 정하지 말고 유저에게 데이터 신선도 요구를 묻는다.

## 자가 점검

변경을 제출하기 전 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] 새 컴포넌트에 \`'use client'\` 를 꼭 필요한 경우에만 붙였다 — 훅·이벤트 핸들러가 없으면 붙이지 않았다
- [ ] \`'use client'\` 를 트리 최상단이 아니라 상호작용이 시작되는 지점에 붙였다
- [ ] Client Component 의 데이터 페칭에 \`fetch + useEffect\` 를 쓰지 않았다
- [ ] \`<img>\`/\`<a>\` 대신 \`next/image\`/\`next/link\` 를 썼다
- [ ] 메타데이터를 \`metadata\` export 나 \`generateMetadata\` 로 설정했다 — \`<head>\` 직접 조작이 없다
- [ ] 서버 전용 시크릿에 \`NEXT_PUBLIC_\` 접두어를 붙이지 않았다
- [ ] 미들웨어에 \`matcher\` 로 범위를 한정했다
- [ ] Route Handler 의 입력을 검증하고 인가를 확인했다
- [ ] 캐시·\`revalidate\` 설정의 근거를 설명할 수 있다
`;
