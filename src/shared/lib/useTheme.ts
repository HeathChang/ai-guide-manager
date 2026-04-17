import { useCallback, useEffect, useState } from 'react';
import {
  type Theme,
  THEME_ATTRIBUTE,
  applyTheme,
  getInitialTheme,
  writeStoredTheme,
} from './theme';

interface UseThemeResult {
  readonly theme: Theme;
  readonly toggleTheme: () => void;
  readonly setTheme: (theme: Theme) => void;
}

const readCurrentAttribute = (): Theme => {
  if (typeof document === 'undefined') return getInitialTheme();
  const attr = document.documentElement.getAttribute(THEME_ATTRIBUTE);
  return attr === 'dark' ? 'dark' : 'light';
};

export const useTheme = (): UseThemeResult => {
  const [theme, setThemeState] = useState<Theme>(readCurrentAttribute);

  useEffect(() => {
    applyTheme(theme);
    writeStoredTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);
  const toggleTheme = useCallback(
    () => setThemeState((previous) => (previous === 'dark' ? 'light' : 'dark')),
    [],
  );

  return { theme, toggleTheme, setTheme };
};
