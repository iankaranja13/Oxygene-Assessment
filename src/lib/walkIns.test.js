import { describe, expect, it } from 'vitest';
import { GUEST_FLAGS, NO_ORGANIZATION, TICKET_TYPES } from './normalizeGuests.js';
import { WALK_IN_TICKET_TYPES, createWalkIn, validateWalkIn, walkInToGuest } from './walkIns.js';

const NOW = new Date('2026-11-20T15:00:00.000Z');

describe('validateWalkIn', () => {
  const existing = [{ name: 'José Núñez' }, { name: 'Amina Ali' }];

  it('requires a name', () => {
    expect(validateWalkIn({ name: '  ' }, existing).errors.name).toBeDefined();
    expect(validateWalkIn({ name: 'A' }, existing).errors.name).toBeDefined();
    expect(validateWalkIn({ name: 'Ann Oduya' }, existing).errors).toEqual({});
  });

  it('points out guests with the same name, ignoring case and accents', () => {
    const { errors, sameNameGuests } = validateWalkIn({ name: ' jose  nunez ' }, existing);
    expect(errors).toEqual({});
    expect(sameNameGuests).toEqual([{ name: 'José Núñez' }]);
  });
});

describe('createWalkIn', () => {
  it('cleans the input and stamps the time', () => {
    const walkIn = createWalkIn(
      { name: '  Ann   Oduya ', organization: ' Sendy ', ticketType: 'VIP' },
      NOW,
    );
    expect(walkIn).toMatchObject({
      name: 'Ann Oduya',
      organization: 'Sendy',
      ticketType: 'VIP',
      addedAt: '2026-11-20T15:00:00.000Z',
    });
    expect(walkIn.id).toMatch(/^walk-in-/);
  });

  it('gives each walk-in a different id', () => {
    expect(createWalkIn({ name: 'A B' }, NOW).id).not.toBe(createWalkIn({ name: 'A B' }, NOW).id);
  });

  it('falls back to General for a missing or invalid ticket type', () => {
    expect(createWalkIn({ name: 'A B', ticketType: 'Backstage' }, NOW).ticketType).toBe(
      TICKET_TYPES.GENERAL,
    );
    expect(WALK_IN_TICKET_TYPES).not.toContain(TICKET_TYPES.UNSPECIFIED);
  });
});

describe('walkInToGuest', () => {
  it('produces a normal, searchable guest flagged as a walk-in', () => {
    const guest = walkInToGuest(createWalkIn({ name: 'Ann Oduya' }, NOW));
    expect(guest).toMatchObject({
      name: 'Ann Oduya',
      organization: NO_ORGANIZATION,
      ticketType: 'General',
      checkInCode: null,
      flags: [GUEST_FLAGS.MISSING_ORGANIZATION, GUEST_FLAGS.WALK_IN],
    });
    expect(guest.id).toMatch(/^walk-in-/);
    expect(guest.searchText).toContain('ann oduya');
    expect(guest).not.toHaveProperty('sourceId');
  });

  it('rejects unusable stored records', () => {
    expect(walkInToGuest({ id: 'walk-in-x' })).toBeNull();
  });
});
