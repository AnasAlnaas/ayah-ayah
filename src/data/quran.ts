import raw from '@/assets/data/quran.json';

export type Surah = {
  /** 1–114 */
  n: number;
  /** Arabic name without the word "سورة", e.g. "البقرة" */
  name: string;
  /** Transliterated name, e.g. "Al-Baqara" */
  nameEn: string;
  type: 'meccan' | 'medinan';
  /** Verbatim basmala for the header card. Null for Al-Fatiha (it is ayah 1) and At-Tawbah. */
  basmala: string | null;
  ayahs: string[];
};

type QuranData = {
  source: {
    name: string;
    url: string;
    text: string;
    downloadOptions: string;
    sha256: Record<string, string>;
    notice: string;
  };
  surahs: Surah[];
  /** [surah, ayah] where each juz starts, juz 1–30 in order */
  juz: [number, number][];
  /** [surah, ayah, type] */
  sajdas: [number, number, string][];
};

export const quran = raw as unknown as QuranData;

export const SURAH_COUNT = quran.surahs.length; // 114
export const JUZ_COUNT = quran.juz.length; // 30

/** Global index (0-based) of each surah's first ayah. surahStart[1] = 0. */
const surahStart: number[] = [0];
let running = 0;
for (const s of quran.surahs) {
  surahStart[s.n] = running;
  running += s.ayahs.length;
}
export const TOTAL_AYAHS = running; // 6236

export function getSurah(n: number): Surah {
  return quran.surahs[n - 1];
}

/** 0-based position of an ayah in the whole Qur'an (1:1 → 0, 114:6 → 6235). */
export function globalAyahIndex(s: number, a: number): number {
  return surahStart[s] + Math.max(a, 1) - 1;
}

/** Juz (1–30) containing surah:ayah. Ayah 0 (the header card) counts as ayah 1. */
export function juzOf(s: number, a: number): number {
  const key = s * 1000 + Math.max(a, 1);
  let juz = 1;
  for (let i = 0; i < quran.juz.length; i++) {
    const [js, ja] = quran.juz[i];
    if (js * 1000 + ja <= key) juz = i + 1;
    else break;
  }
  return juz;
}

const sajdaKeys = new Set(quran.sajdas.map(([s, a]) => s * 1000 + a));

export function isSajda(s: number, a: number): boolean {
  return sajdaKeys.has(s * 1000 + a);
}

export function clampPosition(s: number, a: number): { s: number; a: number } {
  const surah = Math.min(Math.max(Math.round(s) || 1, 1), SURAH_COUNT);
  const max = getSurah(surah).ayahs.length;
  return { s: surah, a: Math.min(Math.max(Math.round(a) || 0, 0), max) };
}
