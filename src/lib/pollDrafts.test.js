import { describe, expect, it } from 'vitest';
import { MAX_POLL_OPTIONS, createPollRecord, validatePollDraft } from './pollDrafts.js';

describe('validatePollDraft', () => {
  it('accepts a question with two or more different answers, cleaned', () => {
    const { errors, cleaned } = validatePollDraft({
      question: '  Best   demo? ',
      options: [' Keynote ', '', 'Panel', '   '],
    });
    expect(errors).toEqual({});
    expect(cleaned).toEqual({ question: 'Best demo?', options: ['Keynote', 'Panel'] });
  });

  it('requires a question', () => {
    expect(
      validatePollDraft({ question: '  ', options: ['A', 'B'] }).errors.question,
    ).toBeDefined();
  });

  it('requires at least two answers', () => {
    expect(validatePollDraft({ question: 'Q?', options: ['Only one', ''] }).errors.options).toMatch(
      /at least 2/,
    );
  });

  it('rejects too many answers', () => {
    const options = Array.from({ length: MAX_POLL_OPTIONS + 1 }, (_, index) => `Answer ${index}`);
    expect(validatePollDraft({ question: 'Q?', options }).errors.options).toMatch(/at most/);
  });

  it('rejects duplicate answers, ignoring case and accents', () => {
    expect(validatePollDraft({ question: 'Q?', options: ['Café', 'cafe'] }).errors.options).toMatch(
      /different/,
    );
  });

  it('rejects overly long text', () => {
    expect(
      validatePollDraft({ question: 'x'.repeat(201), options: ['A', 'B'] }).errors.question,
    ).toBeDefined();
    expect(
      validatePollDraft({ question: 'Q?', options: ['A', 'b'.repeat(81)] }).errors.options,
    ).toBeDefined();
  });
});

describe('createPollRecord', () => {
  it('creates a uniquely identified custom poll', () => {
    const cleaned = { question: 'Q?', options: ['A', 'B'] };
    const first = createPollRecord(cleaned);
    expect(first).toMatchObject(cleaned);
    expect(first.id).toMatch(/^custom-/);
    expect(createPollRecord(cleaned).id).not.toBe(first.id);
  });
});
