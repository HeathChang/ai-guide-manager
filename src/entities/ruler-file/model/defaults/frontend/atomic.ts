export const frontendAtomic = `---
title: Atomic Design
stack: frontend
category: 아키텍처
extends: [base.md, frontend.md]
---

# Atomic Design

> \`base.md\`, \`frontend.md\` 규칙을 상속한다. Atomic Design 아키텍처 규칙이다.

## 기본 원칙

- UI를 5단계 계층 (\`atoms → molecules → organisms → templates → pages\`)으로 분리한다.
- 하위 레벨은 상위 레벨을 **모른다** (의존성 역전 금지).
- 한 컴포넌트는 **하나의 단계**에만 속한다.

## 단계 정의

| 단계 | 역할 | 예시 |
|------|------|------|
| atoms | 분해 불가 최소 단위 | \`Button\`, \`Input\`, \`Icon\` |
| molecules | atoms 2~3개 조합 | \`SearchField\`, \`FormField\` |
| organisms | molecules/atoms 조합 | \`Header\`, \`ProductCard\` |
| templates | 레이아웃 골격 (데이터 없음) | \`DashboardLayout\` |
| pages | 실제 데이터 주입된 완성 화면 | \`DashboardPage\` |

## 의존성 방향

\`\`\`
pages → templates → organisms → molecules → atoms
\`\`\`

하위 단계가 상위 단계를 참조하지 않는다.

## 네이밍 / 위치

\`\`\`
src/
  components/
    atoms/
    molecules/
    organisms/
    templates/
  pages/
\`\`\`

## AI 행동 규칙

- 새 컴포넌트 생성 시 단계를 먼저 결정한다.
- atom은 **도메인 지식 없는 순수 UI**여야 한다.
- molecule이 2~3개 이상의 atom을 조합하면 organism으로 승격 검토.

## 패턴 (DO / DON'T)

### atom의 책임

\`\`\`tsx
// DON'T — atom이 API 호출
// atoms/SubmitButton.tsx
function SubmitButton() {
  const mutation = useMutation(createOrder);
  return <button onClick={() => mutation.mutate()}>주문</button>;
}

// DO — atom은 순수 UI, 상위(organism/page)가 상태/API 소유
// atoms/Button.tsx
function Button({ onClick, children }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| atom에서 전역 상태 / API 호출 | 상위 단계에서 props로 주입 |
| organism 간 직접 참조 | 공통 로직은 custom hook으로 추출 |
| page 외 컴포넌트에서 라우팅 | page에서 \`useNavigate\` 소유 |
`;
