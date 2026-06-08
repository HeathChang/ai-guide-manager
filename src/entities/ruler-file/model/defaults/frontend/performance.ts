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
- 이미지: \`loading="lazy"\`, 적절한 크기, 최신 포맷(WebP/AVIF).
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
`;
