import hafsRaw from '@/assets/data/quran.json';
import qalunRaw from '@/assets/data/quran-qalun.json';

export type Riwayah = 'hafs' | 'qalun';

export type Surah = {
  /** 1–114 */
  n: number;
  /** Arabic name without the word "سورة", e.g. "البقرة" */
  name: string;
  /** Transliterated name, e.g. "Al-Baqara" */
  nameEn: string;
  type: 'meccan' | 'medinan';
  /** Basmala for the header card. Null where it is a numbered ayah (Hafs Al-Fatiha) or absent (At-Tawbah). */
  basmala: string | null;
  ayahs: string[];
  /** Qalun only: the [first, last] Hafs ayah each ayah covers. */
  hafs?: [number, number][];
};

type QuranData = {
  source: { name: string; url: string; text: string; sha256: Record<string, string>; notice?: string; mapping?: string };
  surahs: Surah[];
  /** [surah, ayah] where each juz starts, juz 1–30 in order */
  juz: [number, number][];
  /** [surah, ayah, type] */
  sajdas: [number, number, string][];
};

type Text = {
  data: QuranData;
  /** Global index (0-based) of each surah's first ayah, by surah number. */
  start: number[];
  total: number;
  sajdas: Set<number>;
};

function prepare(data: QuranData): Text {
  const start: number[] = [0];
  let running = 0;
  for (const s of data.surahs) {
    start[s.n] = running;
    running += s.ayahs.length;
  }
  return { data, start, total: running, sajdas: new Set(data.sajdas.map(([s, a]) => s * 1000 + a)) };
}

const texts: Record<Riwayah, Text> = {
  hafs: prepare(hafsRaw as unknown as QuranData),
  qalun: prepare(qalunRaw as unknown as QuranData),
};

let active: Riwayah = 'hafs';

/**
 * Picks the text every function below reads. The store calls this when the
 * setting loads or changes, and the app remounts its screens right after.
 */
export function setActiveRiwayah(r: Riwayah): void {
  active = r === 'qalun' ? 'qalun' : 'hafs';
}

export function activeRiwayah(): Riwayah {
  return active;
}

/** Hafs (Tanzil) data, for the source notice. */
export const hafsQuran = texts.hafs.data;
export const qalunQuran = texts.qalun.data;

export function quranText(): QuranData {
  return texts[active].data;
}

export const SURAH_COUNT = 114;
export const JUZ_COUNT = 30;

/** Ayahs in the active riwayah: 6236 (Hafs) or 6214 (Qalun). */
export function totalAyahs(): number {
  return texts[active].total;
}

export function getSurah(n: number): Surah {
  return texts[active].data.surahs[n - 1];
}

/** 0-based position of an ayah in the whole Qur'an (1:1 → 0). */
export function globalAyahIndex(s: number, a: number): number {
  return texts[active].start[s] + Math.max(a, 1) - 1;
}

/** Juz (1–30) containing surah:ayah. Ayah 0 (the header card) counts as ayah 1. */
export function juzOf(s: number, a: number): number {
  const key = s * 1000 + Math.max(a, 1);
  const juz = texts[active].data.juz;
  let result = 1;
  for (let i = 0; i < juz.length; i++) {
    const [js, ja] = juz[i];
    if (js * 1000 + ja <= key) result = i + 1;
    else break;
  }
  return result;
}

export function isSajda(s: number, a: number): boolean {
  return texts[active].sajdas.has(s * 1000 + a);
}

export function clampPosition(s: number, a: number): { s: number; a: number } {
  const surah = Math.min(Math.max(Math.round(s) || 1, 1), SURAH_COUNT);
  const max = getSurah(surah).ayahs.length;
  return { s: surah, a: Math.min(Math.max(Math.round(a) || 0, 0), max) };
}

/** Hafs ayahs (same surah) that a Qalun ayah covers. */
export function qalunToHafs(s: number, a: number): [number, number] {
  const range = texts.qalun.data.surahs[s - 1]?.hafs?.[a - 1];
  return range ?? [a, a];
}

/**
 * The Qalun ayah that contains a Hafs ayah. Where Qalun splits a Hafs ayah in
 * two, the one that starts with it wins, so converting back and forth is stable.
 */
export function hafsToQalun(s: number, a: number): number {
  const ranges = texts.qalun.data.surahs[s - 1]?.hafs ?? [];
  const starts = ranges.findIndex(([first]) => first === a);
  if (starts >= 0) return starts + 1;
  const i = ranges.findIndex(([first, last]) => a >= first && a <= last);
  return i >= 0 ? i + 1 : a;
}

/** Moves an ayah reference from one riwayah's numbering to the other's. Ayah 0 (header) stays 0. */
export function convertAyah(s: number, a: number, from: Riwayah, to: Riwayah): number {
  if (from === to || a <= 0) return a;
  return to === 'qalun' ? hafsToQalun(s, a) : qalunToHafs(s, a)[0];
}

/** Hafs ayahs whose tafsir belongs to this ayah in the active riwayah. */
export function hafsRange(s: number, a: number): [number, number] {
  return active === 'qalun' ? qalunToHafs(s, a) : [a, a];
}

/** Global index in the Hafs numbering, whatever the active riwayah (tafsir is keyed by it). */
export function hafsGlobalIndex(s: number, a: number): number {
  return texts.hafs.start[s] + Math.max(a, 1) - 1;
}
