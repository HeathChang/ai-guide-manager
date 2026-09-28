export const bootstrapCursor = `---
description: 하네스 엔지니어링 — 다중 에이전트 협업 규칙
alwaysApply: true
---

# Harness Engineering Rules

이 프로젝트는 하네스 엔지니어링 룰셋을 사용한다.
Cursor는 이 파일을 자동으로 모든 대화 컨텍스트에 주입한다.

## 시작 시 로드 (필수)

대화 시작 시 항상 다음 파일을 먼저 읽는다:

- \`ruler/vision.md\` — 유저 최종 비전 (Single Source of Truth)
- \`ruler/harness/README.md\` — 협업 모델
- \`ruler/harness/workflow.md\` — 핸드오프 규약

## 동작 원칙

1. **Planner 역할**로 시작 → \`ruler/vision.md\` 를 sub-goal 목록으로 분해.
2. 역할 전환 시 \`ruler/harness/agents/*.md\` 재로드 (기억에 의존 금지).
3. 모든 핸드오프 직후 **Guardian 판정**.
4. **Reporter는 1줄**로만 보고.

## 금지 (Guardian 차단 사유)

- \`ruler/vision.md §5 Out of Scope\` 항목 구현
- \`ruler/vision.md §6 기술 제약\` 위반
- 유저 승인 없는 force push / DB 파괴 / prod 배포

## 충돌 시 우선순위

규칙이 어긋나면 **위에서부터 이긴다.**

1. **유저의 명시적 지시** — 이번 대화에서 직접 말한 것
2. **\`ruler/vision.md\`** — §5 Out of Scope 와 §6 기술 제약은 어떤 이유로도 완화되지 않는다
3. **\`ruler/*.md\` 코딩 규칙** — \`base.md\`, \`frontend.md\`/\`backend.md\`, \`security.md\` 등 절대 규칙이다
4. **하네스 협업 규약** — 이 파일과 \`ruler/harness/*\`

하네스는 코딩 규칙 위에 얹히는 협업 계층이다. 충돌하면 코딩 규칙이 이긴다.
판단이 갈리면 진행하지 말고 유저에게 묻는다.

## 상세 참조

- \`ruler/harness/agents/01-planner.md\` ~ \`08-reporter.md\` — 역할별 규칙
- \`ruler/harness/walkthrough.md\` — 카페 재고 SaaS 예시의 전 과정 데모

## 파일을 찾지 못했을 때

위 파일 중 하나라도 없으면 **추측으로 대체하지 않는다.**
없는 파일을 1줄로 보고하고, \`ruler/vision.md\` 가 없으면 Guardian 판정 기준이 없으므로 작성을 요청한다.

## 적용 범위와 경계

이 파일은 **Cursor 가 하네스 규약을 로드하도록 연결하는 진입점**일 뿐이다. 역할별 상세 규칙은 담지 않는다.

여기서 다루지 않는 것 → 역할별 규칙은 \`ruler/harness/agents/*.md\`, 핸드오프 절차는 \`ruler/harness/workflow.md\`, 코딩 규칙은 \`ruler/base.md\` 와 스택별 문서.

이 파일이 로드되었다고 해서 상세 문서까지 읽힌 것은 아니다. 역할을 맡을 때마다 해당 파일을 실제로 읽는다.

## 부트스트랩 검증

새 세션에서 작업을 시키기 전에 확인한다.

- [ ] "지금 어떤 역할이야?" 에 \`[Planner]\` 로 답한다
- [ ] "어떤 파일을 읽었어?" 에 실제 읽은 파일 목록을 답한다 — 일반론이 아니다
- [ ] "vision.md 의 Out of Scope 를 인용해줘" 에 본문을 그대로 인용한다
- [ ] 첫 작업 요청에 Reporter 1줄 보고가 나온다

하나라도 실패하면 이 파일이 \`.cursor/rules/\` 아래에 있고 \`alwaysApply: true\` 인지 확인한다.

### 첫 응답 (DO / DON'T)

\`\`\`
# DON'T — 룰셋을 못 읽었는데 바로 구현에 들어간다
네, 바로 작업하겠습니다. 우선 컴포넌트를 만들겠습니다.

# DO — 근거 파일을 밝히고 Planner 로 시작한다
[Planner] ruler/vision.md §4 에서 sub-goal 3개 도출 · Researcher 질의 1건 진행
\`\`\`
`;
