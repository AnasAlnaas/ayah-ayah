import { quran } from '@/data/quran';

import { visualLength } from './split-ayah';

/** Ayahs that read well on their own card: not a single word, not a whole page. */
let candidates: { s: number; a: number }[] | null = null;
function pool() {
  if (!candidates) {
    candidates = [];
    for (const surah of quran.surahs) {
      surah.ayahs.forEach((text, i) => {
        const len = visualLength(text);
        if (len >= 45 && len <= 180) candidates!.push({ s: surah.n, a: i + 1 });
      });
    }
  }
  return candidates;
}

/** Days since 1970-01-01 in the device's own time zone. */
export function localDayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

/** The same ayah all day, a different one each day. */
export function ayahOfTheDay(date = new Date()): { s: number; a: number } {
  const list = pool();
  // Multiplying by a large odd number spreads consecutive days across the whole Qur'an.
  const index = (Math.imul(localDayNumber(date), 2654435761) >>> 0) % list.length;
  return list[index];
}
