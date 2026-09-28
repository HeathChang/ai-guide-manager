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
  - 근거: RecoilRoot 없이 atom 을 읽으면 런타임에서 바로 throw 한다. 테스트와 SSR 에서 이 경계가 상태 격리 단위이기도 하다.

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
  - 근거: family 는 매개변수를 직렬화해 캐시 키로 쓴다. class 인스턴스는 같은 내용이어도 매번 다른 키가 되어 atom 이 무한히 늘어난다.
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
번들 사이즈도 Jotai가 더 작다(jotai 코어 ~4KB min+gzip vs recoil ~20KB+ min+gzip, bundlephobia 기준).

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

## 적용 범위와 경계

이 문서는 **기존 Recoil 코드를 유지·보수하는 방법**만 다룬다. Recoil 은 활발히 유지되지 않으므로 이 문서는 신규 채택을 전제하지 않는다.

여기서 다루지 않는 것 → 컴포넌트 구조와 상태 유형 분류는 \`frontend.md\`, atom 파일을 어느 레이어에 둘지는 \`fsd.md\`/\`atomic.md\`, 렌더 성능 측정은 \`performance.md\`.

**새 프로젝트라면 이 문서 대신 \`jotai.md\` 를 쓴다.** 멘탈 모델이 거의 같고 이관 매핑이 위에 있다. 신규 도입이 요청되면 그 사실을 유저에게 먼저 알린다.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **신규 코드의 라이브러리 선택** — Jotai 가 이긴다. 기존 Recoil 코드에 기능을 덧붙이는 경우에만 이 문서를 따른다.
- **key 유일성 vs 짧은 이름** — 유일성이 이긴다. 도메인 prefix 없는 짧은 key 는 다른 파일과 충돌해 런타임에 터진다.
- **모듈 레벨 정의 vs 컴포넌트 내부 정의** — 모듈 레벨이 이긴다.
- **서버 상태** — Query 라이브러리가 이긴다. selector 로 HTTP 캐시를 직접 만들지 않는다.

## 자가 점검

atom 이나 selector 를 추가·수정한 뒤 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] 신규 도입이라면 Jotai 를 먼저 제안했다
- [ ] 모든 atom/selector 가 모듈 레벨에 정의돼 있다
- [ ] 모든 key 에 도메인 prefix 가 있고 프로젝트 안에서 유일하다
- [ ] \`atomFamily\`/\`selectorFamily\` 매개변수가 직렬화 가능하다 — class 인스턴스가 아니다
- [ ] 앱 최상위에 \`RecoilRoot\` 가 하나 있다
- [ ] 읽기 전용에 \`useRecoilValue\`, 쓰기 전용에 \`useSetRecoilState\` 를 썼다
- [ ] 콜백 안에서 stale closure 를 피했다 (\`useRecoilCallback\` 의 snapshot 사용)
- [ ] 서버 응답 캐싱을 selector 로 직접 구현하지 않았다
`;
