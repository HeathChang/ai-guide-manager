import type { RulerFile } from '../../types';
import type { AiTool, BackendFramework, FrontendFramework, Stack } from '@/shared/types';

import { harnessReadme } from './readme';
import { harnessWorkflow } from './workflow';
import { harnessWalkthrough } from './walkthrough';
import { harnessVisionTemplate } from './vision-template';
import { harnessPlanner } from './planner';
import { harnessResearcher } from './researcher';
import { harnessImplementer } from './implementer';
import { harnessReviewer } from './reviewer';
import { harnessQa } from './qa';
import { harnessSecurityAuditor } from './security-auditor';
import { harnessGuardian } from './guardian';
import { harnessReporter } from './reporter';
import { bootstrapClaudeCode } from './bootstrap/claude-code';
import { bootstrapCursor } from './bootstrap/cursor';
import { bootstrapCopilot } from './bootstrap/copilot';
import { bootstrapManual } from './bootstrap/manual';
import { LITE_BOOTSTRAP_BY_TOOL } from './bootstrap/lite';

/** 자체 설정 파일을 내보내는 툴(agents-md 제외 — 그건 AGENTS.md 자체가 진입점). */
type ConfigTool = Exclude<AiTool, 'agents-md'>;

/**
 * 각 AI 툴의 부트스트랩 파일 경로 — 툴 규약상 강제되는 위치(zip 루트 기준).
 * 하네스 포함 여부와 무관하게 동일 경로를 쓰고 내용만 달라진다.
 */
export const BOOTSTRAP_PATH_BY_TOOL: Readonly<Record<AiTool, string>> = {
  'claude-code': 'CLAUDE.md',
  cursor: '.cursor/rules/ruler.mdc',
  copilot: '.github/copilot-instructions.md',
  'agents-md': 'AGENTS.md',
  manual: 'RULER-BOOTSTRAP.md',
};

const HARNESS_BOOTSTRAP_BY_TOOL: Readonly<Record<ConfigTool, string>> = {
  'claude-code': bootstrapClaudeCode,
  cursor: bootstrapCursor,
  copilot: bootstrapCopilot,
  manual: bootstrapManual,
};

export interface BootstrapEntry {
  readonly fileName: string;
  readonly content: string;
}

/** AGENTS.md/스코핑 출력에 필요한, 선택된 룰의 최소 정보. */
export interface ScopedRule {
  readonly fileName: string;
  readonly title: string;
  readonly globs?: readonly string[];
  readonly isHarness?: boolean;
}

/**
 * 선택한 AI 툴 + 하네스 여부에 맞는 부트스트랩 파일을 반환한다.
 * 이 파일은 zip 루트(툴 규약 경로)에 배치되며, `ruler/` 의 룰을 자동 로드하도록 연결한다.
 * (agents-md 는 AGENTS.md 자체가 진입점이라 여기서 다루지 않는다 — getRootEntries 참조.)
 */
export const getBootstrapEntry = (
  aiTool: ConfigTool,
  includeHarness: boolean,
): BootstrapEntry => ({
  fileName: BOOTSTRAP_PATH_BY_TOOL[aiTool],
  content: includeHarness
    ? HARNESS_BOOTSTRAP_BY_TOOL[aiTool]
    : LITE_BOOTSTRAP_BY_TOOL[aiTool],
});

