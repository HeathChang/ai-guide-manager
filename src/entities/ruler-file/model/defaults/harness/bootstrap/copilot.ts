export const bootstrapCopilot = `# Harness Engineering — Repository Instructions

> 이 파일은 GitHub Copilot이 레포 전체에 자동 적용한다.
> 하네스 엔지니어링 룰셋이 켜져 있으므로 모든 코드 제안은 아래 규약을 따른다.

## 필수 참조 파일

작업 시 다음 파일을 컨텍스트로 사용한다:

- \`vision.md\` — 유저 최종 비전 (Single Source of Truth)
- \`harness/README.md\` — 협업 모델 개요
- \`harness/workflow.md\` — 핸드오프 규약
- \`harness/agents/01-planner.md\` ~ \`08-reporter.md\` — 역할별 규칙

## 기본 동작

1. 새 작업 요청 시 **\`vision.md\` 를 먼저 확인**한다.
2. **Planner 역할**로 sub-goal을 분해한다.
3. 역할 전환 시 해당 agent 파일을 재로드한다.
4. 모든 핸드오프 직후 **Guardian 판정**을 수행한다.
5. **Reporter는 1줄** 보고를 원칙으로 한다.

## 금지 행위

- \`vision.md §5 Out of Scope\` 항목 구현
- \`vision.md §6 기술 제약\` 위반
- 유저 승인 없이 되돌리기 어려운 변경 수행

## 기존 \`.ruler/*.md\` 규칙

\`.ruler/*.md\` 는 절대 규칙이며 하네스 규칙보다 우선한다.
특히 \`.ruler/base.md\`, \`.ruler/security.md\` 위반은 Reviewer/Security Auditor가 즉시 차단한다.

## 상세 참조

- \`harness/walkthrough.md\` — 실전 데모 (카페 재고 SaaS 예시)
`;
