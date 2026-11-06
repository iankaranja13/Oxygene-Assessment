import { afterEach, describe, expect, it, vi } from 'vitest';
import { STORE_ERRORS, createLocalStore } from './localStore.js';
import { createSafeStorage } from './safeStorage.js';
import { EMPTY_SHARED_STATE } from './sharedState.js';
import { createMemoryBackend, createThrowingBackend } from './testBackends.js';

const CHECKED_IN = { checkedIn: true, at: '2026-11-20T15:00:00.000Z' };

function setup(backend = createMemoryBackend(), eventTarget = null) {
  const storage = createSafeStorage(() => backend);
  return { backend, storage, store: createLocalStore({ storage, eventTarget }) };
}

/** Simulates the "storage" event the browser fires in other tabs. */
function storageEvent(key) {
  const event = new Event('storage');
  event.key = key;
  return event;
}

describe('createLocalStore', () => {
  afterEach(() => vi.restoreAllMocks());

  it('starts empty and persists check-ins', async () => {
    const { storage, store } = setup();
    expect(store.getState()).toEqual(EMPTY_SHARED_STATE);

    expect(await store.setCheckIn('G1', CHECKED_IN)).toEqual({ ok: true });
    expect(store.getState().checkIns).toEqual({ G1: CHECKED_IN });
    expect(storage.readJson('check-ins', null)).toEqual({ G1: CHECKED_IN });
  });

  it('reloads saved state when created again (a page refresh)', async () => {
    const { backend, store } = setup();
    await store.setCheckIn('G1', CHECKED_IN);
    const { store: reloaded } = setup(backend);
    expect(reloaded.getState().checkIns).toEqual({ G1: CHECKED_IN });
  });

  it('notifies subscribers and keeps state stable between changes', async () => {
    const { store } = setup();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    const before = store.getState();
    expect(store.getState()).toBe(before);

    await store.setCheckIn('G1', CHECKED_IN);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getState()).not.toBe(before);

    unsubscribe();
    await store.setCheckIn('G2', CHECKED_IN);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not overwrite a change another tab just saved', async () => {
    const backend = createMemoryBackend();
    const { store: tabA } = setup(backend);
    const { store: tabB } = setup(backend);
    await tabA.setCheckIn('G1', CHECKED_IN);
    await tabB.setCheckIn('G2', CHECKED_IN);
    expect(Object.keys(tabB.getState().checkIns)).toEqual(['G1', 'G2']);
  });

  it('only accepts votes for the open, active poll', async () => {
    const { store } = setup();
    expect(await store.castVote('poll-1', 0)).toEqual({
      ok: false,
      error: STORE_ERRORS.POLL_CLOSED,
    });

    await store.setPollState({ activePollId: 'poll-1', isOpen: true });
    expect(await store.castVote('poll-1', 2)).toEqual({ ok: true });
    expect(await store.castVote('poll-1', 2)).toEqual({ ok: true });
    expect(await store.castVote('poll-2', 0)).toEqual({
      ok: false,
      error: STORE_ERRORS.POLL_CLOSED,
    });
    expect(await store.castVote('poll-1', -1)).toEqual({
      ok: false,
      error: STORE_ERRORS.INVALID_OPTION,
    });
    expect(store.getState().votes).toEqual({ 'poll-1': [0, 0, 2] });

    await store.setPollState({ isOpen: false });
    expect(store.getState().pollState.activePollId).toBe('poll-1');
    expect((await store.castVote('poll-1', 0)).ok).toBe(false);
  });

  it('merges poll state changes and keeps the voting round', async () => {
    const { store } = setup();
    await store.resetAll();
    const { votingRound } = store.getState().pollState;
    await store.setPollState({ activePollId: 'poll-2' });
    await store.setPollState({ isOpen: true });
    expect(store.getState().pollState).toEqual({
      activePollId: 'poll-2',
      isOpen: true,
      votingRound,
    });
  });

  it('adds walk-ins', async () => {
    const { store } = setup();
    await store.addWalkIn({ id: 'walk-in-1', name: 'New Guest' });
    expect(store.getState().walkIns).toEqual([{ id: 'walk-in-1', name: 'New Guest' }]);
  });

  it('resets everything', async () => {
    const { storage, store } = setup();
    await store.setCheckIn('G1', CHECKED_IN);
    await store.setPollState({ activePollId: 'poll-1', isOpen: true });
    await store.castVote('poll-1', 0);

    const roundBefore = store.getState().pollState.votingRound;
    expect(await store.resetAll()).toEqual({ ok: true });
    const { pollState, ...rest } = store.getState();
    expect(rest).toEqual({ checkIns: {}, walkIns: [], votes: {} });
    expect(pollState).toMatchObject({ activePollId: null, isOpen: false });
    // A new voting round means every device's "already voted" flag no longer applies.
    expect(pollState.votingRound).not.toBe(roundBefore);
    expect(storage.readJson('votes', null)).toEqual({});
  });

  it('repairs malformed saved data instead of crashing', () => {
    const { store } = setup(
      createMemoryBackend({
        'launchpad:v1:check-ins': '"not an object"',
        'launchpad:v1:votes': '{"poll-1": [1, "two", -3]}',
        'launchpad:v1:poll-state': '{broken json',
      }),
    );
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(store.getState().checkIns).toEqual({});
    expect(store.getState().votes).toEqual({ 'poll-1': [1, 0, 0] });
    expect(store.getState().pollState).toEqual(EMPTY_SHARED_STATE.pollState);
  });

  it('keeps working in memory when storage is blocked, and says so', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { store } = setup(createThrowingBackend());
    const result = await store.setCheckIn('G1', CHECKED_IN);
    expect(result).toEqual({ ok: false, error: STORE_ERRORS.NOT_SAVED });
    expect(store.getState().checkIns).toEqual({ G1: CHECKED_IN });

    // A second change must build on the first, not on the unreadable storage.
    await store.setCheckIn('G2', CHECKED_IN);
    expect(Object.keys(store.getState().checkIns)).toEqual(['G1', 'G2']);
  });

  it('picks up changes made in another tab', async () => {
    const backend = createMemoryBackend();
    const events = new EventTarget();
    const { store: thisTab } = setup(backend, events);
    const { store: otherTab } = setup(backend);
    const listener = vi.fn();
    thisTab.subscribe(listener);

    await otherTab.setCheckIn('G1', CHECKED_IN);
    expect(thisTab.getState().checkIns).toEqual({});

    events.dispatchEvent(storageEvent('launchpad:v1:check-ins'));
    expect(thisTab.getState().checkIns).toEqual({ G1: CHECKED_IN });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ignores storage events for unrelated keys and stops listening when unsubscribed', () => {
    const events = new EventTarget();
    const { store } = setup(createMemoryBackend(), events);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    events.dispatchEvent(storageEvent('some-other-app:key'));
    expect(listener).not.toHaveBeenCalled();

    unsubscribe();
    events.dispatchEvent(storageEvent('launchpad:v1:votes'));
    expect(listener).not.toHaveBeenCalled();
  });
});
