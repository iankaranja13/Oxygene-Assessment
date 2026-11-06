import { describe, expect, it } from 'vitest';
import {
  VOTED_ELSEWHERE,
  clearDeviceVotes,
  getDeviceVote,
  recordDeviceVote,
} from './deviceFlags.js';
import { STORAGE_PREFIX, createSafeStorage } from './safeStorage.js';
import { createMemoryBackend, createThrowingBackend } from './testBackends.js';

function memoryStorage(initial) {
  const backend = createMemoryBackend(initial);
  return createSafeStorage(() => backend);
}

const vote = { votingRound: 'r1', pollId: 'poll-1', voterCode: 'OXY-1001' };

describe('device votes', () => {
  it('remembers which option a code chose on this device', () => {
    const storage = memoryStorage();
    expect(getDeviceVote(vote, storage)).toBeNull();
    expect(recordDeviceVote(vote, 2, storage)).toBe(true);
    expect(getDeviceVote(vote, storage)).toBe(2);
    expect(getDeviceVote({ ...vote, pollId: 'poll-2' }, storage)).toBeNull();
  });

  it('keeps separate entries for two guests sharing a phone', () => {
    const storage = memoryStorage();
    recordDeviceVote(vote, 1, storage);
    expect(getDeviceVote({ ...vote, voterCode: 'OXY-1002' }, storage)).toBeNull();
  });

  it('forgets votes from an earlier voting round', () => {
    const storage = memoryStorage();
    recordDeviceVote(vote, 0, storage);
    expect(getDeviceVote({ ...vote, votingRound: 'r2' }, storage)).toBeNull();
  });

  it('remembers option 0 and "voted elsewhere"', () => {
    const storage = memoryStorage();
    recordDeviceVote(vote, 0, storage);
    expect(getDeviceVote(vote, storage)).toBe(0);
    recordDeviceVote({ ...vote, pollId: 'poll-2' }, VOTED_ELSEWHERE, storage);
    expect(getDeviceVote({ ...vote, pollId: 'poll-2' }, storage)).toBe(VOTED_ELSEWHERE);
  });

  it('can be cleared', () => {
    const storage = memoryStorage();
    recordDeviceVote(vote, 1, storage);
    clearDeviceVotes(storage);
    expect(getDeviceVote(vote, storage)).toBeNull();
  });

  it('ignores malformed saved data and reports failed saves', () => {
    const corrupted = memoryStorage({
      [`${STORAGE_PREFIX}device-votes`]: '{"r1/poll-1/OXY-1001":"yes"}',
    });
    expect(getDeviceVote(vote, corrupted)).toBeNull();
    const blocked = createSafeStorage(() => createThrowingBackend());
    expect(recordDeviceVote(vote, 1, blocked)).toBe(false);
  });
});
