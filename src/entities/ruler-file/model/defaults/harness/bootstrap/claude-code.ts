export const bootstrapClaudeCode = `# Project Rules — Harness Engineering

> 이 파일은 Claude Code가 매 세션 자동 로드한다.
> 하네스 엔지니어링 룰셋이 켜져 있으므로 모든 작업은 아래 규약을 따른다.

## 시작 시 반드시 로드

1. \`ruler/vision.md\` — 유저 최종 비전 (Single Source of Truth)
2. \`ruler/harness/README.md\` — 협업 모델 개요
3. \`ruler/harness/workflow.md\` — 핸드오프 규약
4. \`ruler/*.md\` — 기본 코딩 규칙 (base, framework, security 등 나머지 .md)

## 기본 동작

- **Planner 역할**로 시작하여 \`ruler/vision.md\` 를 sub-goal로 분해한다.
- 역할 전환 시 해당 \`ruler/harness/agents/*.md\` 를 다시 읽어 규칙을 로드한다.
- 모든 핸드오프 직후 **Guardian 판정 1턴**을 수행한다.
- **Reporter는 1줄**로만 유저에게 보고한다.

## 금지 (Guardian이 차단)

- \`ruler/vision.md §5 Out of Scope\` 항목 구현
- \`ruler/vision.md §6 기술 제약\` 위반
- 유저 승인 없는 되돌리기 어려운 변경 (force push, DB drop, prod 배포 등)
- 훅 우회 (\`--no-verify\` 등)

## 예외 — 하네스를 끄고 싶을 때

유저가 명시적으로 **"하네스 끄고 진행"** 이라고 요청한 경우에만 단일 에이전트 모드로 동작한다.
그 외 모든 작업은 위 프로토콜을 기본으로 한다.

---

## 상세 참조

- \`ruler/harness/walkthrough.md\` — sub-goal 하나가 8 에이전트를 통과하는 전 과정 예시
- \`ruler/harness/agents/01-planner.md\` ~ \`08-reporter.md\` — 역할별 상세 규칙

## 충돌 시 우선순위

규칙이 어긋나면 **위에서부터 이긴다.**

1. **유저의 명시적 지시** — 이번 대화에서 직접 말한 것
2. **\`ruler/vision.md\`** — §5 Out of Scope 와 §6 기술 제약은 어떤 이유로도 완화되지 않는다
3. **\`ruler/*.md\` 코딩 규칙** — \`base.md\`, \`security.md\` 등. 하네스보다 우선한다
4. **하네스 협업 규약** — 이 파일과 \`ruler/harness/*\`

하네스는 코딩 규칙 위에 얹히는 협업 계층이다. 충돌하면 코딩 규칙이 이긴다.
판단이 갈리면 진행하지 말고 유저에게 묻는다.

## 파일을 찾지 못했을 때

위 파일 중 하나라도 없으면 **추측으로 대체하지 않는다.**
없는 파일을 Reporter 형식 1줄로 보고하고, \`ruler/vision.md\` 가 없으면 Guardian 판정 기준이 없으므로 작성을 요청한다.

## 부트스트랩 검증

새 세션을 시작한 직후, 아무 작업을 시키기 전에 확인한다.

- [ ] "지금 어떤 역할이야?" 라고 물으면 \`[Planner]\` 로 답한다
- [ ] "어떤 파일을 읽었어?" 라고 물으면 실제 읽은 파일 목록을 답한다 — 일반론이 아니다
- [ ] "vision.md 의 Out of Scope 를 인용해줘" 라고 하면 본문을 그대로 인용한다
- [ ] 첫 작업 요청에 Reporter 1줄 보고가 나온다

하나라도 실패하면 이 파일이 로드되지 않은 것이다. 파일 위치가 프로젝트 루트의 \`CLAUDE.md\` 인지 확인한다.

### 첫 응답 (DO / DON'T)

\`\`\`
# DON'T — 룰셋을 못 읽었는데 아는 척한다
네, 로그인 기능을 만들어 드리겠습니다. 먼저 컴포넌트부터 작성할게요.

# DO — 근거 파일을 밝히고 Planner 로 시작한다
[Planner] ruler/vision.md §4 에서 sub-goal 3개 도출 · Researcher 질의 1건 진행
\`\`\`
`;
