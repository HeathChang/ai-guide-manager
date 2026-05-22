import type {
  BackendFramework,
  FrontendFramework,
  Stack,
} from '@/shared/types';
import { isBackendFramework, isFrontendFramework } from '@/shared/types';
import {
  getBackendFrameworkEntryFiles,
  getFrameworkEntryFiles,
} from '@/entities/ruler-file';

export type PresetId = 'minimal' | 'moderate' | 'strict';

export interface Preset {
  readonly id: PresetId;
  readonly label: string;
  readonly description: string;
  /**
   * Frontend 프리셋 정의. 'frontend.md' 는 *가상 토큰* — 실제 framework에 맞춰
   * `getFrameworkEntryFiles(framework)` 의 결과로 치환된다. (예: vue → ['vue.md'])
   */
  readonly frontendFiles: readonly string[];
  /**
   * Backend 프리셋 정의. 'backend.md' 외에 framework entry는 `getBackendFrameworkEntryFiles`
   * 결과로 별도 추가된다.
   */
  readonly backendFiles: readonly string[];
}

const FRAMEWORK_ENTRY_PLACEHOLDER = 'frontend.md';

const PRESETS: readonly Preset[] = [
  {
    id: 'minimal',
    label: 'Minimal',
    description: '최소 필수 규칙만',
    frontendFiles: ['base.md', FRAMEWORK_ENTRY_PLACEHOLDER],
    backendFiles: ['base.md', 'backend.md'],
  },
  {
    id: 'moderate',
    label: 'Moderate',
    description: '일반적인 프로젝트 권장 세트 (기본값)',
    frontendFiles: ['base.md', FRAMEWORK_ENTRY_PLACEHOLDER, 'git.md', 'security.md'],
    backendFiles: ['base.md', 'backend.md', 'api-design.md', 'git.md', 'security.md'],
  },
  {
    id: 'strict',
    label: 'Strict',
    description: '모든 규칙 포함 (아키텍처는 FSD 기본)',
    frontendFiles: [
      'base.md',
      FRAMEWORK_ENTRY_PLACEHOLDER,
      'fsd.md',
      'git.md',
      'security.md',
      'testing.md',
      'a11y.md',
      'styling.md',
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

/**
 * 프리셋 + 스택 + framework 를 받아 *실제 다운로드/선택에 들어갈* 파일명 목록을 반환한다.
 *
 * - frontend: 'frontend.md' 가상 토큰을 framework entry 파일들로 치환.
 *   - react → ['frontend.md']
 *   - next → ['frontend.md', 'next.md']
 *   - vue → ['vue.md']
 *   - nuxt → ['vue.md', 'nuxt.md']
 *   - svelte → ['svelte.md']
 *   - sveltekit → ['svelte.md', 'sveltekit.md']
 *   - solid → ['solid.md']
 *   - vanilla → ['vanilla.md']
 * - backend: 'backend.md' 는 그대로 두고, 선택된 framework의 entry 파일을 끝에 추가.
 *   - node-express → 추가 ['node-express.md']
 *   - spring-boot → 추가 ['spring-boot.md']
 *   등.
 */
export const getPresetFiles = (
  preset: Preset,
  stack: Stack,
  framework?: FrontendFramework | BackendFramework,
): readonly string[] => {
  if (stack === 'frontend') {
    if (framework === undefined || !isFrontendFramework(framework)) {
      return preset.frontendFiles;
    }
    const entry = getFrameworkEntryFiles(framework);
    return preset.frontendFiles.flatMap((name) =>
      name === FRAMEWORK_ENTRY_PLACEHOLDER ? entry : [name],
    );
  }

  if (framework === undefined || !isBackendFramework(framework)) {
    return preset.backendFiles;
  }
  const entry = getBackendFrameworkEntryFiles(framework);
  return [...preset.backendFiles, ...entry];
};
