import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { getSurah, globalAyahIndex, isSajda, juzOf, hafsQuran as quran, SURAH_COUNT, totalAyahs } from './quran';

describe('bundled Qur\'an data', () => {
  it('has every surah and ayah', () => {
    expect(SURAH_COUNT).toBe(114);
    expect(totalAyahs()).toBe(6236);
    expect(quran.surahs.map((s) => s.n)).toEqual(Array.from({ length: 114 }, (_, i) => i + 1));
  });

  it('matches known surah lengths', () => {
    expect(getSurah(1).ayahs).toHaveLength(7);
    expect(getSurah(2).ayahs).toHaveLength(286);
    expect(getSurah(9).ayahs).toHaveLength(129);
    expect(getSurah(26).ayahs).toHaveLength(227);
    expect(getSurah(103).ayahs).toHaveLength(3);
    expect(getSurah(114).ayahs).toHaveLength(6);
  });

  it('places the basmala correctly', () => {
    expect(getSurah(1).basmala).toBeNull();
    expect(getSurah(9).basmala).toBeNull();
    expect(getSurah(1).ayahs[0]).toBe(getSurah(2).basmala);
    const withBasmala = quran.surahs.filter((s) => s.basmala !== null).map((s) => s.n);
    expect(withBasmala).toHaveLength(112);
    // Surahs 95 and 97 carry the Madina Mushaf's shadda on the bāʾ; the rest share one form.
    const forms = new Set(quran.surahs.map((s) => s.basmala).filter(Boolean));
    expect(forms.size).toBe(2);
  });

  it('marks the 15 sajdah ayahs, and only those', () => {
    expect(quran.sajdas).toHaveLength(15);
    let signs = 0;
    for (const s of quran.surahs) {
      s.ayahs.forEach((text, i) => {
        const has = text.includes('۩');
        if (has) signs++;
        expect(has).toBe(isSajda(s.n, i + 1));
      });
    }
    expect(signs).toBe(15);
  });

  it('maps positions to juz', () => {
    expect(juzOf(1, 0)).toBe(1);
    expect(juzOf(2, 141)).toBe(1);
    expect(juzOf(2, 142)).toBe(2);
    expect(juzOf(78, 1)).toBe(30);
    expect(juzOf(114, 6)).toBe(30);
  });

  it('numbers ayahs across the whole Qur\'an', () => {
    expect(globalAyahIndex(1, 1)).toBe(0);
    expect(globalAyahIndex(2, 1)).toBe(7);
    expect(globalAyahIndex(114, 6)).toBe(6235);
  });

  it('was built from the pinned source files', () => {
    for (const [file, hash] of Object.entries(quran.source.sha256)) {
      const buf = readFileSync(path.join(__dirname, '../../data-src/tanzil', file));
      expect(createHash('sha256').update(buf).digest('hex')).toBe(hash);
    }
  });

  it('holds every ayah exactly as written in the Tanzil file', () => {
    const xml = readFileSync(path.join(__dirname, '../../data-src/tanzil/quran-uthmani.xml'), 'utf8');
    const fromXml = [...xml.matchAll(/<aya index="\d+" text="([^"]*)"/g)].map((m) => m[1]);
    const fromApp = quran.surahs.flatMap((s) => s.ayahs);
    expect(fromXml).toHaveLength(6236);
    expect(fromApp).toEqual(fromXml);
  });

  it('carries the Tanzil copyright notice', () => {
    expect(quran.source.notice).toContain('PLEASE DO NOT REMOVE OR CHANGE THIS COPYRIGHT BLOCK');
    expect(quran.source.notice).toContain('tanzil.net');
  });
});
