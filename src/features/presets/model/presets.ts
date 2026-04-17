import type { Stack } from '@/shared/types';

export type PresetId = 'minimal' | 'moderate' | 'strict';

export interface Preset {
  readonly id: PresetId;
  readonly label: string;
  readonly description: string;
  readonly frontendFiles: readonly string[];
  readonly backendFiles: readonly string[];
}

const PRESETS: readonly Preset[] = [
  {
    id: 'minimal',
    label: 'Minimal',
    description: '최소 필수 규칙만',
    frontendFiles: ['base.md', 'frontend.md'],
    backendFiles: ['base.md', 'backend.md'],
  },
  {
    id: 'moderate',
    label: 'Moderate',
    description: '일반적인 프로젝트 권장 세트 (기본값)',
    frontendFiles: ['base.md', 'frontend.md', 'git.md', 'security.md'],
    backendFiles: ['base.md', 'backend.md', 'api-design.md', 'git.md', 'security.md'],
  },
  {
    id: 'strict',
    label: 'Strict',
    description: '모든 규칙 포함 (아키텍처는 FSD 기본)',
    frontendFiles: [
      'base.md',
      'frontend.md',
      'fsd.md',
      'git.md',
      'security.md',
      'testing.md',
      'a11y.md',
      'styling.md',
      'performance.md',
    ],
    backendFiles: [
      'base.md',
      'backend.md',
      'api-design.md',
      'database.md',
      'auth.md',
      'security.md',
      'git.md',
      'testing.md',
      'logging.md',
      'error-handling.md',
      'caching.md',
    ],
  },
];

export const getPresetList = (): readonly Preset[] => PRESETS;

export const getPresetFiles = (preset: Preset, stack: Stack): readonly string[] =>
  stack === 'frontend' ? preset.frontendFiles : preset.backendFiles;
