export const frontendPerformance = `---
title: 성능
stack: frontend
category: 성능
extends: [base.md, frontend.md]
---

# Frontend Performance

> \`base.md\`, \`frontend.md\`를 상속한다. Core Web Vitals 기준선과 최적화 원칙이다.

## 목표치 (Core Web Vitals)

| 지표 | 목표 |
|------|------|
| LCP (Largest Contentful Paint) | < 2.5s |
| CLS (Cumulative Layout Shift) | < 0.1 |
| INP (Interaction to Next Paint) | < 200ms |
| FCP (First Contentful Paint) | < 1.8s |

## 번들 / 네트워크

- 라우트 단위 **코드 스플리팅** (React.lazy + Suspense).
- 이미지: \`loading="lazy"\`, 표시 크기의 2배를 넘지 않는 원본, 최신 포맷(WebP/AVIF).
  - 근거: 400px 로 그려지는 자리에 4000px 원본을 넣으면 다운로드와 디코딩 비용만 늘고 화면은 똑같다. 2배는 고DPI 화면을 위한 상한이다.
- 폰트: \`font-display: swap\`, 사전 로드(\`rel="preload"\`).
- 대용량 의존성은 **dynamic import**로 지연 로드.

## 렌더링

- \`React.memo\`는 **props 자주 안 바뀌는 리스트 아이템**, **큰 하위 트리**에만 적용.
- \`useMemo\`는 **비용 큰 계산**에만.
- \`useCallback\`은 **자식에 전달되어 리렌더 유발**하는 핸들러에만.
- 대량 리스트는 **가상화**(@tanstack/react-virtual, react-window) 검토.

## 측정 기반

- **측정 없이 최적화 금지** — React DevTools Profiler / Lighthouse 수치로 의사결정.
  - 근거: 추측 기반 최적화는 *느려지는* 경우가 빈번하다(불필요한 memo로 비교 비용 ↑, 코드 가독성 ↓). "프로파일러가 이 컴포넌트를 N ms 라고 보여줬다" 같은 근거가 있어야 변경 정당.
- 회귀 방지를 위해 번들 사이즈를 CI에서 추적.
  - 근거: 의존성 1개가 100KB+ 늘릴 수 있고, 그게 사용자 LCP 1초+로 직결. CI에서 자동 체크 안 하면 PR 리뷰어가 매번 \`dist/\` 사이즈를 외워야 한다.

## AI 행동 규칙

- \`memo\` / \`useMemo\` / \`useCallback\` 추가 시 — **프로파일러 측정 결과 또는 명백한 비교 근거**를 주석으로. 근거 없으면 추가 금지.
  - 근거: 빈 \`useCallback\` 은 dependency array 의존성 추적 비용만 더한다. 자식 컴포넌트가 \`memo\` 로 감싸져 있고 핸들러를 비교하는 경우에만 의미.
- 새 npm 패키지 추가 시 \`bundlephobia.com\` 또는 \`pkg-size\` 로 gzip 사이즈 확인 후 PR 설명에 명시.
- \`<img>\` 추가 시 \`loading="lazy"\` + \`width\`/\`height\` 명시 — 누락 시 layout shift(CLS) 발생.

## 패턴 (DO / DON'T)

### memo / useMemo

\`\`\`tsx
// DON'T — 근거 없는 최적화
const Row = memo(({ item }) => <div>{item.name}</div>);
const total = useMemo(() => a + b, [a, b]);

// DO — 프로파일로 확인된 병목에만
// Row는 10k 리스트의 아이템, props 안 바뀜 — React Profiler 측정 근거
const Row = memo(({ item }) => <ExpensiveSubtree item={item} />);
\`\`\`

### 이미지

\`\`\`tsx
// DON'T — 원본 크기 그대로
<img src="/hero-4000x3000.png" />

// DO — 반응형 + lazy + 최신 포맷
<img
  src="/hero-800.webp"
  srcSet="/hero-400.webp 400w, /hero-800.webp 800w"
  loading="lazy"
  width="800"
  height="600"
/>
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| 추측 기반 \`memo\` / \`useMemo\` | 프로파일 측정 후 적용 |
| 메인 스레드를 막는 동기 큰 계산 | Web Worker / 청크 분할 |
| 모든 페이지 단일 번들 | 라우트 단위 \`lazy\` + Suspense |

## 적용 범위와 경계

이 문서는 **브라우저에서 체감되는 로딩·렌더 성능**만 다룬다. 서버 응답 시간과 DB 쿼리 성능은 다루지 않는다 — 그쪽은 백엔드 룰셋의 \`caching.md\` 와 \`database.md\` 가 담당한다.

여기서 다루지 않는 것 → 컴포넌트 구조는 \`frontend.md\`, 이미지 스타일·토큰은 \`styling.md\`, 번들 사이즈 CI 게이트 설정은 \`git.md\`.

**이 문서는 최적화를 허가하는 문서가 아니라 제한하는 문서다.** 목표치를 넘지 않는 한 최적화하지 않는 것이 기본값이다.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **측정 근거 vs 최적화 직감** — 측정이 이긴다. 프로파일러 수치 없이 \`memo\` 를 추가하지 마라.
- **성능 vs \`a11y.md\`** — 접근성이 이긴다. 렌더를 줄이려고 포커스 관리나 \`aria-live\` 를 제거하지 않는다.
- **성능 vs 가독성** — 목표치를 넘기지 않는 한 가독성이 이긴다. 목표치를 넘겼다면 성능이 이기고, 그 판단 근거를 주석으로 남긴다.
- **번들 축소 vs 기능 요구** — 유저 지시가 이긴다. 다만 추가되는 gzip 사이즈와 예상 LCP 영향을 먼저 보고한다.

## 자가 점검

성능에 영향을 주는 변경을 한 뒤 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] 추가한 \`memo\` / \`useMemo\` / \`useCallback\` 마다 측정 근거가 주석으로 있다
- [ ] 새 npm 패키지의 gzip 사이즈를 확인하고 PR 설명에 적었다
- [ ] 새 \`<img>\` 에 \`loading="lazy"\` 와 \`width\`/\`height\` 가 있다
- [ ] 새 라우트가 \`React.lazy\` + Suspense 로 분리돼 있다
- [ ] 100개를 넘길 수 있는 리스트에 가상화를 검토했다
- [ ] 메인 스레드를 막는 동기 계산을 추가하지 않았다
- [ ] 목표치(LCP 2.5s / CLS 0.1 / INP 200ms)를 넘기지 않는지 Lighthouse 로 확인했거나, 확인하지 못했다면 그 사실을 명시했다
`;