// 디렉토리 구분자를 '-' 로 치환한 충돌 없는 슬러그(예: 'state/zustand.md' → 'state-zustand').
// 단순 베이스명만 쓰면 다른 디렉토리의 동명 룰이 같은 출력 파일을 덮어쓸 수 있다.
const ruleSlug = (fileName: string): string =>
  fileName.replace(/\.md$/, '').replace(/\//g, '-');

const scopeNote = (globs: readonly string[] | undefined): string =>
  globs && globs.length > 0 ? globs.join(', ') : '항상';

/**
 * AGENTS.md — 2026 범용 에이전트 지침 표준(Codex/Cursor/Copilot/Gemini CLI/Aider/Windsurf/Zed 등이
 * 네이티브로 읽음). 선택한 AI 툴과 무관하게 항상 동봉되어 단일 진입점을 보장한다.
 */
const buildAgentsMd = (
  includeHarness: boolean,
  rules: readonly ScopedRule[],
): BootstrapEntry => {
  const ruleRows = rules
    // 하네스 협업 본문(vision/harness/*)만 표에서 제외 — 동명 커스텀 파일은 그대로 표기.
    .filter((r) => !(r.isHarness === true && (r.fileName.startsWith('harness/') || r.fileName === 'vision.md')))
    .map((r) => `| \`ruler/${r.fileName}\` | ${r.title} | ${scopeNote(r.globs)} |`)
    .join('\n');
  const harnessSection = includeHarness
    ? `\n## 협업 모델 (하네스 엔지니어링)

이 룰셋은 8역할 협업 모델을 포함한다. \`ruler/vision.md\` 를 먼저 채운 뒤,
\`ruler/harness/README.md\` · \`ruler/harness/workflow.md\` 의 규약대로 작동한다:
Planner → Researcher → Implementer → Reviewer → Security Auditor → QA → Guardian → Reporter.
역할 전환 시 해당 \`ruler/harness/agents/*.md\` 를 다시 읽는다.
`
    : '';
  const content = `# AGENTS.md

> 이 프로젝트의 코딩 에이전트 지침이다. AGENTS.md 를 지원하는 모든 도구
> (Codex · Cursor · Copilot · Gemini CLI · Aider · Windsurf · Zed 등)가 자동으로 읽는다.

## 규칙

코드를 작성·수정·리뷰하기 전에 \`ruler/\` 의 규칙을 읽고 준수한다.
규칙 간 충돌 시 더 구체적인 파일(framework/state 전용)이 \`ruler/base.md\` 보다 우선한다.
규칙 위반이 불가피하면 \`// reason: ...\` 주석으로 사유를 남긴다.

## 규칙 파일 (적용 범위)

| 파일 | 내용 | 적용 경로 |
|------|------|-----------|
${ruleRows || '| `ruler/*.md` | (선택된 규칙) | 항상 |'}

> "적용 경로"가 \`항상\` 이 아닌 규칙은 해당 glob 파일을 작업할 때만 적용한다.
${harnessSection}
## 빌드 · 테스트 (프로젝트에 맞게 채우기)

\`\`\`bash
# 예) 설치 / 빌드 / 테스트 / 린트 명령을 여기에 적는다
\`\`\`

## 완료 기준

- 변경 후 타입체크·린트·테스트가 통과해야 한다(가정하지 말고 실제 실행해 확인).
- \`ruler/\` 규칙을 위반하지 않는다.
`;
  return { fileName: 'AGENTS.md', content };
};

/**
 * Cursor: 경로 스코핑된 규칙마다 `.cursor/rules/<name>.mdc` 를 생성(globs + alwaysApply:false).
 * 항상 적용 규칙은 베이스 `.cursor/rules/ruler.mdc`(getBootstrapEntry)가 담당한다.
 */
const getCursorScopedEntries = (rules: readonly ScopedRule[]): BootstrapEntry[] =>
  rules
    .filter((r) => r.globs && r.globs.length > 0)
    .map((r) => {
      const name = ruleSlug(r.fileName);
      const globsYaml = `[${(r.globs ?? []).map((g) => `"${g}"`).join(', ')}]`;
      const content = `---
description: ${r.title} (ruler/${r.fileName})
globs: ${globsYaml}
alwaysApply: false
---

이 파일 유형을 편집할 때는 \`ruler/${r.fileName}\` 의 규칙을 따른다.
`;
      return { fileName: `.cursor/rules/${name}.mdc`, content };
    });

/**
 * Copilot: 경로 스코핑된 규칙마다 `.github/instructions/<name>.instructions.md` 를 생성(applyTo).
 * 전역 규칙은 `.github/copilot-instructions.md`(getBootstrapEntry)가 담당한다.
 */
const getCopilotScopedEntries = (rules: readonly ScopedRule[]): BootstrapEntry[] =>
  rules
    .filter((r) => r.globs && r.globs.length > 0)
    .map((r) => {
      const name = ruleSlug(r.fileName);
      const applyTo = (r.globs ?? []).join(',');
      const content = `---
applyTo: "${applyTo}"
---

이 파일 유형에서는 \`ruler/${r.fileName}\` 의 규칙을 따른다.
`;
      return { fileName: `.github/instructions/${name}.instructions.md`, content };
    });

export interface RootEntriesParams {
  readonly aiTool: AiTool;
  readonly includeHarness: boolean;
  readonly rules: readonly ScopedRule[];
}

/**
 * zip 루트에 배치되는 모든 부트스트랩/설정 엔트리를 반환한다.
 * - AGENTS.md: 선택 툴과 무관하게 항상 동봉(범용 표준 단일 진입점)
 * - 선택 툴의 설정 파일(CLAUDE.md / .cursor/rules/ruler.mdc / .github/copilot-instructions.md / RULER-BOOTSTRAP.md)
 * - Cursor/Copilot: 경로 스코핑 규칙별 추가 파일(.mdc / .instructions.md)
 */
export const getRootEntries = ({
  aiTool,
  includeHarness,
  rules,
}: RootEntriesParams): BootstrapEntry[] => {
  const entries: BootstrapEntry[] = [buildAgentsMd(includeHarness, rules)];
  if (aiTool !== 'agents-md') {
    entries.push(getBootstrapEntry(aiTool, includeHarness));
  }
  if (aiTool === 'cursor') entries.push(...getCursorScopedEntries(rules));
  if (aiTool === 'copilot') entries.push(...getCopilotScopedEntries(rules));
  return entries;
};

interface HarnessEntry {
  readonly fileName: string;
  readonly title: string;
  readonly description: string;
  readonly content: string;
}

/**
 * 하네스 협업 본문(vision + harness/*). 부트스트랩과 분리되어 있으며,
 * 하네스 옵션을 켰을 때만 다운로드에 포함된다. fileName은 논리 경로이고
 * 실제 zip 배치는 `ruler/` 하위로 prefix 된다.
 * 에이전트 파일 번호는 실제 핸드오프 순서와 일치한다:
 * Planner→Researcher→Implementer→Reviewer→Security Auditor→QA→Guardian→Reporter.
 */
const HARNESS_ENTRIES: readonly HarnessEntry[] = [
  {
    fileName: 'vision.md',
    title: 'Vision (유저 작성 템플릿)',
    description: '유저가 작성할 최종 비전. 모든 에이전트의 단일 진실의 원천',
    content: harnessVisionTemplate,
  },
  {
    fileName: 'harness/README.md',
    title: '하네스 개요',
    description: '다중 에이전트 협업 모델 개요 · 전체 흐름도 · 빠른 시작',
    content: harnessReadme,
  },
  {
    fileName: 'harness/workflow.md',
    title: '핸드오프 규약',
    description: '에이전트 간 핸드오프 매트릭스, Guardian 개입 규칙, 블로커 프로토콜, 사후 이슈 복구',
    content: harnessWorkflow,
  },
  {
    fileName: 'harness/walkthrough.md',
    title: '전 사이클 데모 워크스루',
    description: 'sub-goal 하나가 8 에이전트를 통과하는 전 과정 예시 (카페 재고 SaaS)',
    content: harnessWalkthrough,
  },
  {
    fileName: 'harness/agents/01-planner.md',
    title: 'Planner (기획자)',
    description: 'vision.md를 sub-goal 목록으로 분해',
    content: harnessPlanner,
  },
  {
    fileName: 'harness/agents/02-researcher.md',
    title: 'Researcher (리서처)',
    description: '기존 코드·라이브러리·제약 조사, 사실만 보고',
    content: harnessResearcher,
  },
  {
    fileName: 'harness/agents/03-implementer.md',
    title: 'Implementer (코드 작성자)',
    description: 'sub-goal 1개를 diff로 구현, 범위 준수',
    content: harnessImplementer,
  },
  {
    fileName: 'harness/agents/04-reviewer.md',
    title: 'Reviewer (리뷰어)',
    description: '코드 품질 검토 (구조·네이밍·DRY)',
    content: harnessReviewer,
  },
  {
    fileName: 'harness/agents/05-security-auditor.md',
    title: 'Security Auditor (보안 검토자)',
    description: 'OWASP·시크릿·인증/권한 전용 검토',
    content: harnessSecurityAuditor,
  },
  {
    fileName: 'harness/agents/06-qa.md',
    title: 'QA',
    description: '기능·엣지·회귀 블랙박스 검증',
    content: harnessQa,
  },
  {
    fileName: 'harness/agents/07-guardian.md',
    title: 'Guardian (감시자)',
    description: '모든 핸드오프에서 vision.md 정합성 판정',
    content: harnessGuardian,
  },
  {
    fileName: 'harness/agents/08-reporter.md',
    title: 'Reporter (비서)',
    description: '유저 대상 1줄 실시간 보고',
    content: harnessReporter,
  },
];

/**
 * 하네스 협업 본문 파일들을 RulerFile로 반환한다(부트스트랩 제외).
 */
export const getHarnessRuleFiles = (stack: Stack): readonly RulerFile[] =>
  HARNESS_ENTRIES.map((entry) => ({
    fileName: entry.fileName,
    title: entry.title,
    category: '하네스',
    description: entry.description,
    stack,
    defaultSelected: true,
    content: entry.content,
    isHarness: true,
  }));

const FRAMEWORK_EXAMPLE: Readonly<Record<string, string>> = {
  react: 'frontend.md',
  next: 'next.md',
  vue: 'vue.md',
  nuxt: 'nuxt.md',
  svelte: 'svelte.md',
  sveltekit: 'sveltekit.md',
  solid: 'solid.md',
  vanilla: 'vanilla.md',
  'node-express': 'node-express.md',
  'node-nestjs': 'nestjs.md',
  'node-fastify': 'fastify.md',
  'spring-boot': 'spring-boot.md',
  django: 'django.md',
  rails: 'rails.md',
  'go-gin': 'go-gin.md',
};

const AI_TOOL_NAME: Readonly<Record<AiTool, string>> = {
  'claude-code': 'Claude Code',
  cursor: 'Cursor',
  copilot: 'GitHub Copilot',
  'agents-md': 'AGENTS.md (범용 표준)',
  manual: '직접 설정 / 기타 도구',
};

/**
 * zip 루트에 동봉되는 설치 안내 파일(START-HERE.md). 압축을 푼 유저가
 * "이 폴더로 뭘 해야 하지?"에서 막히지 않도록 최소 액션을 명시한다.
 */
export const getStartHereEntry = (
  aiTool: AiTool,
  includeHarness: boolean,
  framework?: FrontendFramework | BackendFramework,
  ruleFileNames: readonly string[] = [],
): BootstrapEntry => {
  const bootstrapPath = BOOTSTRAP_PATH_BY_TOOL[aiTool];
  const exampleRule = (framework && FRAMEWORK_EXAMPLE[framework]) ?? 'base.md';
  const toolName = AI_TOOL_NAME[aiTool];
  const ruleCount = ruleFileNames.length;
  // ruler/ 자체는 보이는 폴더다. 부트스트랩이 .cursor/ · .github/ 같은
  // 툴 전용(숨김) 디렉토리에 들어가는 경우에만 숨김 주의가 필요하다.
  const bootstrapHidden = bootstrapPath.startsWith('.');
  const manifest =
    ruleCount > 0
      ? ruleFileNames.map((name) => `    ├── ${name}`).join('\n')
      : `    ├── base.md\n    ├── ${exampleRule}\n    └── ...`;
  const harnessLine = includeHarness
    ? '\n이 룰셋에는 **하네스 엔지니어링(8역할 협업 모델)** 이 포함되어 있다 — `ruler/vision.md` 를 먼저 채운 뒤 시작한다.\n'
    : '';
  const hiddenNote = bootstrapHidden
    ? `\n> ⚠️ \`${bootstrapPath}\` 는 \`.\` 로 시작하는 폴더라 macOS Finder가 **숨깁니다**(${toolName} 규약상 위치). 아래 터미널 방법을 쓰거나, Finder에서 \`Cmd + Shift + .\` 로 숨김 항목을 표시한 뒤 복사하세요.\n`
    : '';
  // AGENTS.md 는 선택 툴과 무관하게 항상 동봉되는 범용 진입점.
  const bootstrapTreeLine =
    aiTool === 'agents-md' ? '' : `\n├── ${bootstrapPath}          ← ${toolName} 전용 진입점`;
  const finderStep = bootstrapHidden
    ? `보이는 항목(\`AGENTS.md\`, \`ruler/\`, \`START-HERE.md\`)과 숨김 부트스트랩 \`${bootstrapPath}\`(\`Cmd + Shift + .\` 로 표시)를 프로젝트 루트로 복사.`
    : `보이는 항목(\`AGENTS.md\`, \`ruler/\`, \`${bootstrapPath}\` 등)을 프로젝트 루트로 드래그.`;
  const content = `# 시작하기 — 이 폴더를 프로젝트에 적용하기

압축을 풀어 나온 내용을 **프로젝트 루트에 그대로 복사**하면 끝입니다.
별도로 폴더를 만들거나 설정 파일을 직접 작성할 필요가 없습니다 — 모두 포함되어 있습니다.
${harnessLine}
## 이 ZIP에 들어있는 것

\`\`\`
(압축 푼 폴더)/
├── AGENTS.md              ← 범용 표준 진입점 (AGENTS.md 지원 도구 전부)${bootstrapTreeLine}
├── START-HERE.md          ← 이 안내
└── ruler/                 ← 규칙 본문 ${ruleCount > 0 ? `${ruleCount}개 ` : ''}(AI가 읽는 실제 룰)
${manifest}
\`\`\`
${hiddenNote}
## 프로젝트에 넣기

폴더 내용 전체를 프로젝트 루트로 복사합니다.

### 방법 A. 터미널 (가장 확실)

압축 푼 폴더 안에서 실행 (끝의 \`/.\` 가 숨김 항목까지 빠짐없이 복사):

\`\`\`bash
cp -R . /내/프로젝트/경로/
\`\`\`

### 방법 B. Finder / 탐색기

${finderStep}

## 적용 확인 — 끝내지 말고 검증

AI 도구에 아래를 그대로 물어본다:

\`\`\`
ruler/ 디렉토리의 어떤 파일을 자동으로 읽었는지 알려줘. 읽지 않은 파일이 있다면 이유는?
\`\`\`

AI가 실제 파일 목록을 답하면 연동 성공. 일반론으로 답하면 \`${bootstrapPath}\` 가
프로젝트 루트에 있는지, 도구가 그 파일을 자동 로드하도록 설정됐는지 재확인한다.

## Git 공유

\`ruler/\` 와 \`${bootstrapPath}\` 는 팀이 공유하도록 커밋한다.
규칙은 한 곳(\`ruler/\`)에만 두고, 루트 부트스트랩 파일이 그걸 가리키므로 중복이 없다.
`;
  return { fileName: 'START-HERE.md', content };
};
