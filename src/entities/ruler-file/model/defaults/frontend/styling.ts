export const frontendStyling = `---
title: 스타일링
stack: frontend
category: 스타일
extends: [base.md, frontend.md]
---

# Styling (Tailwind CSS)

> \`base.md\`, \`frontend.md\` 규칙을 상속한다. 스타일 규칙이다.

## 기본 원칙

- 스타일은 **Tailwind CSS로 통일**한다.
- 디자인 토큰(색·간격·폰트·border-radius)은 **CSS 변수**로 선언하고 \`tailwind.config.js\`에서 유틸리티로 매핑한다.
  - 근거: 토큰을 한 곳에 두면 다크모드/테마 전환은 변수 값 한 줄 교체로 끝. 컴포넌트마다 색을 직접 쓰면 다크모드 추가 시 모든 컴포넌트를 다시 손봐야 한다.
- **하드코딩 절대 금지** — 색상값, 간격값, 폰트 크기를 직접 입력하지 않는다.
  - 근거: \`text-[#333]\` 같은 임의 값은 디자인 토큰 시스템을 *그 한 군데만* 깨뜨림. PR 리뷰에서 발견 안 되면 토큰 외 색이 점점 늘어나 결국 *어느 색이 표준인지* 모르게 된다.

## 디자인 토큰

\`\`\`css
/* globals.css */
:root {
  --color-text-main: 15 23 42;
  --color-text-inverted: 248 250 252;
  --color-text-muted: 100 116 139;
  --color-bg-base: 248 250 252;
  --color-brand-primary: 14 165 233;
}
\`\`\`

\`\`\`js
// tailwind.config.js
colors: {
  text: {
    main: 'rgb(var(--color-text-main) / <alpha-value>)',
    inverted: 'rgb(var(--color-text-inverted) / <alpha-value>)',
    muted: 'rgb(var(--color-text-muted) / <alpha-value>)'
  },
  bg: { base: 'rgb(var(--color-bg-base) / <alpha-value>)' },
  brand: { primary: 'rgb(var(--color-brand-primary) / <alpha-value>)' }
}
\`\`\`

사용: \`text-text-main\`, \`text-text-inverted\`, \`text-text-muted\`, \`bg-bg-base\`, \`bg-brand-primary\`, \`text-brand-primary\`.

## 반응형 브레이크포인트

| prefix | min-width | 용도 |
|--------|-----------|------|
| \`sm\` | 640px | 모바일 가로 |
| \`md\` | 768px | 태블릿 |
| \`lg\` | 1024px | 데스크톱 |
| \`xl\` | 1280px | 와이드 |

- **모바일 우선** — 기본은 모바일, 큰 화면은 \`md:\`, \`lg:\`로 덮어쓴다.

## 다크 모드

- \`class\` 전략 사용 (\`<html class="dark">\`).
- 다크 모드 토큰은 \`:root\`와 \`.dark\`에 나란히 정의.

## 클래스 정리

- 긴 className은 \`clsx\` / \`cn\` 유틸로 분기.
- 컴포넌트 내 inline style 금지 (동적 값은 CSS 변수 할당).
  - 근거: inline style 은 다크모드 클래스 전환과 미디어 쿼리를 타지 않는다. 테마를 바꿔도 그 요소만 원래 색으로 남는다. 게다가 특이도가 가장 높아 나중에 클래스로 덮을 수도 없다.

## AI 행동 규칙

- 새 색·간격 값이 필요하면 **코드 작성 전에** \`tailwind.config.js\` 의 토큰 추가 PR 먼저.
- \`text-[#...]\` / \`bg-[#...]\` / \`w-[137px]\` 같은 임의 값 발견 시 즉시 토큰으로 교체. 정말 일회성이면 \`// reason: ...\` 주석으로 사유 명시.
- \`style={{...}}\` inline 스타일 발견 시 className 으로 이전. 동적 값이면 CSS 변수 + 클래스 조합.
- \`!important\` 는 기본적으로 쓰지 않는다. 필요해 보이면 먼저 특이도를 낮추거나 토큰을 고쳐서 해결한다. 그래도 남으면 유저에게 사유를 확인받은 뒤에만 쓰고 \`// reason:\` 을 남긴다.
  - 근거: \`!important\` 는 원인이 아니라 증상을 덮는다. 한 번 들어가면 그걸 덮으려고 다음 \`!important\` 가 붙어 특이도 경쟁이 시작된다.

## 패턴 (DO / DON'T)

### 색상 사용

\`\`\`tsx
// DON'T — 하드코딩된 색상
<div className="bg-[#0ea5e9] text-[#ffffff]">...</div>

// DO — 토큰 기반
<div className="bg-brand-primary text-text-inverted">...</div>
\`\`\`

### 동적 스타일

\`\`\`tsx
// DON'T — inline style (테마/다크모드 전파 안 됨)
<div style={{ color: isActive ? '#0ea5e9' : '#64748b' }} />

// DO — 조건부 클래스
<div className={cn(isActive ? 'text-brand-primary' : 'text-text-muted')} />
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| \`!important\` 남발 | 특이도 조정 또는 토큰 수정 |
| inline style (\`style={{...}}\`) | 클래스 또는 CSS 변수 |
| 임의 \`px\` 값 (\`w-[137px]\`) | 간격 토큰 (\`w-36\`) 또는 토큰 추가 |

## 적용 범위와 경계

이 문서는 **Tailwind CSS 기반 프로젝트의 토큰·클래스 규칙**만 다룬다. CSS-in-JS(styled-components, emotion)나 CSS Modules 프로젝트에는 적용하지 않는다 — 그 경우 이 문서를 룰셋에서 빼고 유저에게 대체 규칙을 요청한다.

여기서 다루지 않는 것 → 색 대비 수치와 포커스 표시는 \`a11y.md\`, 컴포넌트 구조는 \`frontend.md\`, 이미지·폰트 로딩 성능은 \`performance.md\`.

이 문서는 **어떤 색을 쓸지 정하지 않는다.** 팔레트 값은 프로젝트의 \`globals.css\` 가 단일 출처이고, 이 문서는 그 값을 어떻게 참조할지만 규정한다.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **토큰 사용 vs \`a11y.md\` 의 대비 4.5:1** — 접근성이 이긴다. 토큰 조합이 대비를 못 맞추면 그 조합을 쓰지 말고 토큰을 고치거나 새로 추가한다.
- **토큰 사용 vs 디자인 시안의 일회성 색** — 토큰이 이긴다. 시안에만 있는 색은 토큰으로 승격시킨 뒤 쓴다. 승격할 가치가 없다고 판단되면 유저에게 확인한다.
- **\`!important\` vs 특이도 조정** — 특이도 조정이 이긴다. 예외는 위 「AI 행동 규칙」의 절차를 밟은 경우뿐이다.

## 자가 점검

스타일을 추가·수정한 뒤 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] 새로 넣은 색·간격·폰트 크기가 전부 토큰이다 — \`text-[#...]\`, \`w-[137px]\` 같은 임의 값이 없다
- [ ] \`style={{...}}\` inline 스타일을 추가하지 않았다
- [ ] \`!important\` 를 추가하지 않았다 — 넣었다면 유저 확인과 \`// reason:\` 이 있다
- [ ] 새 토큰이 필요했다면 \`globals.css\` 와 \`tailwind.config.js\` 양쪽에 추가했다
- [ ] 다크 모드에서도 확인했다 — \`.dark\` 에 대응 토큰이 정의돼 있다
- [ ] 모바일 우선으로 작성했다 — 기본 클래스가 모바일이고 \`md:\`/\`lg:\` 로 덮는다
`;
