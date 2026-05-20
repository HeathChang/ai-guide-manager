export const stateRecoil = `---
title: 상태 관리 — Recoil
stack: frontend
category: 상태 관리
extends: [base.md, frontend.md]
---

# Recoil

> **⚠️ 유지보수 상태 경고**
> Recoil은 Meta가 2024년 말 maintenance 모드로 전환, 2025년 초 활발한 개발이 중단됐다.
> **신규 프로젝트는 Jotai 권장** — Recoil과 거의 동일한 atom/selector 모델이며 활발히 유지된다.
> 본 문서는 이미 Recoil을 채택한 코드베이스의 안전한 운영을 위한 규칙이다.

## 핵심 개념

- **atom** — 상태 단위. \`atom({ key, default })\`.
- **selector** — 파생 상태 또는 비동기 데이터. \`selector({ key, get, set? })\`.
- **atomFamily / selectorFamily** — 매개변수화된 atom/selector.
- **RecoilRoot** — atom의 격리 영역. 앱 최상위에 1개 필수.

## Key 규칙

- atom/selector마다 **고유한 \`key\` 필수** — Recoil은 key 기반으로 상태를 추적한다.
- 모듈 경로를 prefix로 권장: \`'auth/userAtom'\`, \`'cart/totalSelector'\`.
- 근거: 키 충돌 시 런타임 에러. Hot reload 시 중복 등록도 같은 원인이다.

## 정의 위치

- atom/selector는 **모듈 레벨**. 컴포넌트 내부 정의 금지(매 렌더마다 새 등록 시도 → key 충돌).
  - 근거: Recoil은 key 기반 글로벌 레지스트리에 atom을 등록한다. 컴포넌트가 리렌더되면 같은 key로 다시 등록 시도 → "duplicate atom key" 경고 + 상태 동작 불안정.

## 읽기 / 쓰기 hook

- \`useRecoilValue(atom)\` — 읽기 전용. 가장 자주 쓰는 형태.
- \`useSetRecoilState(atom)\` — 쓰기 전용. 리렌더 영향 없음.
- \`useRecoilState(atom)\` — \`[value, setValue]\` 둘 다. 필요할 때만.
- \`useResetRecoilState(atom)\` — default로 리셋.
- 근거: 읽기/쓰기 분리는 Jotai와 동일한 이유 — 불필요한 리렌더 방지.

## Selector

- read selector: 파생값 (memoized — 의존 atom이 바뀔 때만 재계산).
- read-write selector: \`set\` 옵션으로 양방향 — atom 그룹을 하나의 인터페이스로 노출할 때 유용.
- 비동기 selector: \`get\` 안에서 \`await\` → 사용처에 \`<Suspense>\` 필요.

## atomFamily / selectorFamily

- 매개변수가 직렬화 가능해야 한다(string/number/객체). class 인스턴스 금지.
- 사용 안 하는 인스턴스는 자동 해제되지 않음 → 무한히 늘어나는 키(예: uuid)면 메모리 누수.

## Stale Closure 방지

- 이벤트 핸들러에서 atom 값을 읽을 때 \`useRecoilValue\`로 받으면 **렌더 시점 값**으로 닫힘.
- 항상 최신 값이 필요하면 \`useRecoilCallback\` 사용:
  \`\`\`ts
  const submit = useRecoilCallback(({ snapshot }) => async () => {
    const latest = await snapshot.getPromise(userAtom);
    await api.save(latest);
  });
  \`\`\`
- 근거: \`snapshot\`은 호출 시점의 store 스냅샷 → closure 캡처 회피.

## 비동기 / Suspense

- 비동기 selector 사용 시:
  - \`<Suspense fallback={...}>\` 로 감싸야 함.
  - 에러는 \`<ErrorBoundary>\`.
  - \`useRecoilValueLoadable\` 사용하면 Suspense 없이 \`{ state: 'loading' | 'hasValue' | 'hasError' }\` 수동 처리.

## Atom Effects (영속화 / 외부 동기)

- \`atom({ effects: [...] })\` — atom의 lifecycle hook.
- 사용 예: localStorage 동기화, WebSocket → atom 업데이트, 다른 atom과 양방향 동기.
- effect는 \`setSelf\` / \`onSet\` 로 변경 흐름 다룬다. cleanup은 함수 반환.

## RecoilRoot

- 앱 최상위에 1개. 테스트나 격리된 모달에는 별도 \`<RecoilRoot override>\`.
- \`initializeState\` 로 초기값 주입 — SSR 또는 테스트 픽스처에 유용.

## 마이그레이션 권장 (Recoil → Jotai)

| Recoil | Jotai |
|--------|-------|
| \`atom({ key, default })\` | \`atom(default)\` (key 불필요) |
| \`selector({ key, get })\` | \`atom((get) => ...)\` |
| \`atomFamily\` | \`atomFamily\` (jotai/utils) |
| \`useRecoilValue\` / \`useSetRecoilState\` | \`useAtomValue\` / \`useSetAtom\` |
| \`useRecoilCallback({ snapshot })\` | \`useAtomCallback\` 또는 store 직접 접근 |

근거: Jotai는 key 없이 reference equality로 atom을 식별 → 보일러플레이트 감소.
번들 사이즈도 더 작음(~4KB vs ~14KB).

## AI 행동 규칙

- 신규 atom 추가 전 **"Recoil 대신 Jotai로 갈 수 있는가"** 1초 검토.
- key 충돌 위험 — 새 atom 만들 때 prefix(모듈명/도메인) 강제.
- 이벤트 핸들러에서 atom 읽으면 \`useRecoilCallback\` 사용했는지 확인.
- 비동기 selector 도입 시 Suspense 경계 함께 추가.

## 패턴 (DO / DON'T)

### Key 충돌 예방

\`\`\`ts
// DON'T — 두 모듈에서 같은 key
// auth.ts
export const userAtom = atom({ key: 'user', default: null });
// profile.ts
export const userAtom = atom({ key: 'user', default: null }); // 충돌!

// DO — 모듈 prefix
export const userAtom = atom({ key: 'auth/user', default: null });
export const profileAtom = atom({ key: 'profile/data', default: null });
\`\`\`

### Stale closure

\`\`\`tsx
// DON'T — submit 시점 값이 아니라 렌더 시점 값
function Form() {
  const user = useRecoilValue(userAtom);
  const submit = () => api.save(user); // user는 렌더 시점 캡처
  return <button onClick={submit}>저장</button>;
}

// DO — snapshot으로 최신 값
function Form() {
  const submit = useRecoilCallback(({ snapshot }) => async () => {
    const latest = await snapshot.getPromise(userAtom);
    await api.save(latest);
  });
  return <button onClick={submit}>저장</button>;
}
\`\`\`

### 비동기 selector

\`\`\`tsx
const userQuery = selector({
  key: 'user/query',
  get: async ({ get }) => {
    const id = get(userIdAtom);
    return fetch(\`/api/users/\${id}\`).then((r) => r.json());
  },
});

// DO — Suspense + ErrorBoundary
<ErrorBoundary>
  <Suspense fallback={<Spinner />}>
    <UserView />
  </Suspense>
</ErrorBoundary>
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| 신규 프로젝트 Recoil 채택 | Jotai (동일 멘탈모델, 활발 유지) |
| key 없이 또는 짧은 key (\`'x'\`) | 도메인 prefix \`'cart/items'\` |
| 컴포넌트 내부 atom 정의 | 모듈 레벨 |
| 핸들러에서 stale 값 사용 | \`useRecoilCallback\` snapshot |
| atomFamily uuid 무한 누적 | 명시적 정리 또는 size cap |
`;
