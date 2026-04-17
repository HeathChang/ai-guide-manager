export const frontendPerformance = `# Frontend Performance

> Core Web Vitals 기준선과 최적화 원칙이다.

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
- 대량 리스트는 **가상화**(react-virtual, TanStack Virtual) 검토.

## 측정 기반

- **측정 없이 최적화 금지** — React DevTools Profiler / Lighthouse 수치로 의사결정.
- 회귀 방지를 위해 번들 사이즈를 CI에서 추적.

## AI 행동 규칙

- \`memo\` / \`useMemo\` 추가 전 **비용 근거**를 주석으로 명시.
- 새 의존성 추가 시 번들 영향(gzip size)을 확인.

## 금지 패턴

- 추측 기반 최적화 (\`memo\` / \`useMemo\` 남발)
- 거대 이미지 원본 그대로 로드
- 메인 스레드를 막는 동기 큰 계산
`;
