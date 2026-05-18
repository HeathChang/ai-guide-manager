export const stateReduxToolkit = `---
title: 상태 관리 — Redux Toolkit
stack: frontend
category: 상태 관리
extends: [base.md, frontend.md]
---

# Redux Toolkit (RTK)

> 모던 Redux는 **RTK 만**이 정답이다. 기본 \`redux\` 패키지를 직접 다루지 않는다.
> RTK는 \`configureStore\`, \`createSlice\`, \`createAsyncThunk\`, \`createEntityAdapter\`, \`RTK Query\`를 묶은 공식 toolkit이다.

## 절대 원칙

- **manual reducer / switch 문 금지** — 항상 \`createSlice\`.
  - 근거: 보일러플레이트 80% 감소, 액션 타입 자동 생성, Immer 내장으로 mutate-style 작성이 안전해진다.
- **서버 상태는 RTK Query** — slice에 fetch 결과 저장 금지.
  - 근거: 캐싱, refetch, invalidation, 로딩/에러 상태를 RTK Query가 표준화한다. 직접 \`createAsyncThunk + slice\`로 만들면 같은 로직을 매번 재발명한다.
- **로컬 UI 상태는 Redux에 넣지 않는다** — modal open/close, 단일 컴포넌트 폼 입력 등.
  - 근거: Redux는 \`전역 공유 + 시간여행 디버깅 + 미들웨어\`가 필요할 때 가치가 있다. 그 외엔 \`useState\`가 항상 더 가볍다.

## Store 구성

- \`configureStore\` 한 번만, \`store.ts\`에 둔다.
- \`combineReducers\` 직접 호출 금지 — \`configureStore({ reducer: { ... } })\` 사용.
- 미들웨어 추가는 \`getDefaultMiddleware().concat(...)\` 패턴.
- \`serializableCheck\` / \`immutableCheck\` 비활성화 금지 — 비직렬화 값(Date, Map, Class)이 들어가면 Redux의 시간여행이 깨진다. 필요하면 ignoredPaths로 한정.

## Slice 작성

- 파일 위치: \`features/{domain}/{domain}Slice.ts\` (FSD라면 \`entities/{domain}/model/slice.ts\`).
- 액션 타입은 자동 — \`{sliceName}/{reducerName}\`. **수동 액션 타입 작성 금지**.
- reducer 내부에서 \`state.x = y\` 직접 변경 OK (Immer가 immutable 처리).
  - 단, \`return\` 으로 새 객체 반환할 거면 spread 사용. **둘을 섞지 마라.**
- \`extraReducers\`로 외부 액션(다른 slice, thunk) 처리.

## Selector

- 모든 useSelector는 **메모이즈 가능 형태로** 작성.
- 파생값은 \`createSelector\` (reselect, RTK에 포함) 사용.
- **useSelector가 새 객체/배열을 반환하면 안 된다.**
  - 근거: useSelector는 strict equality(\`===\`)로 비교. 매번 새 참조면 모든 dispatch에서 리렌더가 발생한다.
  - 대안: selector 분리 (값 하나씩) 또는 \`shallowEqual\` 비교 함수 전달.

## 정규화 (Normalization)

- 목록 데이터(users, posts 등)는 \`createEntityAdapter\` 사용.
- 근거: \`{ ids: [], entities: {} }\` 구조로 O(1) lookup, 중복 제거 자동, 정렬 selector 제공.

## 비동기

- **RTK Query 우선** (HTTP/캐시 가능한 도메인 전부).
- RTK Query로 표현 어려운 경우만 \`createAsyncThunk\` (예: 복잡한 페이즈 분기, WebSocket 이벤트 → store 반영).
- 같은 도메인 데이터를 두 방식으로 동시에 다루지 않는다 — 캐시 정합성이 깨진다.

## RTK Query 규칙

- 엔드포인트 정의는 도메인별 \`api.ts\`. \`createApi\` 한 번만 (또는 \`injectEndpoints\`로 분할).
- \`tagTypes\` + \`providesTags\` / \`invalidatesTags\`로 캐시 무효화 관리.
- 컴포넌트에서 \`fetch\` 직접 호출 금지 — 항상 \`useGetXxxQuery\` 훅.
- \`refetchOnMountOrArgChange\`, \`refetchOnFocus\`, \`pollingInterval\`은 명시적 의도 있을 때만.

## TypeScript

- \`RootState\` / \`AppDispatch\` 타입을 \`store.ts\`에서 export.
- 컴포넌트에서는 직접 \`useSelector<RootState>\` 쓰지 말고 **typed hook** 작성:
  \`\`\`ts
  export const useAppDispatch: () => AppDispatch = useDispatch;
  export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
  \`\`\`
  - 근거: 매 useSelector마다 제네릭 반복하는 보일러플레이트 제거 + 타입 누락 방지.

## AI 행동 규칙

- 새 상태 추가 시: **이 상태가 진짜 전역 공유가 필요한가?** 1초 자문 → No 면 useState.
- 비동기 데이터 가져올 때 \`fetch + useEffect + slice\` 작성 시도 금지 → 반드시 RTK Query.
- selector 결과가 \`[]\` 또는 \`{}\` 리터럴이면 **반드시** \`createSelector\` 또는 미리 빈 상수 정의.

## 패턴 (DO / DON'T)

### Slice 작성

\`\`\`ts
// DO — createSlice + Immer
const usersSlice = createSlice({
  name: 'users',
  initialState: { byId: {}, ids: [] },
  reducers: {
    userAdded(state, action: PayloadAction<User>) {
      state.byId[action.payload.id] = action.payload;
      state.ids.push(action.payload.id);
    },
  },
});

// DON'T — 수동 reducer / switch
function usersReducer(state = init, action) {
  switch (action.type) {
    case 'USER_ADDED': return { ...state, ... };
  }
}
\`\`\`

### useSelector 안전한 사용

\`\`\`ts
// DON'T — 매 dispatch마다 리렌더 (새 객체 반환)
const { name, email } = useSelector((s: RootState) => ({
  name: s.user.name,
  email: s.user.email,
}));

// DO — 값 단위로 분리
const name = useSelector((s: RootState) => s.user.name);
const email = useSelector((s: RootState) => s.user.email);

// DO — 객체가 필요하면 reselect로 메모
const selectUserSummary = createSelector(
  (s: RootState) => s.user,
  (user) => ({ name: user.name, email: user.email }),
);
\`\`\`

### 서버 데이터

\`\`\`ts
// DON'T — slice + thunk + 직접 캐싱
const fetchUsers = createAsyncThunk('users/fetch', async () => {
  const res = await fetch('/api/users');
  return res.json();
});

// DO — RTK Query
const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['User'],
  endpoints: (b) => ({
    getUsers: b.query<User[], void>({
      query: () => '/users',
      providesTags: ['User'],
    }),
  }),
});
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| 로컬 UI 상태(모달 open) 를 store에 보관 | \`useState\` |
| 액션 타입 수동 작성 \`'USER/ADD'\` | \`createSlice\` 자동 생성 |
| reducer 안에서 비동기 호출 | \`createAsyncThunk\` / RTK Query |
| store 외부에서 raw \`store.dispatch\` 남발 | 컴포넌트 내부 typed hook 사용, 외부는 thunk listener |
| \`Date\`, \`Map\`, class instance 를 state에 저장 | 직렬화 가능한 primitive + 객체 |
`;
