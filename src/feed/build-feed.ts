import { getSurah, globalAyahIndex, quranText, totalAyahs } from '@/data/quran';

export type HeaderItem = { kind: 'header'; key: string; s: number };
export type AyahItem = {
  kind: 'ayah';
  key: string;
  s: number;
  a: number;
  /** 0-based part when a long ayah continues over several cards */
  part: number;
  parts: number;
  text: string;
};
export type FeedItem = HeaderItem | AyahItem;

/** a = 0 is the surah's header card. */
export type Position = { s: number; a: number };

export type Feed = {
  items: FeedItem[];
  /** Item index of each surah's header card, by surah number. */
  headerIndex: number[];
  /** Item index of the first card of each ayah, by global ayah index. */
  ayahIndex: Int32Array;
  /** Cards per surah, header included, by surah number. */
  surahCards: number[];
};

/**
 * One header card per surah, then a card for each ayah. `split` decides how many
 * cards a long ayah needs for the current screen and text size.
 */
export function buildFeed(split: (text: string) => string[] = (t) => [t]): Feed {
  const items: FeedItem[] = [];
  const headerIndex: number[] = [0];
  const surahCards: number[] = [0];
  const ayahIndex = new Int32Array(totalAyahs());

  for (const surah of quranText().surahs) {
    const s = surah.n;
    headerIndex[s] = items.length;
    items.push({ kind: 'header', key: `${s}`, s });
    surah.ayahs.forEach((text, i) => {
      const a = i + 1;
      ayahIndex[globalAyahIndex(s, a)] = items.length;
      const parts = split(text);
      parts.forEach((partText, part) => {
        items.push({ kind: 'ayah', key: `${s}:${a}:${part}`, s, a, part, parts: parts.length, text: partText });
      });
    });
    surahCards[s] = items.length - headerIndex[s];
  }

  return { items, headerIndex, ayahIndex, surahCards };
}

export function indexOfPosition(feed: Feed, { s, a }: Position): number {
  if (a <= 0) return feed.headerIndex[s] ?? 0;
  return feed.ayahIndex[globalAyahIndex(s, Math.min(a, getSurah(s).ayahs.length))];
}

export function positionOfItem(item: FeedItem): Position {
  return item.kind === 'header' ? { s: item.s, a: 0 } : { s: item.s, a: item.a };
}

/** 0 on the header card, 1 on the surah's last card. */
export function surahProgress(feed: Feed, index: number): number {
  const item = feed.items[index];
  if (!item) return 0;
  const start = feed.headerIndex[item.s];
  const cards = feed.surahCards[item.s];
  return cards <= 1 ? 1 : (index - start) / (cards - 1);
}
