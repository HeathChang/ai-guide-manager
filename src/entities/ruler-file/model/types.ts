import type { Stack, StateManager } from '@/shared/types';

export type ArchitectureKind = 'fsd' | 'atomic';

export type FileCategory =
  | '공통'
  | '아키텍처'
  | '설계'
  | '데이터'
  | '인증/인가'
  | '보안'
  | '품질'
  | '접근성'
  | '스타일'
  | '성능'
  | '운영'
  | '안정성'
  | '워크플로우'
  | '하네스'
  | '프레임워크'
  | '상태 관리'
  | '사용자 정의';

export interface RulerFile {
  readonly fileName: string;
  readonly title: string;
  readonly category: FileCategory;
  readonly description: string;
  readonly stack: Stack;
  readonly defaultSelected: boolean;
  readonly content: string;
  readonly architectureKind?: ArchitectureKind;
  readonly stateManagerKind?: StateManager;
  readonly isCustom?: boolean;
  readonly isHarness?: boolean;
  /**
   * 경로 스코핑 glob 패턴. 비어 있으면 "항상 적용"(base/security 등).
   * 지정 시 해당 파일 유형에서만 룰이 활성화된다 — Cursor globs / Copilot applyTo /
   * AGENTS.md 스코프 표로 변환된다. 예: a11y 는 tsx·jsx·vue·svelte 파일에만 적용.
   */
  readonly globs?: readonly string[];
}
