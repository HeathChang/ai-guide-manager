import { describe, it, expect } from 'vitest';
import { formatDateYYYYMMDD } from './formatDate';

describe('formatDateYYYYMMDD', () => {
  it('should format a date as YYYYMMDD without separators', () => {
    expect(formatDateYYYYMMDD(new Date(2026, 3, 17))).toBe('20260417');
  });

  it('should pad single-digit months and days with leading zeros', () => {
    expect(formatDateYYYYMMDD(new Date(2026, 0, 5))).toBe('20260105');
  });

  it('should preserve two-digit months and days without extra padding', () => {
    expect(formatDateYYYYMMDD(new Date(2025, 10, 30))).toBe('20251130');
  });

  it('should handle the last day of the year correctly', () => {
    expect(formatDateYYYYMMDD(new Date(2024, 11, 31))).toBe('20241231');
  });
});
