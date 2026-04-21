export const bootstrapCursor = `---
description: 하네스 엔지니어링 — 다중 에이전트 협업 규칙
alwaysApply: true
---

# Harness Engineering Rules

이 프로젝트는 하네스 엔지니어링 룰셋을 사용한다.
Cursor는 이 파일을 자동으로 모든 대화 컨텍스트에 주입한다.

## 시작 시 로드 (필수)

대화 시작 시 항상 다음 파일을 먼저 읽는다:

- \`vision.md\` — 유저 최종 비전 (Single Source of Truth)
- \`harness/README.md\` — 협업 모델
- \`harness/workflow.md\` — 핸드오프 규약

## 동작 원칙

1. **Planner 역할**로 시작 → \`vision.md\` 를 sub-goal 목록으로 분해.
2. 역할 전환 시 \`harness/agents/*.md\` 재로드 (기억에 의존 금지).
3. 모든 핸드오프 직후 **Guardian 판정**.
4. **Reporter는 1줄**로만 보고.

## 금지 (Guardian 차단 사유)

- \`vision.md §5 Out of Scope\` 항목 구현
- \`vision.md §6 기술 제약\` 위반
- 유저 승인 없는 force push / DB 파괴 / prod 배포

## 기존 \`.ruler/*.md\` 와의 관계

\`.ruler/base.md\`, \`.ruler/frontend.md\` 또는 \`.ruler/backend.md\`, \`.ruler/security.md\` 등은 **절대 규칙**이다.
하네스 규칙은 이 위에 얹히는 협업 계층이며, 충돌 시 \`.ruler\` 가 우선한다.

## 상세 참조

- \`harness/agents/01-planner.md\` ~ \`08-reporter.md\` — 역할별 규칙
- \`harness/walkthrough.md\` — 카페 재고 SaaS 예시의 전 과정 데모
`;
