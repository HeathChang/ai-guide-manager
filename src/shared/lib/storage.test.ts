import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createLocalStorage } from './storage';

interface Sample {
  readonly count: number;
  readonly label: string;
}

describe('createLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('read', () => {
    it('should return undefined when the key is missing', () => {
      const storage = createLocalStorage<Sample>('missing-key');
      expect(storage.read()).toBeUndefined();
    });

    it('should return parsed value when a JSON string is stored', () => {
      window.localStorage.setItem('sample', JSON.stringify({ count: 3, label: 'x' }));
      const storage = createLocalStorage<Sample>('sample');
      expect(storage.read()).toEqual({ count: 3, label: 'x' });
    });

    it('should return undefined when the stored value is not valid JSON', () => {
      window.localStorage.setItem('broken', '{not-json');
      const storage = createLocalStorage<Sample>('broken');
      expect(storage.read()).toBeUndefined();
    });
  });

  describe('write', () => {
    it('should serialize the value as JSON under the given key', () => {
      const storage = createLocalStorage<Sample>('written');
      storage.write({ count: 7, label: 'hello' });
      expect(window.localStorage.getItem('written')).toBe(
        JSON.stringify({ count: 7, label: 'hello' }),
      );
    });

    it('should swallow errors thrown by setItem', () => {
      const spy = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('quota');
        });
      const storage = createLocalStorage<Sample>('quota-key');
      expect(() => storage.write({ count: 1, label: 'a' })).not.toThrow();
      spy.mockRestore();
    });
  });

  describe('clear', () => {
    it('should remove the stored value for the given key', () => {
      window.localStorage.setItem('remove-me', '"value"');
      const storage = createLocalStorage<string>('remove-me');
      storage.clear();
      expect(window.localStorage.getItem('remove-me')).toBeNull();
    });

    it('should swallow errors thrown by removeItem', () => {
      const spy = vi
        .spyOn(Storage.prototype, 'removeItem')
        .mockImplementation(() => {
          throw new Error('fail');
        });
      const storage = createLocalStorage<string>('anything');
      expect(() => storage.clear()).not.toThrow();
      spy.mockRestore();
    });
  });
});
