export const ENGINEERING_MODE_LIST = ['harness', 'loop'] as const;
export type EngineeringMode = (typeof ENGINEERING_MODE_LIST)[number];

export const isEngineeringMode = (value: string): value is EngineeringMode =>
  (ENGINEERING_MODE_LIST as readonly string[]).includes(value);

export const ENGINEERING_MODE_LABELS: Readonly<Record<EngineeringMode, string>> = {
  harness: '하네스 엔지니어링',
  loop: '루프 엔지니어링',
};

/** 랜딩 체크박스 옆 물음표에 노출되는 설명. 세 축이 서로 직교한다는 점을 명시한다. */
export const ENGINEERING_MODE_TOOLTIPS: Readonly<Record<EngineeringMode, string>> = {
  harness:
    '하네스 엔지니어링은 한 AI에게 8개 역할(Planner·Implementer·Reviewer 등)을 번갈아 맡겨 서로 검토하게 하는 협업 모델입니다. "누가 무엇을 판정하는가"를 정합니다. 포함하면 관련 규칙이 추가되어 AI 실행 시 토큰 소비량이 증가합니다.',
  loop:
    '루프 엔지니어링은 실행 → 관찰 → 자기비평 → 판정을 종료조건까지 반복하도록 만드는 규칙입니다. "언제 멈추고 언제 사람에게 넘기는가"를 정합니다. 미검증 완료 선언과 끝없는 재시도를 막습니다.',
};

/**
 * 입력 순서·중복과 무관하게 항상 ENGINEERING_MODE_LIST 순서로 정규화한다.
 * 이 순서가 localStorage 키·부트스트랩 섹션 순서의 기준이 되므로,
 * 유저가 체크한 순서에 따라 결과가 달라지지 않아야 한다.
 */
export const normalizeEngineeringModes = (
  values: readonly string[],
): readonly EngineeringMode[] => ENGINEERING_MODE_LIST.filter((mode) => values.includes(mode));
