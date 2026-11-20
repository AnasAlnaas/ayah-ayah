import { getSurah } from '@/data/quran';
import { splitAyah } from '@/utils/split-ayah';

import { buildFeed, indexOfPosition, positionOfItem, surahProgress } from './build-feed';

describe('buildFeed', () => {
  const feed = buildFeed();

  it('has a header card per surah plus one card per ayah', () => {
    expect(feed.items).toHaveLength(6350);
    expect(feed.items.filter((i) => i.kind === 'header')).toHaveLength(114);
  });

  it('starts each surah with its header', () => {
    expect(feed.items[0]).toMatchObject({ kind: 'header', s: 1 });
    expect(feed.items[1]).toMatchObject({ kind: 'ayah', s: 1, a: 1 });
    expect(feed.items[8]).toMatchObject({ kind: 'header', s: 2 });
    expect(feed.items[feed.items.length - 1]).toMatchObject({ kind: 'ayah', s: 114, a: 6 });
  });

  it('gives every card a unique key', () => {
    expect(new Set(feed.items.map((i) => i.key)).size).toBe(feed.items.length);
  });

  it('maps positions to cards and back', () => {
    for (const pos of [
      { s: 1, a: 0 },
      { s: 1, a: 1 },
      { s: 2, a: 255 },
      { s: 9, a: 1 },
      { s: 114, a: 6 },
    ]) {
      expect(positionOfItem(feed.items[indexOfPosition(feed, pos)])).toEqual(pos);
    }
  });

  it('reports progress through the current surah', () => {
    expect(surahProgress(feed, 0)).toBe(0);
    expect(surahProgress(feed, 7)).toBe(1); // 1:7, last card of Al-Fatiha
    expect(surahProgress(feed, indexOfPosition(feed, { s: 2, a: 143 }))).toBeCloseTo(0.5, 2);
  });
});

describe('buildFeed with long ayahs split', () => {
  const longest = getSurah(2).ayahs[281];
  const feed = buildFeed((text) => (text === longest ? splitAyah(text, 3) : [text]));

  it('adds continuation cards that point to the same ayah', () => {
    expect(feed.items).toHaveLength(6352);
    const start = indexOfPosition(feed, { s: 2, a: 282 });
    expect(feed.items.slice(start, start + 3).map((i) => i.kind === 'ayah' && [i.a, i.part, i.parts])).toEqual([
      [282, 0, 3],
      [282, 1, 3],
      [282, 2, 3],
    ]);
    expect(positionOfItem(feed.items[start + 3])).toEqual({ s: 2, a: 283 });
    expect(surahProgress(feed, indexOfPosition(feed, { s: 2, a: 286 }))).toBe(1);
  });
});
