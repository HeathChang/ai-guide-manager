export interface StorageAdapter<T> {
  read: () => T | undefined;
  write: (value: T) => void;
  clear: () => void;
}

export const createLocalStorage = <T>(key: string): StorageAdapter<T> => ({
  read: () => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return undefined;
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  },
  write: (value) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota exceeded or disabled — 조용히 무시 (에디터 유지는 부가 기능)
    }
  },
  clear: () => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // 동일 — 스토리지 장애 시 조용히 무시
    }
  },
});
