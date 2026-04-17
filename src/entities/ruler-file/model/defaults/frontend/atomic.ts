export const frontendAtomic = `# Atomic Design

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

## 금지 패턴

- atom에서 전역 상태 / API 호출
- organism 간 직접 참조 (공유 로직은 custom hook으로 추출)
- page 외 컴포넌트에서 라우팅 처리
`;
