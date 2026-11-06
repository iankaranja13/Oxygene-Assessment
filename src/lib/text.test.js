import { describe, expect, it } from 'vitest';
import { cleanText, fixAllCapsOrLowerName, foldForSearch } from './text.js';

describe('cleanText', () => {
  it('trims and collapses whitespace', () => {
    expect(cleanText('  Amina   Hassan  ')).toBe('Amina Hassan');
  });

  it('converts numbers and joins string arrays', () => {
    expect(cleanText(1161)).toBe('1161');
    expect(cleanText(['iHub', ' Andela '])).toBe('iHub, Andela');
  });

  it('returns an empty string for null, undefined, objects and booleans', () => {
    for (const value of [null, undefined, {}, true, Number.NaN]) {
      expect(cleanText(value)).toBe('');
    }
  });
});

describe('foldForSearch', () => {
  it('removes accents and case so spellings compare equal', () => {
    expect(foldForSearch('  José  NÚÑEZ ')).toBe('jose nunez');
    expect(foldForSearch('Zoë Lefèvre')).toBe('zoe lefevre');
  });
});

describe('fixAllCapsOrLowerName', () => {
  it('title-cases names typed in all caps or all lower case', () => {
    expect(fixAllCapsOrLowerName('AISHA LEFÈVRE')).toBe('Aisha Lefèvre');
    expect(fixAllCapsOrLowerName('esther odhiambo')).toBe('Esther Odhiambo');
    expect(fixAllCapsOrLowerName("mary-jane o'neil")).toBe("Mary-Jane O'Neil");
  });

  it('leaves deliberately mixed-case names untouched', () => {
    expect(fixAllCapsOrLowerName('Ronald McDonald')).toBe('Ronald McDonald');
    expect(fixAllCapsOrLowerName('Pieter van der Berg')).toBe('Pieter van der Berg');
  });
});
