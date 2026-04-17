export const frontendStyling = `# Styling (Tailwind CSS)

> \`base.md\`, \`frontend.md\` 규칙을 상속한다. 스타일 규칙이다.

## 기본 원칙

- 스타일은 **Tailwind CSS로 통일**한다.
- 디자인 토큰(색·간격·폰트·border-radius)은 **CSS 변수**로 선언하고 \`tailwind.config.js\`에서 유틸리티로 매핑한다.
- **하드코딩 절대 금지** — 색상값, 간격값, 폰트 크기를 직접 입력하지 않는다.

## 디자인 토큰

\`\`\`css
/* globals.css */
:root {
  --color-text-main: 15 23 42;
  --color-bg-base: 248 250 252;
}
\`\`\`

\`\`\`js
// tailwind.config.js
colors: {
  text: { main: 'rgb(var(--color-text-main) / <alpha-value>)' }
}
\`\`\`

사용: \`text-text-main\`, \`bg-bg-base\`.

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

## AI 행동 규칙

- 새 색·간격 등장 시 먼저 토큰을 정의한다.
- 임의의 \`text-[#333]\` 같은 one-off 값은 금지 — 토큰 추가 후 사용.

## 금지 패턴

- inline style (\`style={{ color: '#fff' }}\`)
- 하드코딩된 색상 (\`bg-[#0ea5e9]\`)
- \`!important\` 남발
`;
