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

/**
 * 각 AI 툴의 부트스트랩 파일 경로 — 툴 규약상 강제되는 위치(zip 루트 기준).
 * 하네스 포함 여부와 무관하게 동일 경로를 쓰고 내용만 달라진다.
 */
export const BOOTSTRAP_PATH_BY_TOOL: Readonly<Record<AiTool, string>> = {
  'claude-code': 'CLAUDE.md',
  cursor: '.cursor/rules/ruler.mdc',
  copilot: '.github/copilot-instructions.md',
  manual: 'RULER-BOOTSTRAP.md',
};

const HARNESS_BOOTSTRAP_BY_TOOL: Readonly<Record<AiTool, string>> = {
  'claude-code': bootstrapClaudeCode,
  cursor: bootstrapCursor,
  copilot: bootstrapCopilot,
  manual: bootstrapManual,
};

export interface BootstrapEntry {
  readonly fileName: string;
  readonly content: string;
}

/**
 * 선택한 AI 툴 + 하네스 여부에 맞는 부트스트랩 파일을 반환한다.
 * 이 파일은 zip 루트(툴 규약 경로)에 배치되며, `ruler/` 의 룰을 자동 로드하도록 연결한다.
 */
export const getBootstrapEntry = (
  aiTool: AiTool,
  includeHarness: boolean,
): BootstrapEntry => ({
  fileName: BOOTSTRAP_PATH_BY_TOOL[aiTool],
  content: includeHarness
    ? HARNESS_BOOTSTRAP_BY_TOOL[aiTool]
    : LITE_BOOTSTRAP_BY_TOOL[aiTool],
});

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
  const finderStep = bootstrapHidden
    ? `\`ruler/\` 와 \`${bootstrapPath}\`(숨김 — \`Cmd + Shift + .\` 로 표시) 를 프로젝트 루트로 복사.`
    : `\`ruler/\` 와 \`${bootstrapPath}\` 를 프로젝트 루트로 드래그.`;
  const content = `# 시작하기 — 이 폴더를 프로젝트에 적용하기

압축을 풀어 나온 내용을 **프로젝트 루트에 그대로 복사**하면 끝입니다.
별도로 폴더를 만들거나 설정 파일을 직접 작성할 필요가 없습니다 — 모두 포함되어 있습니다.
${harnessLine}
## 이 ZIP에 들어있는 것

\`\`\`
(압축 푼 폴더)/
├── ${bootstrapPath}          ← ${toolName} 가 자동 로드하는 진입점
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
