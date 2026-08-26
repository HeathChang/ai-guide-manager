import type { RulerFile } from '../../types';
import type { AiTool, Stack } from '@/shared/types';
import type { EngineeringEntry } from '../engineering/entry';
import { toEngineeringRuleFile } from '../engineering/entry';

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

/** 자체 설정 파일을 내보내는 툴(agents-md 제외 — 그건 AGENTS.md 자체가 진입점). */
export type ConfigTool = Exclude<AiTool, 'agents-md'>;

/**
 * 하네스를 켰을 때 툴 부트스트랩의 **본문**이 되는 텍스트.
 * 루프·그래프는 여기에 섹션으로 덧붙는다(engineering/index.ts 참조) —
 * 하네스가 8역할 협업이라는 가장 큰 골격을 세우므로 본문 자리를 차지한다.
 */
export const HARNESS_BOOTSTRAP_BY_TOOL: Readonly<Record<ConfigTool, string>> = {
  'claude-code': bootstrapClaudeCode,
  cursor: bootstrapCursor,
  copilot: bootstrapCopilot,
  manual: bootstrapManual,
};

/** AGENTS.md 의 "협업 모델" 절에 들어가는 하네스 소개. */
export const HARNESS_AGENTS_SECTION = `### 하네스 — 8역할 협업 모델

\`ruler/harness/README.md\` · \`ruler/harness/workflow.md\` 의 규약대로 작동한다:
Planner → Researcher → Implementer → Reviewer → Security Auditor → QA → Guardian → Reporter.
역할 전환 시 해당 \`ruler/harness/agents/*.md\` 를 다시 읽는다. 모든 핸드오프 직후 Guardian 판정 1턴.`;

/**
 * 하네스 협업 본문(harness/*). 부트스트랩과 분리되어 있으며,
 * 하네스 옵션을 켰을 때만 다운로드에 포함된다. fileName은 논리 경로이고
 * 실제 zip 배치는 `ruler/` 하위로 prefix 된다.
 * 에이전트 파일 번호는 실제 핸드오프 순서와 일치한다:
 * Planner→Researcher→Implementer→Reviewer→Security Auditor→QA→Guardian→Reporter.
 */
const HARNESS_ENTRIES: readonly EngineeringEntry[] = [
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

/** 하네스 협업 본문 파일들을 RulerFile로 반환한다(부트스트랩·vision 제외). */
export const getHarnessRuleFiles = (stack: Stack): readonly RulerFile[] =>
  HARNESS_ENTRIES.map((entry) => toEngineeringRuleFile(entry, '하네스', stack));

/**
 * vision.md — 협업 모델 공통 문서. 하네스·루프·그래프 중 하나라도 켜지면 동봉된다.
 * 하네스는 Guardian 판정 근거로, 루프는 GOAL·DONE-WHEN 의 출처로,
 * 그래프는 sub-goal 분해의 출처로 같은 문서를 참조한다.
 */
export const getVisionRuleFile = (stack: Stack): RulerFile => ({
  fileName: 'vision.md',
  title: 'Vision (유저 작성 템플릿)',
  category: '협업 모델',
  description: '유저가 작성할 최종 비전. 모든 에이전트·노드·루프의 단일 진실의 원천',
  stack,
  defaultSelected: true,
  content: harnessVisionTemplate,
  isEngineeringDoc: true,
});
