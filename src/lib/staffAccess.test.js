import { describe, expect, it } from 'vitest';
import { isCorrectPin } from './staffAccess.js';

describe('isCorrectPin', () => {
  it('accepts the PIN with surrounding spaces', () => {
    expect(isCorrectPin(' 2026 ', '2026')).toBe(true);
  });

  it('rejects wrong or empty PINs', () => {
    expect(isCorrectPin('2025', '2026')).toBe(false);
    expect(isCorrectPin('', '2026')).toBe(false);
    expect(isCorrectPin(undefined, '2026')).toBe(false);
  });
});
