export const bootstrapManual = `---
title: 수동 부트스트랩 안내
category: 하네스
---

# 하네스 엔지니어링 수동 부트스트랩

> 사용 중인 AI 툴이 자동 로드 파일을 지원하지 않거나, 직접 설정하고 싶은 경우.

## 1. 매 세션마다 복붙 (가장 간단)

AI 에이전트에게 새 세션 시작 시 이 프롬프트를 전달한다:

\`\`\`
이 프로젝트는 하네스 엔지니어링 룰셋을 사용해.
다음 순서로 작동해줘:

1. /vision.md 와 /harness/README.md 를 먼저 읽어.
2. /harness/workflow.md 의 핸드오프 규약을 따라.
3. Planner 역할로 시작해서 sub-goal 목록을 만들어.
4. 역할 전환 시 해당 /harness/agents/*.md 파일을 다시 읽어.
5. 모든 핸드오프마다 Guardian 판정 1턴, Reporter는 1줄 보고.
\`\`\`

## 2. 툴별 자동 로드 경로 (직접 설정할 경우)

| AI 툴 | 파일 경로 | 설명 |
|-------|-----------|------|
| Claude Code | \`CLAUDE.md\` (프로젝트 루트) | 세션 시작 시 자동 로드 |
| Cursor | \`.cursor/rules/harness.mdc\` | Rules 기능으로 자동 주입 |
| GitHub Copilot | \`.github/copilot-instructions.md\` | 레포 전체 지침으로 자동 적용 |
| Windsurf | \`.windsurf/rules.md\` | 자동 로드 |
| Aider | \`.aider.conf.yml\`의 \`read:\` | 수동 지정 필요 |
| 기타 | 툴 문서 확인 | 대개 시스템 프롬프트 주입 지점 존재 |

위 경로에 1번의 프롬프트 내용을 저장해두면 매 세션 복붙이 필요 없다.

## 3. 경로 주의

이 파일의 프롬프트는 ZIP을 **프로젝트 루트에 풀었다는 전제**로 작성되어 있다.
만약 \`.ruler/\` 하위로 옮긴다면 경로를 \`/.ruler/harness/...\` 로 수정한다.

## 4. 검증 — 자동 로드가 잘 되었는지 확인

1. 새 세션 시작.
2. 아무 요청 없이 AI에게 "지금 어떤 역할이야?" 라고 질문.
3. AI가 \`[Planner]\` 또는 \`"vision.md 를 읽고 Planner로 시작하겠다"\` 식으로 답하면 성공.
4. \`"어떤 규칙을 로드했어?"\` 로 2차 확인.

자동 로드가 안 되면 1번 프롬프트를 매번 복붙한다.
`;
