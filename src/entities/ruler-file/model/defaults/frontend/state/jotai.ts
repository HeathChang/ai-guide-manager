export const stateJotai = `---
title: 상태 관리 — Jotai
stack: frontend
category: 상태 관리
extends: [base.md, frontend.md]
---

# Jotai

> "Bottom-up" atom 기반. Recoil의 컨셉을 더 가볍게(~4KB) 구현했고 현재 활발히 유지보수된다.
> 한 단위가 **atom 1개** — 각 atom을 구독하는 컴포넌트만 리렌더된다.

## 언제 쓰는가

- 컴포넌트 트리 깊이 prop drilling이 부담스러운 단순 상태 공유
- atom 단위 fine-grained 리렌더가 필요한 대규모 폼/캔버스/에디터
- React Suspense + 비동기 데이터를 atom으로 통일하고 싶을 때
- **부적합:** 강한 액션 추적·시간여행 필요(→ RTK), 거대한 트리 정규화(→ RTK + entityAdapter)

## 핵심 개념

- **atom** = state 단위. \`atom(initialValue)\`.
- **derived atom** = 다른 atom으로부터 계산된 read-only / read-write atom.
- **atomFamily** = 매개변수로 lookup 되는 atom 컬렉션 (목록, 행 단위).
- **Provider** = atom 격리 영역 (테스트, SSR per-request).

## Atom 작성 원칙

- atom은 **모듈 레벨**에서 정의 — 컴포넌트 내부 정의 금지(매 렌더마다 새 atom).
- 의미 단위로 작게 — primitive atom 여러 개가 큰 객체 atom 1개보다 항상 낫다.
  - 근거: 한 필드만 바뀌어도 그 atom 구독자만 리렌더 → fine-grained가 Jotai의 핵심 가치.
- atom은 동일한 참조로 export — 다른 모듈에서 import해도 같은 atom이어야 함.

## 읽기 / 쓰기 분리

- \`useAtomValue(atom)\` — 읽기만. setter 안 받음 → 리렌더 영향 최소.
- \`useSetAtom(atom)\` — 쓰기만. 값 변경에 리렌더 없음 (handler 안에서 dispatch만 할 때 유용).
- \`useAtom(atom)\` — 둘 다. 필요할 때만.
  - 근거: 잘못된 hook 선택은 불필요한 리렌더의 가장 흔한 원인.

## Derived atom

\`\`\`ts
const countAtom = atom(0);
const doubleAtom = atom((get) => get(countAtom) * 2);                   // read-only
const incAtom = atom(null, (get, set) => set(countAtom, get(countAtom) + 1)); // write-only
\`\`\`

- 파생 atom은 의존하는 atom이 바뀔 때만 재계산 (자동 메모).
- 비동기 derived atom: \`async (get) => await fetch(...)\` → 사용 시 \`<Suspense>\` 필요.

## atomFamily

- 동일 구조의 atom을 id별로 만들고 싶을 때 (todo 리스트, 행 단위 편집).
- **메모리 누수 주의** — 한 번 만든 atom은 자동 해제되지 않음. 필요하면 \`atomFamily.remove(id)\` 명시.

## 영속화 / 외부 시스템

- \`atomWithStorage(key, initial)\` — localStorage / sessionStorage 동기화.
- \`atomWithReset\` + \`useResetAtom\` — 리셋 패턴.
- \`atomWithObservable\` — RxJS / WebSocket 같은 스트림 연결.

## Provider 사용

- 기본 store(\`getDefaultStore()\`)는 앱 전역에 1개.
- 테스트, 모달, SSR 격리는 \`<Provider>\` 로 별도 store 생성.
- 같은 atom이라도 Provider 안/밖에서 다른 인스턴스 — 의도적 격리에만 사용.
  - 근거: SSR에서 Provider 없이 모듈 스코프 store를 쓰면 요청 간 상태가 누수된다. 테스트도 마찬가지 — Provider로 매 테스트 격리해야 다른 테스트의 atom 변화가 새지 않는다.

## 서버 상태와의 관계

- 단순 fetch는 \`atom(async (get) => ...)\` 로 가능하지만 **캐시 무효화·refetch가 빈약**.
- 실 서비스에서 GET 캐싱이 필요하면 TanStack Query + Jotai 병행 (Query는 서버 캐시, Jotai는 클라이언트 상태).

## TypeScript

- \`atom<T>(initial)\` 명시 타입 — initial이 narrow하게 추론되는 경우 방지.
- write-only atom 정의 시 read 시그니처는 \`null\` 또는 명시적 타입:
  \`\`\`ts
  const incAtom = atom<null, [number], void>(null, (get, set, by) => ...);
  \`\`\`

## AI 행동 규칙

- 컴포넌트 내부에서 \`atom()\` 호출 발견 시 → 즉시 모듈 레벨로 끌어올린다.
- 객체 atom 하나에 5개 이상 필드가 있으면 → primitive atom으로 분할 검토.
- \`useAtom()\` 사용했지만 set 함수를 안 쓰면 → \`useAtomValue\` 로 교체.
- 비동기 atom 도입 전 Suspense 경계가 있는지 확인.

## 패턴 (DO / DON'T)

### atom 정의 위치

\`\`\`ts
// DON'T — 매 렌더 새 atom (다른 인스턴스)
function Counter() {
  const countAtom = atom(0);                     // 새 atom!
  const [count, setCount] = useAtom(countAtom);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// DO — 모듈 레벨
const countAtom = atom(0);
function Counter() {
  const [count, setCount] = useAtom(countAtom);
  return ...;
}
\`\`\`

### 읽기/쓰기 hook 선택

\`\`\`ts
// DO
const name = useAtomValue(userNameAtom);   // read-only 컴포넌트
const setName = useSetAtom(userNameAtom);  // submit 핸들러 등 write-only

// DON'T — 읽기만 필요한데 매번 setter도 받음
const [name] = useAtom(userNameAtom);
\`\`\`

### atom 분할

\`\`\`ts
// DON'T — 한 필드만 바뀌어도 user를 보는 모든 컴포넌트 리렌더
const userAtom = atom({ name: '', email: '', age: 0 });

// DO — fine-grained
const userNameAtom = atom('');
const userEmailAtom = atom('');
const userAgeAtom = atom(0);
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| 컴포넌트 내부 \`atom()\` | 모듈 레벨 |
| 거대한 객체 atom 한 개 | primitive atom 여러 개 |
| 서버 응답 캐싱을 atom으로 자체 구현 | TanStack Query + Jotai |
| atomFamily 무한 추가 | 사용 끝나면 \`remove(id)\` |
| read-only인데 \`useAtom\` | \`useAtomValue\` |
`;
