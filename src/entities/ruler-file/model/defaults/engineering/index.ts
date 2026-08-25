import type { RulerFile } from '../../types';
import type {
  AiTool,
  BackendFramework,
  EngineeringMode,
  FrontendFramework,
  Stack,
} from '@/shared/types';
import { ENGINEERING_MODE_LABELS, normalizeEngineeringModes } from '@/shared/types';

import type { ConfigTool } from '../harness';
import {
  HARNESS_AGENTS_SECTION,
  HARNESS_BOOTSTRAP_BY_TOOL,
  getHarnessRuleFiles,
  getVisionRuleFile,
} from '../harness';
import {
  LOOP_AGENTS_SECTION,
  LOOP_BOOTSTRAP_SECTION,
  getLoopRuleFiles,
} from '../loop';
import { LITE_BOOTSTRAP_BY_TOOL } from './bootstrap-lite';

export type { ConfigTool };

/**
 * 각 AI 툴의 부트스트랩 파일 경로 — 툴 규약상 강제되는 위치(zip 루트 기준).
 * 협업 모델 포함 여부와 무관하게 동일 경로를 쓰고 내용만 달라진다.
 */
export const BOOTSTRAP_PATH_BY_TOOL: Readonly<Record<AiTool, string>> = {
  'claude-code': 'CLAUDE.md',
  cursor: '.cursor/rules/ruler.mdc',
  copilot: '.github/copilot-instructions.md',
  'agents-md': 'AGENTS.md',
  manual: 'RULER-BOOTSTRAP.md',
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
  /** 협업 모델 본문(vision · harness/* · loop/*)이면 true. */
  readonly isEngineeringDoc?: boolean;
}

const RULE_FILES_BY_MODE: Readonly<Record<EngineeringMode, (stack: Stack) => readonly RulerFile[]>> =
  {
    harness: getHarnessRuleFiles,
    loop: getLoopRuleFiles,
  };

/**
 * 켜진 협업 모델의 본문 파일들을 반환한다. 하나 이상 켜져 있으면
 * 공통 문서인 `vision.md` 를 맨 앞에 한 번만 붙인다.
 * 순서는 체크 순서가 아니라 ENGINEERING_MODE_LIST 순서로 정규화된다.
 */
export const getEngineeringRuleFiles = (
  stack: Stack,
  modes: readonly EngineeringMode[],
): readonly RulerFile[] => {
  const ordered = normalizeEngineeringModes(modes);
  if (ordered.length === 0) return [];
  return [
    getVisionRuleFile(stack),
    ...ordered.flatMap((mode) => RULE_FILES_BY_MODE[mode](stack)),
  ];
};

/**
 * 부트스트랩 본문에 덧붙는 모드별 섹션.
 * 하네스는 섹션이 아니라 본문 전체를 차지하므로(HARNESS_BOOTSTRAP_BY_TOOL) 여기에 없다.
 */
const BOOTSTRAP_SECTION_BY_MODE: Readonly<Partial<Record<EngineeringMode, string>>> = {
  loop: LOOP_BOOTSTRAP_SECTION,
};

const AGENTS_SECTION_BY_MODE: Readonly<Record<EngineeringMode, string>> = {
  harness: HARNESS_AGENTS_SECTION,
  loop: LOOP_AGENTS_SECTION,
};

/**
 * 선택한 AI 툴 + 켜진 협업 모델에 맞는 부트스트랩 파일을 반환한다.
 * 이 파일은 zip 루트(툴 규약 경로)에 배치되며, `ruler/` 의 룰을 자동 로드하도록 연결한다.
 *
 * - 모드 없음: 경량 본문("`ruler/` 의 규칙을 읽고 준수하라")
 * - 하네스 포함: 툴별 하네스 본문 + 나머지 모드 섹션
 * - 하네스 없이 루프만: 경량 본문 + 루프 섹션
 *
 * (agents-md 는 AGENTS.md 자체가 진입점이라 여기서 다루지 않는다 — getRootEntries 참조.)
 */
export const getBootstrapEntry = (
  aiTool: ConfigTool,
  modes: readonly EngineeringMode[],
): BootstrapEntry => {
  const ordered = normalizeEngineeringModes(modes);
  const base = ordered.includes('harness')
    ? HARNESS_BOOTSTRAP_BY_TOOL[aiTool]
    : LITE_BOOTSTRAP_BY_TOOL[aiTool];
  const sections = ordered
    .map((mode) => BOOTSTRAP_SECTION_BY_MODE[mode])
    .filter((section): section is string => section !== undefined);
  const content =
    sections.length === 0 ? base : [base.trimEnd(), ...sections].join('\n\n---\n\n') + '\n';
  return { fileName: BOOTSTRAP_PATH_BY_TOOL[aiTool], content };
};

