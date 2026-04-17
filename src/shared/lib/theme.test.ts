import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  applyTheme,
  getInitialTheme,
  getSystemTheme,
  isTheme,
  readStoredTheme,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  writeStoredTheme,
} from './theme';

describe('isTheme', () => {
  it('should return true for valid theme values', () => {
    expect(isTheme('light')).toBe(true);
    expect(isTheme('dark')).toBe(true);
  });

  it('should return false for invalid values', () => {
    expect(isTheme('auto')).toBe(false);
    expect(isTheme('')).toBe(false);
    expect(isTheme(null)).toBe(false);
    expect(isTheme(undefined)).toBe(false);
    expect(isTheme(42)).toBe(false);
  });
});

describe('readStoredTheme / writeStoredTheme', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('should return undefined when no theme is stored', () => {
    expect(readStoredTheme()).toBeUndefined();
  });

  it('should return the stored theme when a valid value is written', () => {
    writeStoredTheme('dark');
    expect(readStoredTheme()).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('should return undefined when the stored value is not a valid theme', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'purple');
    expect(readStoredTheme()).toBeUndefined();
  });

  it('should swallow errors thrown by setItem', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => writeStoredTheme('light')).not.toThrow();
    spy.mockRestore();
  });
});

describe('getSystemTheme', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return dark when prefers-color-scheme is dark', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) => ({ matches: query.includes('dark'), media: query }) as MediaQueryList,
    );
    expect(getSystemTheme()).toBe('dark');
  });

  it('should return light when prefers-color-scheme is not dark', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) => ({ matches: false, media: query }) as MediaQueryList,
    );
    expect(getSystemTheme()).toBe('light');
  });
});

describe('applyTheme', () => {
  it('should set the data-theme attribute on the document root', () => {
    applyTheme('dark');
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe('dark');
    applyTheme('light');
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe('light');
  });
});

describe('getInitialTheme', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should prefer a stored theme over the system preference', () => {
    writeStoredTheme('light');
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) => ({ matches: true, media: query }) as MediaQueryList,
    );
    expect(getInitialTheme()).toBe('light');
  });

  it('should fall back to the system preference when no theme is stored', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) => ({ matches: true, media: query }) as MediaQueryList,
    );
    expect(getInitialTheme()).toBe('dark');
  });
});
