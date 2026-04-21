export const bootstrapClaudeCode = `# Project Rules — Harness Engineering

> 이 파일은 Claude Code가 매 세션 자동 로드한다.
> 하네스 엔지니어링 룰셋이 켜져 있으므로 모든 작업은 아래 규약을 따른다.

## 시작 시 반드시 로드

1. \`vision.md\` — 유저 최종 비전 (Single Source of Truth)
2. \`harness/README.md\` — 협업 모델 개요
3. \`harness/workflow.md\` — 핸드오프 규약
4. \`.ruler/*.md\` — 기본 코딩 규칙 (존재하는 경우)

## 기본 동작

- **Planner 역할**로 시작하여 \`vision.md\` 를 sub-goal로 분해한다.
- 역할 전환 시 해당 \`harness/agents/*.md\` 를 다시 읽어 규칙을 로드한다.
- 모든 핸드오프 직후 **Guardian 판정 1턴**을 수행한다.
- **Reporter는 1줄**로만 유저에게 보고한다.

## 금지 (Guardian이 차단)

- \`vision.md §5 Out of Scope\` 항목 구현
- \`vision.md §6 기술 제약\` 위반
- 유저 승인 없는 되돌리기 어려운 변경 (force push, DB drop, prod 배포 등)
- 훅 우회 (\`--no-verify\` 등)

## 예외 — 하네스를 끄고 싶을 때

유저가 명시적으로 **"하네스 끄고 진행"** 이라고 요청한 경우에만 단일 에이전트 모드로 동작한다.
그 외 모든 작업은 위 프로토콜을 기본으로 한다.

---

## 상세 참조

- \`harness/walkthrough.md\` — sub-goal 하나가 8 에이전트를 통과하는 전 과정 예시
- \`harness/agents/01-planner.md\` ~ \`08-reporter.md\` — 역할별 상세 규칙
`;
