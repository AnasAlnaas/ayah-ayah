import { useEffect, useState } from 'react';

import { globalAyahIndex } from './quran';

export type TafsirData = {
  source: {
    name: string;
    author: string;
    via: string;
    url: string;
    terms: string;
    sha256: string;
    notice: string;
  };
  /** One entry per ayah in mushaf order (1:1 … 114:6). */
  ayahs: string[];
};

let loaded: TafsirData | null = null;
let loading: Promise<TafsirData> | null = null;

/**
 * Tafsir al-Muyassar is 2.5 MB of text, so it loads on first use rather than
 * at startup. The reader asks for it shortly after opening, so the first tap
 * on an ayah usually finds it ready.
 */
export function loadTafsir(): Promise<TafsirData> {
  if (loaded) return Promise.resolve(loaded);
  loading ??= import('@/assets/data/tafsir-muyassar.json').then((mod) => {
    const data = ((mod as { default?: unknown }).default ?? mod) as TafsirData;
    loaded = data;
    return data;
  });
  return loading;
}

export function useTafsir(): TafsirData | null {
  const [data, setData] = useState<TafsirData | null>(loaded);
  useEffect(() => {
    if (data) return;
    let alive = true;
    loadTafsir().then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, [data]);
  return data;
}

export function tafsirFor(data: TafsirData, s: number, a: number): string {
  return data.ayahs[globalAyahIndex(s, a)] ?? '';
}
