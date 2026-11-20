import { getSurah } from '@/data/quran';

import { ayahOfTheDay, localDayNumber } from './ayah-of-the-day';

describe('ayahOfTheDay', () => {
  it('stays the same through the day', () => {
    expect(ayahOfTheDay(new Date(2026, 10, 19, 0, 5))).toEqual(ayahOfTheDay(new Date(2026, 10, 19, 23, 55)));
  });

  it('changes from day to day', () => {
    const days = Array.from({ length: 30 }, (_, i) => ayahOfTheDay(new Date(2026, 10, 1 + i)));
    expect(new Set(days.map((d) => `${d.s}:${d.a}`)).size).toBeGreaterThan(25);
  });

  it('always points at a real ayah', () => {
    for (let i = 0; i < 400; i++) {
      const { s, a } = ayahOfTheDay(new Date(2026, 0, 1 + i));
      expect(getSurah(s).ayahs[a - 1]).toBeTruthy();
    }
  });

  it('counts local days', () => {
    expect(localDayNumber(new Date(1970, 0, 2, 12))).toBe(1);
  });
});
