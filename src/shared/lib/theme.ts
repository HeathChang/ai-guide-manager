export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'ai-ruler:theme';
export const THEME_ATTRIBUTE = 'data-theme';

export const isTheme = (value: unknown): value is Theme =>
  value === 'light' || value === 'dark';

export const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined' || window.matchMedia === undefined) {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const readStoredTheme = (): Theme | undefined => {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(raw) ? raw : undefined;
  } catch {
    return undefined;
  }
};

export const writeStoredTheme = (theme: Theme): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // storage 장애 시 무시
  }
};

export const getInitialTheme = (): Theme => readStoredTheme() ?? getSystemTheme();

export const applyTheme = (theme: Theme): void => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
};
