import type { RulerFile } from '../../types';
import type { Stack } from '@/shared/types';
import type { EngineeringEntry } from '../engineering/entry';
import { toEngineeringRuleFile } from '../engineering/entry';

import { loopReadme } from './readme';
import { loopContract } from './contract';
import { loopCritic } from './critic';

const LOOP_ENTRIES: readonly EngineeringEntry[] = [
  {
    fileName: 'loop/README.md',
    title: '루프 개요',
    description: 'Act → Observe → Critique → Decide 4단계, 루프를 쓸 자리, 안티패턴 4가지',
    content: loopReadme,
  },
  {
    fileName: 'loop/contract.md',
    title: '루프 계약',
    description: '시작 선언 포맷, 종료조건 4종, 반복 상한 기본값, 진동 감지, 에스컬레이션',
    content: loopContract,
  },
  {
    fileName: 'loop/critic.md',
    title: '자기비평 루브릭',
    description: '루브릭 6항목, PASS · REVISE · ESCALATE 판정, REVISE 지시 포맷',
    content: loopCritic,
  },
];

/** 루프 엔지니어링 본문 파일들을 RulerFile로 반환한다. */
export const getLoopRuleFiles = (stack: Stack): readonly RulerFile[] =>
  LOOP_ENTRIES.map((entry) => toEngineeringRuleFile(entry, '루프', stack));

/**
 * 툴 부트스트랩에 덧붙는 루프 규약 요약.
 * 툴과 무관한 본문이므로 4개 툴이 같은 섹션을 공유한다 —
 * 부트스트랩 파일의 경로·프론트매터만 툴별로 다르다.
 */
export const LOOP_BOOTSTRAP_SECTION = `## 루프 엔지니어링 (반복과 종료조건)

검증 커맨드로 성공을 판정할 수 있는 작업은 루프 규약을 따른다:

1. 시작 전 \`ruler/loop/contract.md\` §1 포맷으로 **루프 계약**을 선언한다 (GOAL · DONE-WHEN · VERIFY · MAX · ON-FAIL).
2. 한 반복은 Act → Observe → Critique → Decide 4단계를 모두 거친다.
3. Observe 는 실제 실행한 커맨드 출력만 근거로 쓴다 — 실행하지 않은 채 완료를 선언하지 않는다.
4. Critique 는 \`ruler/loop/critic.md\` 의 루브릭 6항목으로 자기 결과를 검토한다.
5. 판정은 PASS · REVISE · ESCALATE 중 하나이며 근거 1줄을 붙인다.
6. 반복마다 \`[LOOP n/N]\` 1줄로 보고한다.

진동(같은 줄 2회 원복) · 상한 도달 · 결정 필요 시에는 반복을 멈추고 \`[ESCALATE]\` 블록으로 유저에게 넘긴다.`;

/** AGENTS.md 의 "협업 모델" 절에 들어가는 루프 소개. */
export const LOOP_AGENTS_SECTION = `### 루프 — 반복과 종료조건

\`ruler/loop/contract.md\` 의 계약을 먼저 선언한 뒤 Act → Observe → Critique → Decide 를 반복한다.
종료는 PASS · NO-PROGRESS · LIMIT · BLOCKED 넷 중 하나이며, 판정 루브릭은 \`ruler/loop/critic.md\` 에 있다.`;
