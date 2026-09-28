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
  - 근거: atom이 organism을 import 하면 atom 재사용성이 사라짐. 의존성 그래프가 그물망이 되면 변경 영향 추적 불가.
- 한 컴포넌트는 **하나의 단계**에만 속한다.
  - 근거: 한 컴포넌트가 두 단계에 걸치면 어느 룰을 적용할지 매번 결정해야 함 — 일관성 무너짐.

## 단계 정의

| 단계 | 역할 | 예시 |
|------|------|------|
| atoms | 분해 불가 최소 단위 | \`Button\`, \`Input\`, \`Icon\` |
| molecules | atoms 소수 조합 | \`SearchField\`, \`FormField\` |
| organisms | 여러 molecule/atom 조합 | \`Header\`, \`ProductCard\` |
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

- 새 컴포넌트 생성 시 **단계를 먼저 명시**한다 — 코드를 먼저 짜고 나중에 단계를 정하지 마라.
- atom은 **도메인 지식 없는 순수 UI**여야 한다 — atom에서 \`User\`, \`Post\` 같은 도메인 타입 import 발견 시 즉시 상위로 옮긴다.
- molecule이 atom 4개 이상을 조합하면 organism으로 즉시 승격.
  - 근거: molecule/organism 경계의 개수 임계값을 이 한 줄에만 둬 단일 출처를 유지함. 단계 정의 표는 정성 기준만 두어 두 곳에 흩어진 수치가 어긋나는 것을 막음.
- 라우팅(\`useNavigate\`, \`<Link>\`) 은 **page 외에서 사용 금지** — 발견 시 page로 옮긴다.
  - 근거: 라우팅을 아는 컴포넌트는 그 라우터 밖에서 재사용할 수 없다. 스토리북·테스트에서도 라우터를 통째로 감싸야 한다.

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

## 적용 범위와 경계

이 문서는 **컴포넌트가 어느 단계에 속하고 무엇을 조합할 수 있는가**만 다룬다. 단계 안에서 코드를 어떻게 쓰는지는 다루지 않는다.

여기서 다루지 않는 것 → 컴포넌트 내부 구조는 \`frontend.md\`, 클래스·토큰은 \`styling.md\`, 접근성은 \`a11y.md\`.

**\`fsd.md\` 와 동시에 사용하지 않는다.** 둘은 같은 질문(컴포넌트를 어디 둘 것인가)에 다른 답을 주는 경쟁 아키텍처다. 프로젝트당 하나만 선택한다. 두 문서가 모두 로드돼 있으면 진행하지 말고 유저에게 어느 쪽인지 묻는다.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **단계 규칙 vs 코드 중복 제거** — 단계 규칙이 이긴다. 중복을 없애려고 atom 이 organism 을 import 하게 만들지 마라. 공통 로직은 hook 으로 빼거나 상위 단계로 올린다.
- **"atom 4개 이상이면 organism 승격" vs 의미상 molecule** — 개수 기준이 이긴다. 예외를 두려면 \`// reason:\` 주석으로 근거를 남긴다.
  - 근거: 정성 기준만 있으면 승격 시점이 사람마다 달라져 경계가 무너진다. 숫자 기준은 논쟁 없이 판정된다.
- **디자인 시스템 컴포넌트 vs 이 문서** — 외부 디자인 시스템에서 가져온 컴포넌트는 그쪽 분류를 따르고 재분류하지 않는다.

## 자가 점검

컴포넌트를 추가하거나 옮긴 뒤 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] 새 컴포넌트의 단계를 코드 작성 **전에** 정했고 디렉토리가 그걸 반영한다
- [ ] 한 컴포넌트가 두 단계에 걸쳐 있지 않다
- [ ] import 방향이 \`pages → templates → organisms → molecules → atoms\` 를 따른다
- [ ] atom 에 도메인 타입(\`User\`, \`Post\`) import 나 API 호출·전역 상태 접근이 없다
- [ ] atom 4개 이상을 조합한 molecule 이 없다 — 있으면 organism 으로 올렸다
- [ ] \`useNavigate\` / \`<Link>\` 가 page 밖에 없다
- [ ] template 에 실제 데이터가 하드코딩돼 있지 않다
`;
