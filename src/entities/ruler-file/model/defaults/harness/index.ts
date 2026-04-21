import type { RulerFile } from '../../types';
import type { AiTool, Stack } from '@/shared/types';

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

interface BootstrapSpec {
  readonly fileName: string;
  readonly title: string;
  readonly description: string;
  readonly content: string;
}

const BOOTSTRAP_BY_TOOL: Readonly<Record<AiTool, BootstrapSpec>> = {
  'claude-code': {
    fileName: 'CLAUDE.md',
    title: 'Claude Code 자동 부트스트랩',
    description: 'Claude Code가 세션 시작 시 자동 로드. 프로젝트 루트에 배치',
    content: bootstrapClaudeCode,
  },
  cursor: {
    fileName: '.cursor/rules/harness.mdc',
    title: 'Cursor 자동 부트스트랩',
    description: 'Cursor Rules로 자동 주입. `alwaysApply: true` 설정 포함',
    content: bootstrapCursor,
  },
  copilot: {
    fileName: '.github/copilot-instructions.md',
    title: 'GitHub Copilot 자동 부트스트랩',
    description: '레포 전체 지침으로 자동 적용',
    content: bootstrapCopilot,
  },
  manual: {
    fileName: 'HARNESS-BOOTSTRAP.md',
    title: '수동 부트스트랩 안내',
    description: '자동 로드 미지원 툴용 — 매 세션 복붙할 프롬프트 + 경로 안내',
    content: bootstrapManual,
  },
};

interface HarnessEntry {
  readonly fileName: string;
  readonly title: string;
  readonly description: string;
  readonly content: string;
}

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
    fileName: 'harness/agents/05-qa.md',
    title: 'QA',
    description: '기능·엣지·회귀 블랙박스 검증',
    content: harnessQa,
  },
  {
    fileName: 'harness/agents/06-security-auditor.md',
    title: 'Security Auditor (보안 검토자)',
    description: 'OWASP·시크릿·인증/권한 전용 검토',
    content: harnessSecurityAuditor,
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

export const getHarnessFiles = (
  stack: Stack,
  aiTool: AiTool = 'claude-code',
): readonly RulerFile[] => {
  const bootstrap = BOOTSTRAP_BY_TOOL[aiTool];
  const bootstrapFile: RulerFile = {
    fileName: bootstrap.fileName,
    title: bootstrap.title,
    category: '하네스',
    description: bootstrap.description,
    stack,
    defaultSelected: true,
    content: bootstrap.content,
    isHarness: true,
  };
  const baseFiles: readonly RulerFile[] = HARNESS_ENTRIES.map((entry) => ({
    fileName: entry.fileName,
    title: entry.title,
    category: '하네스',
    description: entry.description,
    stack,
    defaultSelected: true,
    content: entry.content,
    isHarness: true,
  }));
  return [bootstrapFile, ...baseFiles];
};
