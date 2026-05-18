import {
  isBackendFramework,
  isFrontendFramework,
} from '@/shared/types';
import type { BackendFramework, FrontendFramework } from '@/shared/types';

export const SELECTED_QUERY_KEY = 'files';
export const FRAMEWORK_QUERY_KEY = 'fw';

const FILE_NAME_MAX_LENGTH = 80;
const FILE_NAME_PATTERN = /^[a-zA-Z0-9._-]+(?:\/[a-zA-Z0-9._-]+)*\.md$/;

export const parseSelectedFromQuery = (search: string): readonly string[] | undefined => {
  const params = new URLSearchParams(search);
  const raw = params.get(SELECTED_QUERY_KEY);
  if (raw === null || raw.length === 0) return undefined;
  return raw
    .split(',')
    .map((name) => name.trim())
    .filter(
      (name) =>
        name.length > 0 &&
        name.length <= FILE_NAME_MAX_LENGTH &&
        !name.includes('..') &&
        FILE_NAME_PATTERN.test(name),
    );
};

export const parseFrameworkFromQuery = (
  search: string,
): FrontendFramework | BackendFramework | undefined => {
  const params = new URLSearchParams(search);
  const raw = params.get(FRAMEWORK_QUERY_KEY);
  if (raw === null || raw.length === 0) return undefined;
  if (isFrontendFramework(raw)) return raw;
  if (isBackendFramework(raw)) return raw;
  return undefined;
};

export const buildShareUrl = (params: {
  readonly origin: string;
  readonly pathname: string;
  readonly selected: readonly string[];
  readonly framework?: FrontendFramework | BackendFramework;
}): string => {
  const query = new URLSearchParams();
  query.set(SELECTED_QUERY_KEY, params.selected.join(','));
  if (params.framework !== undefined) {
    query.set(FRAMEWORK_QUERY_KEY, params.framework);
  }
  return `${params.origin}${params.pathname}?${query.toString()}`;
};

export const copyToClipboard = async (text: string): Promise<void> => {
  if (navigator.clipboard === undefined) {
    throw new Error('클립보드를 사용할 수 없습니다');
  }
  await navigator.clipboard.writeText(text);
};
