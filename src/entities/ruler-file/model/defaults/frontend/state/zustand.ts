export const stateZustand = `---
title: 상태 관리 — Zustand
stack: frontend
category: 상태 관리
extends: [base.md, frontend.md]
---

# Zustand

> 1KB(gzip) 미만의 hook-기반 store. Provider 없음. Boilerplate 없음.
> Redux Toolkit 대비: 더 단순하고 빠르지만 **devtools 시간여행 / 표준화된 비동기 / 캐시**가 약하다.

## 언제 쓰는가 (vs 대안)

| 상황 | 선택 |
|------|------|
| 단일 화면 안 로컬 상태 | \`useState\` — Zustand 불필요 |
| 서버 상태(HTTP 응답) | **TanStack Query** + Zustand는 클라이언트 상태만 |
| 여러 컴포넌트 공유 + 단순 구조 | **Zustand** |
| 시간여행 디버깅 / 엄격한 액션 추적 | Redux Toolkit |
| atom 단위 fine-grained | Jotai |

근거: Zustand는 "전역 useState" 정도의 최소 추상. 서버 캐시는 별도 도구가 항상 더 낫다.

## Store 설계 원칙

- **하나의 store = 하나의 도메인**. god store 금지.
  - 근거: store는 단일 객체이므로 키가 늘수록 리렌더 영향이 넓어진다. 도메인별로 쪼개면 selector 의존성도 줄어든다.
- 슬라이스 패턴(슬라이스 합성)으로 큰 store 분할:
  \`\`\`ts
  const useStore = create<Auth & Cart>()((...a) => ({
    ...createAuthSlice(...a),
    ...createCartSlice(...a),
  }));
  \`\`\`
- 액션은 state 객체 안에 함께 정의 — \`set\` / \`get\` 클로저 활용.

## 리렌더 최적화 — 가장 중요한 규칙

- **selector 없이 \`useStore()\` 전체를 가져오면 모든 변경에 리렌더**.
- selector 사용 규칙:
  - 단일 primitive 반환 → selector 1개, 비교 함수 불필요
  - **여러 값을 객체/배열로 묶어 반환 → \`useShallow\` 로 selector 를 감싸라 (필수)**
    - 근거: v4의 두 번째 인자(equalityFn) 방식은 v5에서 제거됨. v5는 \`useShallow\` 로 selector 를 감싸는 방식만 지원한다.
  \`\`\`ts
  // 한 개 값
  const count = useStore((s) => s.count);

  // 여러 값 → useShallow 필수 (v5)
  import { useShallow } from 'zustand/shallow';
  const { a, b } = useStore(useShallow((s) => ({ a: s.a, b: s.b })));
  \`\`\`
- 근거: 기본 비교는 \`Object.is\`. selector가 새 객체를 반환하면 매 setState마다 리렌더 발생한다.

## TypeScript

- \`create<T>()(...)\` 형태(curried)로 — 일반 \`create<T>(...)\` 는 미들웨어와 조합 시 타입 추론 깨짐.
  - 근거: Zustand v4부터 미들웨어 체인의 타입을 추론하려면 curried 형태 필요. 비-curried는 \`devtools(persist(...))\` 같은 조합에서 \`set\` 의 타입이 \`any\` 로 떨어진다.
- 명시적 \`StateCreator<T>\` 로 슬라이스 타이핑.

## 미들웨어

- \`devtools\` — 개발 모드 한정. \`devtools(fn, { enabled: process.env.NODE_ENV !== 'production' })  // Vite는 import.meta.env.DEV\`.
- \`persist\` — localStorage. 비직렬화 값(Date/Map/Set/class) 저장 금지. 필요하면 \`serialize/deserialize\` 커스텀.
- \`immer\` — 중첩 객체 mutate-style. 단순 구조면 불필요.
- \`subscribeWithSelector\` — selector 단위 구독이 필요한 경우.
- 순서: \`devtools(persist(immer(fn)))\` — devtools가 가장 바깥, persist가 그 다음.
  - 근거: devtools는 hydration된 최종 상태를 보여줘야 하고, persist는 raw state를 직렬화해야 한다.

## 서버 상태 분리

- API 응답을 store에 저장하지 않는다. TanStack Query / SWR로 분리.
- 근거: 캐시, refetch, stale-while-revalidate, retry 등을 Zustand가 제공하지 않는다. 잘못 넣으면 캐시 무효화 로직을 직접 작성해야 한다.

## 외부 접근

- 컴포넌트 밖(이벤트 핸들러, axios interceptor 등):
  - 읽기: \`useStore.getState()\`
  - 쓰기: \`useStore.setState(partial)\` 또는 액션 호출 \`useStore.getState().login(...)\`
  - 구독: \`useStore.subscribe(listener)\` — cleanup 잊지 마라.

## 비동기

- 액션 내부 \`async\` OK. \`set\` 은 동기지만 await 후 호출 가능.
- 로딩/에러 플래그는 store에 두지 말고 컴포넌트에서 try/catch + useState 또는 query 라이브러리에 위임.
  - 근거: 한 화면에서만 보이는 로딩 플래그를 전역으로 둘 이유가 없다.

## SSR / Next.js

- \`create\` 호출이 모듈 평가 시점에 발생 → 서버에서 1회 만들어진 store가 요청 간 공유될 수 있다.
- 해결: factory 패턴 + Context Provider로 **요청별 store 인스턴스**:
  \`\`\`ts
  const createStore = () => create<T>()(...);
  // Provider에서 useRef로 1회 생성
  \`\`\`

## AI 행동 규칙

- store 추가 전: 이 상태가 **3개 이상 컴포넌트에서 공유**되는가? No → useState.
- HTTP fetch 결과를 store에 넣으려 시도 시 → 중단, TanStack Query 사용.
- selector 없이 \`useStore()\` 호출 코드 발견 시 → 즉시 selector로 감싸기.

## 패턴 (DO / DON'T)

### 기본 store 정의

\`\`\`ts
// DO — 슬라이스 + typed create
interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  clear: () => void;
}

const useCartStore = create<CartState>()((set) => ({
  items: [],
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  clear: () => set({ items: [] }),
}));

// DON'T — selector 없이 전체 가져오기 (모든 변경에 리렌더)
const state = useCartStore();
\`\`\`

### 다중 값 selector

\`\`\`ts
import { useShallow } from 'zustand/shallow';

// DO — 여러 값은 useShallow 로 selector 를 감싼다 (v5)
const { items, total } = useCartStore(
  useShallow((s) => ({ items: s.items, total: s.items.length })),
);

// DON'T — 매 setState 마다 새 객체, useShallow 없으면 매번 리렌더
const obj = useCartStore((s) => ({ items: s.items }));
\`\`\`

### 외부 dispatch

\`\`\`ts
// DO — axios interceptor 같은 곳
axios.interceptors.response.use(undefined, (err) => {
  if (err.response?.status === 401) {
    useAuthStore.getState().logout();
  }
  throw err;
});
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| 서버 응답 store에 저장 | TanStack Query / SWR |
| 한 store에 모든 도메인 | 도메인별 store 또는 슬라이스 |
| \`useStore()\` 전체 구독 | selector + useShallow(다중 값) |
| \`devtools\` 프로덕션 활성 | \`enabled: DEV\` |
| persist에 Date/class 저장 | primitive 또는 커스텀 serialize |

## 적용 범위와 경계

이 문서는 **Zustand 로 클라이언트 상태를 다루는 방법**만 다룬다. 서버에서 받아온 데이터의 캐싱·무효화·재시도는 다루지 않는다 — 그건 TanStack Query 나 SWR 의 일이다.

여기서 다루지 않는 것 → 컴포넌트 구조와 상태 유형 분류는 \`frontend.md\`, store 파일을 어느 레이어에 둘지는 \`fsd.md\`/\`atomic.md\`, 렌더 성능 측정은 \`performance.md\`.

**한 프로젝트에 클라이언트 상태 라이브러리는 하나만 쓴다.** 다른 상태 문서(\`redux-toolkit.md\`, \`jotai.md\` 등)가 함께 로드돼 있으면 진행하지 말고 유저에게 어느 쪽인지 묻는다.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **서버 상태는 Query, 클라이언트 상태만 Zustand** — 이 경계가 다른 모든 편의보다 우선한다. HTTP 응답을 store 에 넣는 코드는 작성하지 않는다.
- **selector 사용 vs 코드 간결함** — selector 가 이긴다. \`useStore()\` 전체 구독은 짧지만 무관한 변경마다 리렌더한다.
- **도메인별 store vs 단일 store** — 도메인 분리가 이긴다. "지금은 작으니까 하나로"는 되돌리기 어려운 선택이다.
- **\`useState\` vs Zustand** — 한 화면 안에서만 쓰는 상태라면 \`useState\` 가 이긴다. 공유되지 않는 값을 store 에 올리지 마라.

## 자가 점검

store 를 추가·수정한 뒤 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] 이 상태가 정말 여러 컴포넌트에서 공유되는 값이다 — 아니면 \`useState\` 로 되돌렸다
- [ ] HTTP 응답을 store 에 저장하지 않았다
- [ ] store 하나가 하나의 도메인만 담는다
- [ ] 모든 구독이 selector 를 쓴다 — \`useStore()\` 전체 구독이 없다
- [ ] 여러 값을 함께 읽는 곳에 \`useShallow\` 를 썼다
- [ ] \`devtools\` 미들웨어가 프로덕션에서 비활성이다
- [ ] \`persist\` 에 \`Date\`·class 인스턴스를 넣지 않았다 — 넣었다면 커스텀 serialize 가 있다
- [ ] SSR 을 쓴다면 store 가 요청마다 격리된다 — 모듈 스코프 공유가 아니다
`;
