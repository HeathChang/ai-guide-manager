export const frontendFrontend = `---
title: 프론트엔드 공통
stack: frontend
category: 공통
extends: [base.md]
---

# Frontend Rules (React)

> \`base.md\` 규칙을 상속한다. React 프론트엔드에 추가로 적용되는 규칙이다.
> 이 룰셋은 React 기준이다. 다른 프레임워크는 별도 룰을 사용하라.

## 컴포넌트 기본 원칙

- **함수 컴포넌트만** 사용한다. 클래스형 금지.
  - 근거: React 16.8 이후 hook으로 모든 상태·side-effect를 표현 가능. 클래스는 \`this\` 바인딩·라이프사이클 분산이라는 *해소된 문제*를 다시 가져온다. 한 코드베이스에 두 패러다임 혼재 = 매번 어느 쪽인지 식별 비용.
- 200줄 규칙(base.md)은 컴포넌트에 특히 엄격히 적용 — 초과 시 자식 컴포넌트/커스텀 훅으로 분리한다.
  - 근거: 200줄 넘는 컴포넌트는 자식 컴포넌트/훅으로 추출할 책임이 거의 항상 있다. 임계값을 두지 않으면 점점 비대해진다.
- \`default export\`는 **Page 컴포넌트**에서만 허용한다. 그 외는 named export.
  - 근거: default export는 import 시 임의 이름 가능 → 같은 컴포넌트가 코드베이스에서 다른 이름으로 등장 → 검색·리네임 불가. named export는 호출지점 일관성을 강제.

## 컴포넌트 역할 분리

### Presentational — \`{Name}.ui.tsx\`

- UI 렌더링만 담당한다.
- 비즈니스 로직, API 호출, 전역 상태 접근 금지.
  - 근거: props 만으로 그려지는 컴포넌트는 스토리북·테스트에서 값만 바꿔 모든 상태를 재현할 수 있다. 내부에서 API 나 store 를 읽는 순간 그 상태를 만들려면 네트워크나 Provider 를 통째로 모킹해야 한다.
- Props로만 데이터를 받는다.

### Container — \`{Name}.container.tsx\`

- 비즈니스 로직, Hook 사용, 데이터 가공 담당.
- UI를 직접 렌더링하지 않고 Presentational에 위임한다.

### Page — \`{Name}.page.tsx\`

- 라우트 단위 책임만 갖는다.
- path param / query 검증, redirect 처리.

## Hooks

- 커스텀 훅은 \`useXxx\` 형태로 작성한다.
  - 근거: React가 \`use\` 접두어로 hook 호출 규칙(조건문 안 호출 금지 등)을 정적 검사. 다른 이름이면 react-hooks/rules-of-hooks 룰이 적용 안 된다.
- 훅에서 **JSX 반환 금지**.
  - 근거: JSX 반환 훅은 사실상 컴포넌트인데 컴포넌트 규칙(memo, ref, displayName 등)을 적용 못 한다. 컴포넌트로 만들어야 React가 정상 추적.
- 하나의 훅은 **데이터 / 상태 / 액션** 중 하나의 관심사만 담당.

## 상태 관리

| 상태 유형 | 도구 |
|-----------|------|
| 서버 상태 | React Query / RTK Query (\`fetch\` 직접 사용 금지) |
| 로컬 UI 상태 | useState / useReducer |
| 공유 UI 상태 | Context (최소 범위 Provider) |

- **컴포넌트와 훅 본문에서 \`fetch\` 직접 호출 금지.** 서버 상태는 React Query / RTK Query 로 가져온다.
  - 근거: 컴포넌트에서 직접 fetch 하면 캐싱·중복요청 제거·로딩/에러 상태·재시도를 매번 수동 구현하게 된다.
  - 예외: \`queryFn\` / \`mutationFn\` 내부, 그리고 \`api/\` 계층의 요청 함수 안에서는 \`fetch\` 가 정상이다 — 여기가 fetch 가 있어야 할 자리다. "fetch 금지"를 이 경계 밖까지 확대 적용하지 마라.
- UI 상태와 서버 상태를 같은 store에 섞지 않는다.
  - 근거: 서버 상태는 캐시·무효화·재요청 수명주기를, UI 상태는 즉각적 로컬 변경을 가진다. 한 store에 섞으면 캐시 무효화가 UI 상태까지 날리거나 stale 데이터가 UI에 고착된다.

## 접근성 최소선

아래 4개는 **모든 React 코드가 예외 없이 지키는 최소선**이다. 전체 접근성 규칙의 단일 출처는 \`a11y.md\` 이며, 룰셋에 \`a11y.md\` 가 있으면 그쪽이 상세하고 이 목록은 요약이다.

- \`<img>\` → \`alt\` 필수 (장식용은 \`alt=""\`)
- \`<input>\` → \`<label>\` 또는 \`aria-label\`
- 클릭 영역은 \`<button>\` / \`<a>\` 사용 (\`div + onClick\` 금지)
- 아이콘 버튼 → \`aria-label\` 필수
  - 근거: 이 4개는 스크린 리더·키보드 사용자를 *완전히 배제*하는 결함이라 다른 접근성 항목과 급이 다르다. 나머지는 개선이지만 이건 차단이다.

## AI 행동 규칙

- 컴포넌트 생성 시 역할(UI / Container / Page)을 먼저 결정한다.
- 성능 최적화는 **측정 후** 적용한다. 추측 기반 \`memo\` / \`useMemo\` 금지.
  - 근거: 근거 없는 memo 는 비교 비용과 의존성 배열 관리 비용만 추가한다. 실제로 느려지는 경우가 흔하다. 상세는 \`performance.md\`.

## 패턴 (DO / DON'T)

### 클릭 요소

\`\`\`tsx
// DON'T — 키보드 접근 불가, 시맨틱 부재
<div onClick={handleClick}>저장</div>

// DO
<button type="button" onClick={handleClick}>저장</button>
\`\`\`

### Props 타입

\`\`\`tsx
// DON'T
type Props = { data: any };

// DO
type Props = { data: UserDto };
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| 색상·간격·폰트 크기 하드코딩 | 디자인 토큰 (\`text-text-main\`, \`p-4\`) |
| props drilling 3단계 이상 | Context / 컴포넌트 재구성 |
| \`fetch\` 직접 호출 | React Query / RTK Query |
| 클래스 컴포넌트 | 함수 컴포넌트 + Hooks |

## 적용 범위와 경계

이 문서는 **React 컴포넌트·훅·상태의 구조**만 다룬다. React 이외 프레임워크에는 적용하지 않는다 — Vue 는 \`vue.md\`, Svelte 는 \`svelte.md\` 를 쓴다.

여기서 다루지 않는 것 → 파일을 어느 레이어에 둘지는 \`fsd.md\`/\`atomic.md\`, 클래스명·토큰은 \`styling.md\`, 접근성 전체는 \`a11y.md\`, 렌더 성능 수치와 측정법은 \`performance.md\`, 전역 상태 라이브러리별 규칙은 \`zustand.md\` 등 상태 문서.

이 문서는 **어떤 상태 라이브러리를 쓸지 정하지 않는다.** 위 표는 상태의 *유형 분류*이고, 구체적 선택은 프로젝트가 채택한 상태 문서를 따른다.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **프레임워크 문서 vs 이 문서** — \`next.md\` 같은 프레임워크 문서가 이긴다. Next.js Server Component 에서는 이 문서의 훅 규칙이 애초에 적용되지 않는다.
- **상태 문서 vs 이 문서의 상태 표** — 상태 문서가 이긴다. 이 문서의 표는 분류이지 선택이 아니다.
- **\`a11y.md\` vs 이 문서의 접근성 최소선** — \`a11y.md\` 가 이긴다. 다만 최소선 4개는 어느 쪽에서도 면제되지 않는다.
- **\`performance.md\` vs "측정 후 최적화"** — 충돌하지 않는다. \`performance.md\` 가 측정 기준을 제공하고, 이 문서는 측정 없이 손대지 말라고 말한다.

## 자가 점검

컴포넌트를 제출하기 전 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] 클래스 컴포넌트를 새로 만들지 않았다
- [ ] Page 가 아닌 컴포넌트를 \`default export\` 하지 않았다
- [ ] 컴포넌트가 200줄 이하다 — 초과분은 자식 컴포넌트나 훅으로 뺐다
- [ ] 이 컴포넌트의 역할(UI / Container / Page)을 코드 작성 전에 정했고 파일명이 그걸 반영한다
- [ ] Presentational 컴포넌트가 API·전역 상태를 직접 읽지 않는다
- [ ] 컴포넌트·훅 본문에서 \`fetch\` 를 직접 호출하지 않았다
- [ ] 커스텀 훅이 \`use\` 로 시작하고 JSX 를 반환하지 않는다
- [ ] 접근성 최소선 4개(\`alt\`, label, \`<button>\`, \`aria-label\`)를 모두 통과한다
- [ ] 추가한 \`memo\`/\`useMemo\`/\`useCallback\` 마다 측정 근거가 주석으로 있다
`;
