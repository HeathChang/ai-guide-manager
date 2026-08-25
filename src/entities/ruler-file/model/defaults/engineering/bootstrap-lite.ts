import type { AiTool } from '@/shared/types';

/**
 * 하네스 미포함 다운로드용 경량 부트스트랩.
 * 8역할 협업 모델 없이 "`ruler/` 의 모든 규칙을 읽고 준수하라"만 담아,
 * ZIP을 받자마자 AI가 룰을 자동 로드하도록 연결한다.
 * 경로는 모두 `ruler/` 기준 — buildZip이 룰을 `ruler/` 하위에 배치하는 단일 레이아웃과 일치.
 */

const liteClaudeCode = `# Project Rules

> 이 파일은 Claude Code가 매 세션 자동 로드한다.

이 프로젝트의 코딩 규칙은 \`ruler/\` 디렉토리에 정의되어 있다.
코드를 작성·수정·리뷰하기 전에 반드시 \`ruler/\` 의 모든 \`.md\` 파일을 읽고 준수한다.

## 동작 규칙

- 새 파일/함수 작성 직전: 관련 카테고리의 \`ruler/*.md\` 를 먼저 Read 한다.
- 규칙 간 충돌 시 더 구체적인 파일(framework/state 전용)이 \`ruler/base.md\` 보다 우선한다.
- 규칙 위반이 불가피하면 \`// reason: ...\` 주석으로 사유를 남긴다. 사유 없는 위반 금지.
- 불확실하면 추측하지 말고 질문한다.
`;

const liteCursor = `---
description: 프로젝트 코딩 규칙 — ruler/ 자동 로드
alwaysApply: true
---

# Project Rules

이 프로젝트의 코딩 규칙은 \`ruler/\` 디렉토리에 정의되어 있다.
Cursor는 이 파일을 모든 대화 컨텍스트에 자동 주입한다.

코드를 작성·수정·리뷰하기 전에 \`ruler/\` 의 모든 \`.md\` 파일을 읽고 준수한다.

- 규칙 간 충돌 시 더 구체적인 파일(framework/state 전용)이 \`ruler/base.md\` 보다 우선한다.
- 규칙 위반이 불가피하면 \`// reason: ...\` 주석으로 사유를 남긴다.
`;

const liteCopilot = `# Repository Coding Rules

> 이 파일은 GitHub Copilot이 레포 전체에 자동 적용한다.

이 프로젝트의 코딩 규칙은 \`ruler/\` 디렉토리에 정의되어 있다.
코드 제안 전에 \`ruler/\` 의 모든 \`.md\` 파일을 컨텍스트로 사용하고 준수한다.

- 규칙 간 충돌 시 더 구체적인 파일(framework/state 전용)이 \`ruler/base.md\` 보다 우선한다.
- 규칙 위반이 불가피하면 주석으로 사유를 남긴다.
`;

const liteManual = `# 코딩 규칙 적용 안내 (수동)

> 사용 중인 AI 툴이 자동 로드 파일을 지원하지 않거나 직접 설정하려는 경우.

이 프로젝트의 코딩 규칙은 \`ruler/\` 디렉토리에 있다.

## 1. 매 세션 복붙 (가장 간단)

새 세션 시작 시 AI 에이전트에게 다음을 전달한다:

\`\`\`
이 프로젝트의 코딩 규칙은 ruler/ 디렉토리에 있어.
코드를 작성·수정·리뷰하기 전에 ruler/ 의 모든 .md 파일을 먼저 읽고 준수해줘.
규칙 간 충돌 시 더 구체적인 파일(framework/state 전용)이 base.md 보다 우선해.
\`\`\`

## 2. 툴별 자동 로드 경로 (직접 설정할 경우)

| AI 툴 | 파일 경로 | 설명 |
|-------|-----------|------|
| Claude Code | \`CLAUDE.md\` (루트) | 세션 시작 시 자동 로드 |
| Cursor | \`.cursor/rules/ruler.mdc\` | Rules로 자동 주입 |
| GitHub Copilot | \`.github/copilot-instructions.md\` | 레포 전체 지침 |
| Windsurf | \`.windsurf/rules.md\` | 자동 로드 |
| 기타 | 툴 문서 확인 | 대개 시스템 프롬프트 주입 지점 존재 |

위 경로에 1번 프롬프트 내용을 저장해두면 매 세션 복붙이 필요 없다.

## 3. 검증

새 세션에서 "\`ruler/\` 의 어떤 파일을 읽었어?"라고 물어 실제 파일 목록을 답하면 성공.
`;

// agents-md 는 별도 파일(AGENTS.md)을 항상 동봉하므로 경량 부트스트랩 맵에서는 제외한다.
export const LITE_BOOTSTRAP_BY_TOOL: Readonly<Record<Exclude<AiTool, 'agents-md'>, string>> = {
  'claude-code': liteClaudeCode,
  cursor: liteCursor,
  copilot: liteCopilot,
  manual: liteManual,
};
