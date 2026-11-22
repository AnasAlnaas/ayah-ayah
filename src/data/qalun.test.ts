import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  activeRiwayah,
  convertAyah,
  getSurah,
  globalAyahIndex,
  hafsToQalun,
  isSajda,
  juzOf,
  qalunQuran,
  qalunToHafs,
  setActiveRiwayah,
  totalAyahs,
} from './quran';
import { tafsirFor, type TafsirData } from './tafsir';

const tafsir = JSON.parse(readFileSync(path.join(__dirname, '../../assets/data/tafsir-muyassar.json'), 'utf8')) as TafsirData;

afterEach(() => setActiveRiwayah('hafs'));

describe('Qalun text', () => {
  it('has 6,214 ayahs in 114 surahs', () => {
    setActiveRiwayah('qalun');
    expect(activeRiwayah()).toBe('qalun');
    expect(totalAyahs()).toBe(6214);
    expect(qalunQuran.surahs).toHaveLength(114);
    expect(globalAyahIndex(114, getSurah(114).ayahs.length)).toBe(6213);
  });

  it('keeps the source files pinned', () => {
    for (const [file, hash] of Object.entries(qalunQuran.source.sha256)) {
      const buf = readFileSync(path.join(__dirname, '../../data-src/kfgqpc', file));
      expect(createHash('sha256').update(buf).digest('hex')).toBe(hash);
    }
  });

  it('keeps every word of the source', () => {
    const rows = JSON.parse(readFileSync(path.join(__dirname, '../../data-src/kfgqpc/QaloonData_v10.json'), 'utf8')) as {
      sura_no: number;
      aya_no: number;
      aya_text: string;
    }[];
    const words = (t: string) => t.split(/[\s ]+/).filter(Boolean);
    for (const r of rows) {
      const app = qalunQuran.surahs[r.sura_no - 1].ayahs[r.aya_no - 1];
      expect(words(app)).toEqual(words(r.aya_text).slice(0, -1));
    }
  });

  it('starts Al-Fatiha with al-hamd and gives it a header basmala', () => {
    setActiveRiwayah('qalun');
    expect(getSurah(1).ayahs).toHaveLength(7);
    expect(getSurah(1).ayahs[0].startsWith('اِ۬لْحَمْدُ')).toBe(true);
    expect(getSurah(1).basmala).not.toBeNull();
    expect(getSurah(9).basmala).toBeNull();
  });

  it('has its own juz and sajdah positions', () => {
    setActiveRiwayah('qalun');
    expect(juzOf(2, 1)).toBe(1);
    expect(juzOf(114, 6)).toBe(30);
    expect(isSajda(7, 206)).toBe(true);
  });
});

describe('Hafs ↔ Qalun mapping', () => {
  it('maps Al-Fatiha', () => {
    expect(qalunToHafs(1, 1)).toEqual([1, 2]); // the Hafs basmala and al-hamd
    expect(qalunToHafs(1, 7)).toEqual([7, 7]);
    expect(hafsToQalun(1, 1)).toBe(1);
    expect(hafsToQalun(1, 3)).toBe(2);
  });

  it('sends every Hafs ayah to a Qalun ayah that contains it, and back to itself', () => {
    for (const s of qalunQuran.surahs) {
      const hafsCount = s.hafs![s.hafs!.length - 1][1];
      for (let h = 1; h <= hafsCount; h++) {
        const q = convertAyah(s.n, h, 'hafs', 'qalun');
        const [first, last] = qalunToHafs(s.n, q);
        expect(h >= first && h <= last).toBe(true);
        expect(convertAyah(s.n, q, 'qalun', 'hafs')).toBe(first);
      }
    }
  });

  it('lands a Qalun ayah on itself or, where Qalun splits one Hafs ayah in two, on the first half', () => {
    for (const s of qalunQuran.surahs) {
      s.ayahs.forEach((_, i) => {
        const back = convertAyah(s.n, convertAyah(s.n, i + 1, 'qalun', 'hafs'), 'hafs', 'qalun');
        expect(back === i + 1 || (back === i && qalunToHafs(s.n, i)[0] === qalunToHafs(s.n, i + 1)[0])).toBe(true);
      });
    }
  });

  it('keeps the header card as ayah 0', () => {
    expect(convertAyah(2, 0, 'hafs', 'qalun')).toBe(0);
  });

  it('gives a Qalun ayah the tafsir of every Hafs ayah it covers', () => {
    setActiveRiwayah('qalun');
    const t = tafsirFor(tafsir, 1, 1);
    expect(t).toContain(tafsir.ayahs[0]);
    expect(t).toContain(tafsir.ayahs[1]);
  });
});
