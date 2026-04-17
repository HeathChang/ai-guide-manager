import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('should join truthy string classes with a space', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz');
  });

  it('should filter out false, null, and undefined values', () => {
    expect(cn('foo', false, null, undefined, 'bar')).toBe('foo bar');
  });

  it('should keep truthy numeric values and drop zero', () => {
    expect(cn('foo', 0, 1, 'bar')).toBe('foo 1 bar');
  });

  it('should return an empty string when no truthy classes are provided', () => {
    expect(cn(false, null, undefined)).toBe('');
  });

  it('should handle conditional className patterns', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe(
      'base active',
    );
  });
});
