import { afterEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_PREFIX, createSafeStorage } from './safeStorage.js';
import { createMemoryBackend, createThrowingBackend } from './testBackends.js';

describe('createSafeStorage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('round-trips JSON under a versioned key', () => {
    const backend = createMemoryBackend();
    const storage = createSafeStorage(() => backend);
    expect(storage.writeJson('votes', { a: [1, 2] })).toBe(true);
    expect(backend.items.has(`${STORAGE_PREFIX}votes`)).toBe(true);
    expect(storage.readJson('votes', null)).toEqual({ a: [1, 2] });
  });

  it('returns the fallback for missing keys and corrupted JSON', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const backend = createMemoryBackend({ [`${STORAGE_PREFIX}broken`]: '{not json' });
    const storage = createSafeStorage(() => backend);
    expect(storage.readJson('missing', 'fallback')).toBe('fallback');
    expect(storage.readJson('broken', 'fallback')).toBe('fallback');
  });

  it('never throws when storage is blocked, and reports failed writes', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const storage = createSafeStorage(() => createThrowingBackend());
    expect(storage.isAvailable()).toBe(false);
    expect(storage.readJson('anything', 'fallback')).toBe('fallback');
    expect(storage.writeJson('anything', 1)).toBe(false);
    expect(storage.remove('anything')).toBe(false);
  });

  it('copes when even accessing storage throws (no window in Node)', () => {
    const storage = createSafeStorage(() => window.localStorage);
    expect(storage.isAvailable()).toBe(false);
    expect(storage.readJson('anything', 7)).toBe(7);
  });
});
