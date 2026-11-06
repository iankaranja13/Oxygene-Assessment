import { describe, expect, it } from 'vitest';
import { clearDeviceVotes, getDeviceVote, recordDeviceVote } from './deviceFlags.js';
import { STORAGE_PREFIX, createSafeStorage } from './safeStorage.js';
import { createMemoryBackend, createThrowingBackend } from './testBackends.js';

function memoryStorage(initial) {
  const backend = createMemoryBackend(initial);
  return createSafeStorage(() => backend);
}

describe('device votes', () => {
  it('remembers which option this device chose in each poll', () => {
    const storage = memoryStorage();
    expect(getDeviceVote('r1', 'poll-1', storage)).toBeNull();
    expect(recordDeviceVote('r1', 'poll-1', 2, storage)).toBe(true);
    expect(getDeviceVote('r1', 'poll-1', storage)).toBe(2);
    expect(getDeviceVote('r1', 'poll-2', storage)).toBeNull();
  });

  it('forgets votes from an earlier voting round', () => {
    const storage = memoryStorage();
    recordDeviceVote('r1', 'poll-1', 0, storage);
    expect(getDeviceVote('r2', 'poll-1', storage)).toBeNull();
  });

  it('remembers option 0 (not mistaken for "no vote")', () => {
    const storage = memoryStorage();
    recordDeviceVote('r1', 'poll-1', 0, storage);
    expect(getDeviceVote('r1', 'poll-1', storage)).toBe(0);
  });

  it('can be cleared', () => {
    const storage = memoryStorage();
    recordDeviceVote('r1', 'poll-1', 1, storage);
    clearDeviceVotes(storage);
    expect(getDeviceVote('r1', 'poll-1', storage)).toBeNull();
  });

  it('ignores malformed saved data and reports failed saves', () => {
    const corrupted = memoryStorage({ [`${STORAGE_PREFIX}device-votes`]: '{"r1/poll-1":"yes"}' });
    expect(getDeviceVote('r1', 'poll-1', corrupted)).toBeNull();
    const blocked = createSafeStorage(() => createThrowingBackend());
    expect(recordDeviceVote('r1', 'poll-1', 1, blocked)).toBe(false);
  });
});
