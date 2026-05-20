export const stateMobx = `---
title: 상태 관리 — MobX
stack: frontend
category: 상태 관리
extends: [base.md, frontend.md]
---

# MobX

> Observable / Observer 기반의 **반응형 상태 관리**. immutable 패턴(Redux/Zustand/Jotai)과 정반대 방향이다.
> 도메인 모델을 OOP 스타일로 짤 때 자연스럽다. 멘탈모델이 다르므로 한 프로젝트에서 다른 라이브러리와 섞지 마라.

## 언제 쓰는가

- 복잡한 도메인 모델 (편집기, 그래프, 폼 위저드 등) — OOP로 표현이 직관적인 경우
- 파생값이 많고, 자동 메모이즈가 큰 가치인 경우 (\`computed\`)
- 팀이 React 외에도 사용 (MobX 코어는 프레임워크 독립)

**부적합:** 시간여행 디버깅 / 함수형 immutable 컨벤션이 중요한 팀.

## 설치 + 엄격 모드

- \`mobx\` + \`mobx-react-lite\` (또는 \`mobx-react\` — class 컴포넌트도 쓸 때).
- 앱 초기화에서 **반드시** 엄격 모드 활성:
  \`\`\`ts
  import { configure } from 'mobx';
  configure({
    enforceActions: 'always',         // 모든 mutation은 action 안에서만
    computedRequiresReaction: true,   // computed는 observer 안에서만 호출
    reactionRequiresObservable: true,
    observableRequiresReaction: true,
    disableErrorBoundaries: false,
  });
  \`\`\`
- 근거: 엄격 모드 없이는 "action 밖 mutation"이 silent 동작 → 디버깅 지옥.

## Store 작성

- **\`makeAutoObservable(this)\` 의무 사용** — class 또는 plain 객체 모두 가능.
  - 근거: getter는 자동으로 computed, 메서드는 자동으로 action, 그 외 필드는 observable로 분류. 수동 \`makeObservable\` 은 필드 타입을 일일이 명시해야 하며 누락 시 silent하게 reactive에서 빠진다.
- 한 store = 한 도메인. cross-domain 의존이 있으면 rootStore 패턴.
- \`@observable / @action / @computed\` 데코레이터는 환경 설정이 복잡 → 사용 금지. \`makeAutoObservable\` 로 통일.
  - 근거: TypeScript 5의 표준 데코레이터(stage-3)는 MobX의 legacy 데코레이터와 비호환. \`experimentalDecorators: true\` 설정 시 TS 5 신기능과 충돌한다.

\`\`\`ts
class CartStore {
  items: CartItem[] = [];
  constructor() {
    makeAutoObservable(this);
  }
  addItem(item: CartItem) {
    this.items.push(item);   // 직접 mutate OK (action 자동)
  }
  get total() {
    return this.items.reduce((s, i) => s + i.price, 0);   // computed 자동
  }
}
\`\`\`

## Observer 컴포넌트

- React 컴포넌트는 **\`observer(Component)\` HOC**로 감싸야 reactive.
- root 한 군데만 감싸지 마라. **읽는 컴포넌트마다 감싸기**:
  - 근거: observer는 그 컴포넌트가 읽은 observable만 추적 → fine-grained 리렌더. 상위에만 감싸면 하위 변경에 상위 전체가 리렌더.

## Action

- mutation은 반드시 action 안에서. \`enforceActions: 'always'\` 면 외부 mutation은 throw.
- 비동기: \`await\` 후 mutation은 \`runInAction\` 또는 별도 action 메서드.
  \`\`\`ts
  async load() {
    const data = await api.fetch();
    runInAction(() => { this.data = data; });
  }
  \`\`\`
- \`flow\` (generator) 패턴도 가능하지만 async/await + runInAction이 더 명료.

## Computed

- 의존 observable이 바뀔 때만 재계산 (자동 메모).
- **순수해야 함** — 호출이 부작용을 일으키면 안 됨.
- getter로 정의 (\`get total()\`).
- 비싼 계산이 아니면 평범한 메서드(\`getTotal()\`)도 OK — 의미는 같지만 매번 재계산.

## Reaction / autorun / when

- side effect 처리 (로깅, persistence, WebSocket sync).
- \`autorun\` — 의존 observable이 바뀔 때마다 실행. cleanup 반환.
- \`reaction\` — \`(data, reaction)\` 형태, 첫 함수의 반환값이 바뀔 때만 실행.
- \`when\` — 조건이 처음 true 될 때 한 번.
- 권장: autorun 남용 금지 — observer 컴포넌트 안에 두는 것이 우선.

## React에서 props 안 자주 변경

- observable을 props로 통째 전달하지 말 것 — observer로 컴포넌트를 감싸고 store에서 직접 읽어라.
- 근거: props로 객체를 통째 전달하면 변경 감지가 깨질 수 있다 + memo 안 먹힘.

## TypeScript

- class store는 자동 typing. plain 객체 store는 \`makeAutoObservable<T>(this)\` 명시적.
- \`@observable\` 데코레이터 쓰지 마 (TS 5 데코레이터와 충돌 가능).

## Provider / context

- 단일 rootStore 인스턴스를 React Context로 전달:
  \`\`\`tsx
  const StoreContext = createContext<RootStore | null>(null);
  export const useStore = () => {
    const s = useContext(StoreContext);
    if (!s) throw new Error('StoreProvider missing');
    return s;
  };
  \`\`\`
- 테스트는 별도 인스턴스 주입.

## 서버 상태

- HTTP 응답을 observable 안에 저장하는 건 가능하지만 캐시 무효화는 직접 짜야 함.
- 신규 코드라면 TanStack Query 병용도 검토 — MobX는 클라이언트 상태 / 도메인 모델.

## AI 행동 규칙

- 컴포넌트 작성 시 store를 읽으면 **반드시 \`observer\`로 감싼다**.
- mutation 코드 발견 시 action 안인지 확인. async에서 await 후 mutation이면 \`runInAction\`.
- \`@observable\` 데코레이터 사용 코드 발견 시 \`makeAutoObservable\`로 마이그레이션 권고.
- 한 store에서 다른 store 직접 import → rootStore 통해 접근으로 리팩토링.

## 패턴 (DO / DON'T)

### Observer 위치

\`\`\`tsx
// DON'T — root만 observer (자식 전부 리렌더)
const App = observer(() => (
  <>
    <Header /> <Body /> <Footer />
  </>
));

// DO — 읽는 곳마다 observer
const Header = observer(() => <h1>{store.title}</h1>);
const Body = observer(() => <p>{store.body}</p>);
\`\`\`

### 비동기 mutation

\`\`\`ts
// DON'T — await 후 직접 mutate (action 밖)
async load() {
  const data = await api.fetch();
  this.data = data;   // strict mode면 throw
}

// DO — runInAction
async load() {
  const data = await api.fetch();
  runInAction(() => { this.data = data; this.loading = false; });
}
\`\`\`

### Computed

\`\`\`ts
// DO — getter (자동 메모)
get filteredItems() {
  return this.items.filter((i) => i.active);
}

// DON'T — observer 밖에서 호출
console.log(store.filteredItems);   // computedRequiresReaction 위반
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| 엄격 모드 비활성 | \`enforceActions: 'always'\` |
| root만 observer | 읽는 컴포넌트마다 observer |
| async에서 await 후 직접 mutate | \`runInAction\` |
| 데코레이터 \`@observable\` | \`makeAutoObservable(this)\` |
| MobX + Redux/Zustand 혼용 | 한 라이브러리만 |
`;
