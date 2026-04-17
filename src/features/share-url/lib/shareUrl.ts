export const SELECTED_QUERY_KEY = 'files';

export const parseSelectedFromQuery = (search: string): readonly string[] | undefined => {
  const params = new URLSearchParams(search);
  const raw = params.get(SELECTED_QUERY_KEY);
  if (raw === null || raw.length === 0) return undefined;
  const MAX_LENGTH = 50;
  const fileNamePattern = /^[a-zA-Z0-9._-]+\.md$/;
  return raw
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name.length > 0 && name.length <= MAX_LENGTH && fileNamePattern.test(name));
};

export const buildShareUrl = (params: {
  readonly origin: string;
  readonly pathname: string;
  readonly selected: readonly string[];
}): string => {
  const query = new URLSearchParams();
  query.set(SELECTED_QUERY_KEY, params.selected.join(','));
  return `${params.origin}${params.pathname}?${query.toString()}`;
};

export const copyToClipboard = async (text: string): Promise<void> => {
  if (navigator.clipboard === undefined) {
    throw new Error('클립보드를 사용할 수 없습니다');
  }
  await navigator.clipboard.writeText(text);
};
