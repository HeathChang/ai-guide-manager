export const bootstrapCopilot = `# Harness Engineering — Repository Instructions

> 이 파일은 GitHub Copilot이 레포 전체에 자동 적용한다.
> 하네스 엔지니어링 룰셋이 켜져 있으므로 모든 코드 제안은 아래 규약을 따른다.

## 필수 참조 파일

작업 시 다음 파일을 컨텍스트로 사용한다:

- \`ruler/vision.md\` — 유저 최종 비전 (Single Source of Truth)
- \`ruler/harness/README.md\` — 협업 모델 개요
- \`ruler/harness/workflow.md\` — 핸드오프 규약
- \`ruler/harness/agents/01-planner.md\` ~ \`08-reporter.md\` — 역할별 규칙

## 기본 동작

1. 새 작업 요청 시 **\`ruler/vision.md\` 를 먼저 확인**한다.
2. **Planner 역할**로 sub-goal을 분해한다.
3. 역할 전환 시 해당 agent 파일을 재로드한다.
4. 모든 핸드오프 직후 **Guardian 판정**을 수행한다.
5. **Reporter는 1줄** 보고를 원칙으로 한다.

## 금지 행위

- \`ruler/vision.md §5 Out of Scope\` 항목 구현
- \`ruler/vision.md §6 기술 제약\` 위반
- 유저 승인 없이 되돌리기 어려운 변경 수행

## 기존 \`ruler/*.md\` 규칙

\`ruler/*.md\` 는 절대 규칙이며 하네스 규칙보다 우선한다.
특히 \`ruler/base.md\`, \`ruler/security.md\` 위반은 Reviewer/Security Auditor가 즉시 차단한다.

## 상세 참조

- \`ruler/harness/walkthrough.md\` — 실전 데모 (카페 재고 SaaS 예시)

## 충돌 시 우선순위

규칙이 어긋나면 **위에서부터 이긴다.**

1. **유저의 명시적 지시**
2. **\`ruler/vision.md\`** — §5 Out of Scope 와 §6 기술 제약은 어떤 이유로도 완화되지 않는다
3. **\`ruler/*.md\` 코딩 규칙** — 하네스보다 우선한다
4. **하네스 협업 규약** — 이 파일과 \`ruler/harness/*\`

판단이 갈리면 진행하지 말고 유저에게 묻는다.

## 파일을 찾지 못했을 때

위 파일 중 하나라도 없으면 **추측으로 대체하지 않는다.**
없는 파일을 1줄로 보고하고, \`ruler/vision.md\` 가 없으면 Guardian 판정 기준이 없으므로 작성을 요청한다.

## 부트스트랩 검증

새 세션에서 작업을 시키기 전에 확인한다.

- [ ] "어떤 규칙 파일을 참조하고 있어?" 에 실제 파일 목록으로 답한다
- [ ] "vision.md 의 Out of Scope 를 인용해줘" 에 본문을 그대로 인용한다
- [ ] 첫 작업 요청에 Planner 역할로 sub-goal 분해가 나온다

하나라도 실패하면 이 파일이 \`.github/copilot-instructions.md\` 에 있는지 확인한다.

### 첫 응답 (DO / DON'T)

\`\`\`
# DON'T — 룰셋을 못 읽었는데 바로 코드를 제안한다
아래처럼 구현하시면 됩니다. (일반적인 베스트 프랙티스 코드)

# DO — 근거 파일을 밝히고 Planner 로 시작한다
[Planner] ruler/vision.md §4 기준 sub-goal 3개 · 첫 항목부터 진행
\`\`\`
`;