// 디렉토리 구분자를 '-' 로 치환한 충돌 없는 슬러그(예: 'state/zustand.md' → 'state-zustand').
// 단순 베이스명만 쓰면 다른 디렉토리의 동명 룰이 같은 출력 파일을 덮어쓸 수 있다.
const ruleSlug = (fileName: string): string =>
  fileName.replace(/\.md$/, '').replace(/\//g, '-');

const scopeNote = (globs: readonly string[] | undefined): string =>
  globs && globs.length > 0 ? globs.join(', ') : '항상';

const buildModesSection = (modes: readonly EngineeringMode[]): string => {
  if (modes.length === 0) return '';
  const labels = modes.map((mode) => ENGINEERING_MODE_LABELS[mode]).join(' · ');
  const bodies = modes.map((mode) => AGENTS_SECTION_BY_MODE[mode]).join('\n\n');
  return `\n## 협업 모델 (${labels})

이 룰셋은 아래 실행 골격을 포함한다. \`ruler/vision.md\` 를 먼저 채운 뒤 시작한다.

${bodies}
`;
};

/**
 * AGENTS.md — 2026 범용 에이전트 지침 표준(Codex/Cursor/Copilot/Gemini CLI/Aider/Windsurf/Zed 등이
 * 네이티브로 읽음). 선택한 AI 툴과 무관하게 항상 동봉되어 단일 진입점을 보장한다.
 */
const buildAgentsMd = (
  modes: readonly EngineeringMode[],
  rules: readonly ScopedRule[],
): BootstrapEntry => {
  const ruleRows = rules
    // 협업 모델 본문(vision/harness/loop)만 표에서 제외 — 아래 "협업 모델" 절이 담당한다.
    // 동명 커스텀 파일은 이 플래그가 없으므로 그대로 표기된다.
    .filter((rule) => rule.isEngineeringDoc !== true)
    .map((rule) => `| \`ruler/${rule.fileName}\` | ${rule.title} | ${scopeNote(rule.globs)} |`)
    .join('\n');
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
${buildModesSection(modes)}
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
    .filter((rule) => rule.globs && rule.globs.length > 0)
    .map((rule) => {
      const name = ruleSlug(rule.fileName);
      const globsYaml = `[${(rule.globs ?? []).map((glob) => `"${glob}"`).join(', ')}]`;
      const content = `---
description: ${rule.title} (ruler/${rule.fileName})
globs: ${globsYaml}
alwaysApply: false
---

이 파일 유형을 편집할 때는 \`ruler/${rule.fileName}\` 의 규칙을 따른다.
`;
      return { fileName: `.cursor/rules/${name}.mdc`, content };
    });

/**
 * Copilot: 경로 스코핑된 규칙마다 `.github/instructions/<name>.instructions.md` 를 생성(applyTo).
 * 전역 규칙은 `.github/copilot-instructions.md`(getBootstrapEntry)가 담당한다.
 */
const getCopilotScopedEntries = (rules: readonly ScopedRule[]): BootstrapEntry[] =>
  rules
    .filter((rule) => rule.globs && rule.globs.length > 0)
    .map((rule) => {
      const name = ruleSlug(rule.fileName);
      const applyTo = (rule.globs ?? []).join(',');
      const content = `---
applyTo: "${applyTo}"
---

이 파일 유형에서는 \`ruler/${rule.fileName}\` 의 규칙을 따른다.
`;
      return { fileName: `.github/instructions/${name}.instructions.md`, content };
    });

export interface RootEntriesParams {
  readonly aiTool: AiTool;
  readonly modes: readonly EngineeringMode[];
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
  modes,
  rules,
}: RootEntriesParams): BootstrapEntry[] => {
  const ordered = normalizeEngineeringModes(modes);
  const entries: BootstrapEntry[] = [buildAgentsMd(ordered, rules)];
  if (aiTool !== 'agents-md') {
    entries.push(getBootstrapEntry(aiTool, ordered));
  }
  if (aiTool === 'cursor') entries.push(...getCursorScopedEntries(rules));
  if (aiTool === 'copilot') entries.push(...getCopilotScopedEntries(rules));
  return entries;
};

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
  modes: readonly EngineeringMode[],
  framework?: FrontendFramework | BackendFramework,
  ruleFileNames: readonly string[] = [],
): BootstrapEntry => {
  const ordered = normalizeEngineeringModes(modes);
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
  const modesLine =
    ordered.length > 0
      ? `\n이 룰셋에는 **${ordered
          .map((mode) => ENGINEERING_MODE_LABELS[mode])
          .join(' · ')}**이 포함되어 있다 — \`ruler/vision.md\` 를 먼저 채운 뒤 시작한다.\n`
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
${modesLine}
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
