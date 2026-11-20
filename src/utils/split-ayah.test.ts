import { getSurah, quran } from '@/data/quran';

import { estimateTextHeight, partsNeeded, splitAyah, visualLength } from './split-ayah';

const ayah = (s: number, a: number) => getSurah(s).ayahs[a - 1];

describe('splitAyah', () => {
  it('returns the ayah unchanged when one part is enough', () => {
    expect(splitAyah(ayah(1, 2), 1)).toEqual([ayah(1, 2)]);
  });

  it('never changes the text: parts rejoin to the exact original, for every ayah', () => {
    for (const s of quran.surahs) {
      for (const text of s.ayahs) {
        for (const parts of [2, 3, 4]) {
          const out = splitAyah(text, parts);
          expect(out.join(' ')).toBe(text);
          expect(out.every((p) => p.length > 0)).toBe(true);
        }
      }
    }
  });

  it('never starts a part with a pause mark or sajdah sign', () => {
    for (const s of quran.surahs) {
      for (const text of s.ayahs) {
        for (const part of splitAyah(text, 3).slice(1)) {
          expect(part).not.toMatch(/^[ۖ-۞۩]/);
        }
      }
    }
  });

  it('never cuts right after the "do not stop" mark ۙ', () => {
    for (const s of quran.surahs) {
      for (const text of s.ayahs) {
        for (const part of splitAyah(text, 3).slice(0, -1)) {
          expect(part.endsWith('ۙ')).toBe(false);
        }
      }
    }
  });

  it('prefers to cut after a pause mark in 2:282', () => {
    const parts = splitAyah(ayah(2, 282), 3);
    expect(parts).toHaveLength(3);
    for (const part of parts.slice(0, -1)) {
      expect(part).toMatch(/[ۖ-ۘۚۛ]$/);
    }
    // Parts stay roughly balanced.
    const sizes = parts.map(visualLength);
    expect(Math.max(...sizes) / Math.min(...sizes)).toBeLessThan(1.8);
  });
});

describe('size estimates', () => {
  const box = { width: 315, height: 480 };

  it('grows with text length and font size', () => {
    expect(estimateTextHeight(ayah(2, 282), 20, 2, 315)).toBeGreaterThan(estimateTextHeight(ayah(1, 2), 20, 2, 315));
    expect(estimateTextHeight(ayah(2, 255), 30, 2, 315)).toBeGreaterThan(estimateTextHeight(ayah(2, 255), 20, 2, 315));
  });

  it('keeps short ayahs on one card and splits the longest', () => {
    expect(partsNeeded(ayah(20, 1), box, 20, 2)).toBe(1);
    expect(partsNeeded(ayah(1, 7), box, 20, 2)).toBe(1);
    expect(partsNeeded(ayah(2, 282), box, 20, 2)).toBeGreaterThan(1);
  });
});
