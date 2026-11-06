import { describe, expect, it } from 'vitest';
import { clearVotedFlagsOnDevice, hasVotedOnDevice, markVotedOnDevice } from './deviceFlags.js';
import { createSafeStorage } from './safeStorage.js';
import { createMemoryBackend, createThrowingBackend } from './testBackends.js';

describe('device vote flags', () => {
  it('remembers which polls this device voted in', () => {
    const backend = createMemoryBackend();
    const storage = createSafeStorage(() => backend);
    expect(hasVotedOnDevice('poll-1', storage)).toBe(false);
    expect(markVotedOnDevice('poll-1', storage)).toBe(true);
    expect(hasVotedOnDevice('poll-1', storage)).toBe(true);
    expect(hasVotedOnDevice('poll-2', storage)).toBe(false);

    clearVotedFlagsOnDevice(storage);
    expect(hasVotedOnDevice('poll-1', storage)).toBe(false);
  });

  it('reports when the flag cannot be saved', () => {
    const storage = createSafeStorage(() => createThrowingBackend());
    expect(markVotedOnDevice('poll-1', storage)).toBe(false);
  });
});
