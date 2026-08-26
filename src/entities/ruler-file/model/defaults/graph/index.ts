import type { RulerFile } from '../../types';
import type { Stack } from '@/shared/types';
import type { EngineeringEntry } from '../engineering/entry';
import { toEngineeringRuleFile } from '../engineering/entry';

import { graphReadme } from './readme';
import { graphNodes } from './nodes';
import { graphRouting } from './routing';

const GRAPH_ENTRIES: readonly EngineeringEntry[] = [
  {
    fileName: 'graph/README.md',
    title: '그래프 개요',
    description: '노드·엣지로 경로 설계, 그래프를 쓸 자리, mermaid 예시, 안티패턴 4가지',
    content: graphReadme,
  },
  {
    fileName: 'graph/nodes.md',
    title: '노드 · 엣지 정의',
    description: '노드 6필드, 노드 크기 기준, 엣지 3종, 병렬 조건, 사이클 축약',
    content: graphNodes,
  },
  {
    fileName: 'graph/routing.md',
    title: '라우팅 · 체크포인트',
    description: '라우팅 결정 순서, 체크포인트 포맷, 재개 프로토콜, 실패 3단 계단, 합류 처리',
    content: graphRouting,
  },
];

/** 그래프 엔지니어링 본문 파일들을 RulerFile로 반환한다. */
export const getGraphRuleFiles = (stack: Stack): readonly RulerFile[] =>
  GRAPH_ENTRIES.map((entry) => toEngineeringRuleFile(entry, '그래프', stack));

/** 툴 부트스트랩에 덧붙는 그래프 규약 요약(툴 무관 본문). */
export const GRAPH_BOOTSTRAP_SECTION = `## 그래프 엔지니어링 (경로와 상태)

노드 4개 이상으로 쪼개지는 작업은 그래프 규약을 따른다:

1. 시작 시 \`ruler/graph/nodes.md\` §1 포맷으로 노드를 정의하고 mermaid 그래프를 출력한다.
2. 노드 하나는 파일 1~3개 규모의, 단독 검증 가능한 최소 단위로 자른다.
3. 라우팅은 \`ruler/graph/routing.md\` §1 순서로만 결정한다 — 판정 없는 이동과 그래프 밖 노드로의 이동은 하지 않는다.
4. 노드가 끝날 때마다 \`[CHECKPOINT]\` 블록을 남긴다 (완료 노드 · 산출물 경로 · 결정 · 미해결).
5. 새 세션은 마지막 체크포인트부터 재개하고, 완료 노드를 재실행하지 않는다.
6. 노드 단위로 \`[NODE id]\` 1줄 보고한다.

실패는 재시도 → 우회 → 에스컬레이션 3단으로 올라가며, DAG 를 유지한다(되돌아오는 흐름은 노드 1개로 축약).`;

/** AGENTS.md 의 "협업 모델" 절에 들어가는 그래프 소개. */
export const GRAPH_AGENTS_SECTION = `### 그래프 — 경로와 상태

작업을 \`ruler/graph/nodes.md\` 의 6필드 노드로 쪼개고 mermaid 그래프를 먼저 출력한다.
라우팅·체크포인트·재개 규약은 \`ruler/graph/routing.md\` 에 있다 — 노드 종료마다 상태를 남겨야 재개가 가능하다.`;
