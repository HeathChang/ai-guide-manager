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
}
