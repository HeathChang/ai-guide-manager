export const frontendA11y = `---
title: 접근성
stack: frontend
category: 접근성
extends: [base.md, frontend.md]
---

# Accessibility (a11y)

> \`base.md\`, \`frontend.md\`를 상속한다. WCAG 2.1 AA 수준 준수를 목표로 한다.

## 기본 원칙

- 모든 상호작용 요소는 **키보드로 조작 가능**해야 한다.
- 시각적 정보는 **대체 텍스트**로 동등하게 제공한다.
- 색상 대비는 **4.5:1 이상** (본문 텍스트 기준).

## 시맨틱 마크업

- 역할에 맞는 HTML 태그를 사용한다 (\`header\`, \`main\`, \`nav\`, \`button\`, \`a\`).
  - 근거: 시맨틱 태그는 스크린 리더가 *지역으로 점프*하는 단축키(랜드마크)를 제공. div로만 짠 페이지는 점프 불가 = 전체 순차 탐색 강제.
- \`div + onClick\`으로 버튼을 만들지 않는다.
  - 근거: div는 Tab 포커스 불가, Enter/Space 키 처리 없음, 스크린 리더가 "button" 으로 안 읽음 — 키보드/스크린 리더 사용자 완전 배제.
- 제목 레벨(\`h1~h6\`)은 **건너뛰지 않는다**.
  - 근거: 스크린 리더는 제목 레벨로 *문서 아웃라인*을 구성. \`h1 → h3\` 같은 비약은 "h2 빠뜨림"으로 인식되어 구조 파악 혼란.

## 필수 속성

| 요소 | 필수 |
|------|------|
| \`<img>\` | \`alt\` (장식용은 \`alt=""\`) |
| \`<input>\` | \`<label>\` 또는 \`aria-label\` |
| 아이콘 버튼 | \`aria-label\` |
| 모달 | \`role="dialog"\`, \`aria-modal="true"\`, 포커스 트랩 |
| 동적 알림 | \`aria-live\` |

## 키보드 내비게이션

- Tab 순서는 시각적 순서와 일치.
- 포커스 링을 숨기지 않는다 (\`outline: none\` 후 대체 스타일 필수).
- 모달 열림 시 포커스 이동, 닫힐 때 복원.

## AI 행동 규칙

- 새 \`<div onClick={...}>\` 발견 시 즉시 \`<button type="button">\` 으로 교체.
- \`<img>\` 생성 시 \`alt\` 속성 누락 금지 — 장식이면 \`alt=""\` 명시 (속성 자체를 빼지 마라, 스크린 리더가 src를 읽음).
- 아이콘만 들어있는 버튼 (\`<button><Icon/></button>\`) 발견 시 \`aria-label\` 추가 강제.
- ARIA는 *마지막 수단* — 시맨틱 태그(\`button\`, \`nav\`, \`a\`) 가 같은 역할을 표현 가능하면 ARIA 사용 금지.
  - 근거: 잘못 쓴 ARIA는 무 ARIA보다 나쁘다(\`role="button"\` 인 div 등 = 거짓 신호). 시맨틱 태그가 옳은 ARIA를 *암묵적으로* 부여한다.

## 패턴 (DO / DON'T)

### 아이콘 버튼

\`\`\`tsx
// DON'T — 스크린 리더가 "button"만 읽음
<button onClick={remove}><TrashIcon /></button>

// DO
<button onClick={remove} aria-label="항목 삭제"><TrashIcon /></button>
\`\`\`

### 포커스 스타일

\`\`\`css
/* DON'T — 키보드 사용자가 현재 위치를 잃음 */
button { outline: none; }

/* DO — 기본 outline 제거 시 대체 스타일 제공 */
button { outline: none; }
button:focus-visible { outline: 2px solid var(--color-focus); }
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| \`tabindex="-1"\` 오남용 | 비상호작용 요소에서 제거 |
| 색상만으로 상태 전달 | 색상 + 아이콘 + 텍스트 |
| \`<div onClick>\` | \`<button>\` / \`<a>\` |
`;
